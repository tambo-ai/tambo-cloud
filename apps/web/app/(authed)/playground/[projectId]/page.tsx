/**
 * Playground Page
 *
 * Main playground interface combining Tambo AI chat with live sandbox preview.
 * Protected route - requires authentication and project ownership.
 */

import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import { getDb, operations } from "@tambo-ai-cloud/db";
import { PlaygroundClient } from "./playground-client";

interface PlaygroundPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function PlaygroundPage({ params }: PlaygroundPageProps) {
  const { projectId } = await params;
  // 1. Check authentication
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!session || !userId) {
    redirect("/login");
  }

  // 2. Fetch project
  const db = getDb(env.DATABASE_URL);
  const project = await operations.getProject(db, projectId);

  if (!project) {
    notFound();
  }

  // 3. Check project membership
  const isMember = project.members?.some((m) => m.userId === userId);

  if (!isMember) {
    redirect("/dashboard");
  }

  // 4. Get project's API key
  let apiKeys = await operations.getApiKeys(db, projectId);
  if (!apiKeys || apiKeys.length === 0) {
    // Ensure an API key exists so the client doesn't block on first load
    await operations.createApiKey(db, env.API_KEY_SECRET, {
      projectId,
      userId,
      name: "Playground Default",
    });
    apiKeys = await operations.getApiKeys(db, projectId);
  }

  // 5. Render client component with project data
  return (
    <PlaygroundClient
      project={{
        id: project.id,
        name: project.name,
        freestyleRepoId: project.freestyleRepoId || undefined,
        freestyleRepoUrl: project.freestyleRepoUrl || undefined,
        templateGitUrl: project.templateGitUrl || undefined,
      }}
      hasApiKey={apiKeys.length > 0}
    />
  );
}

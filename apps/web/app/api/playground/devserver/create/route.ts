/**
 * API Route: Create Freestyle Dev Server
 *
 * Creates a Freestyle repository from a Git URL and requests a dev server.
 * Requires authentication and project ownership.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import { getDb, operations } from "@tambo-ai-cloud/db";
import {
  createFreestyleRepo,
  getDevServerHandle,
} from "@/lib/playground/dev-server-manager";

export const runtime = "nodejs";

// Default template repo if none provided
const DEFAULT_GIT_URL = "https://github.com/tambo-ai/tambo-template";

interface CreateDevServerRequest {
  projectId: string;
  gitUrl?: string;
  name?: string;
  repoId?: string; // Optional: use existing repo
}

interface CreateDevServerResponse {
  success: boolean;
  repoId?: string;
  repoUrl?: string;
  ephemeralUrl?: string;
  error?: string;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<CreateDevServerResponse>> {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!session || !userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // 2. Parse request body
    const body = (await request
      .json()
      .catch(() => ({}))) as CreateDevServerRequest;
    const { projectId, gitUrl, name, repoId: existingRepoId } = body;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "projectId is required" },
        { status: 400 },
      );
    }

    // 3. Verify project ownership
    const db = getDb(env.DATABASE_URL);
    const project = await operations.getProject(db, projectId);

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 },
      );
    }

    // Check if user is a member
    const isMember = project.members?.some((m) => m.userId === userId);

    if (!isMember) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    // 4. Create or use existing Freestyle repo
    let finalRepoId: string;
    let finalRepoUrl: string | undefined;

    if (existingRepoId) {
      // Use existing repo (verify it belongs to this project)
      if (project.freestyleRepoId !== existingRepoId) {
        return NextResponse.json(
          {
            success: false,
            error: "Repository does not belong to this project",
          },
          { status: 403 },
        );
      }
      finalRepoId = existingRepoId;
      finalRepoUrl = project.freestyleRepoUrl ?? undefined;
    } else {
      // Create new repo from Git URL
      const sourceUrl = gitUrl || DEFAULT_GIT_URL;
      const repoName = name || `${project.name}-playground`;

      const { repoId: newRepoId, repoUrl: newRepoUrl } =
        await createFreestyleRepo(repoName, sourceUrl);

      finalRepoId = newRepoId;
      finalRepoUrl = newRepoUrl;

      // Update project with repo info
      await operations.updateProject(db, projectId, {
        freestyleRepoId: newRepoId,
        freestyleRepoUrl: newRepoUrl,
        templateGitUrl: sourceUrl,
        playgroundEnabled: true,
      });
    }

    // 5. Request dev server
    const handle = await getDevServerHandle(finalRepoId);

    // Extract ephemeral URL if available
    const ephemeralUrl =
      (handle as any)?.ephemeralUrl || (handle as any)?.url || undefined;

    // 6. Return success response
    return NextResponse.json({
      success: true,
      repoId: finalRepoId,
      repoUrl: finalRepoUrl,
      ephemeralUrl,
    });
  } catch (error: any) {
    console.error("[API] Error creating dev server:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create dev server",
      },
      { status: 500 },
    );
  }
}

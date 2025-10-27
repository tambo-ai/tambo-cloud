/**
 * API Route: Read File from Freestyle Sandbox
 *
 * Reads a file from the sandbox filesystem.
 * Requires authentication and project ownership.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import { getDb, operations } from "@tambo-ai-cloud/db";
import { withDevServer } from "@/lib/playground/dev-server-manager";

export const runtime = "nodejs";

interface ReadFileRequest {
  projectId: string;
  repoId: string;
  path: string;
}

interface ReadFileResponse {
  success: boolean;
  content?: string;
  error?: string;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ReadFileResponse>> {
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

    // 2. Parse request
    const body = (await request.json().catch(() => ({}))) as ReadFileRequest;
    const { projectId, repoId, path } = body;

    if (!projectId || !repoId || !path) {
      return NextResponse.json(
        { success: false, error: "projectId, repoId, and path are required" },
        { status: 400 },
      );
    }

    // 3. Verify project ownership
    const db = getDb(env.DATABASE_URL);
    const project = await operations.getProject(db, projectId);

    if (!project || project.freestyleRepoId !== repoId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    const isMember = project.members?.some((m) => m.userId === userId);
    if (!isMember) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    // 4. Read file from sandbox
    const content = await withDevServer(repoId, async (handle) => {
      return await handle.fs.readFile(path);
    });

    return NextResponse.json({
      success: true,
      content,
    });
  } catch (error: any) {
    console.error("[API] Error reading file:", error);

    return NextResponse.json(
      { success: false, error: error?.message || "Failed to read file" },
      { status: 500 },
    );
  }
}

/**
 * API Route: List Directory in Freestyle Sandbox
 *
 * Lists files and directories in the sandbox filesystem.
 * Requires authentication and project ownership.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import { getDb, operations } from "@tambo-ai-cloud/db";
import { withDevServer } from "@/lib/playground/dev-server-manager";

export const runtime = "nodejs";

interface ListDirectoryRequest {
  projectId: string;
  repoId: string;
  path: string;
}

interface ListDirectoryResponse {
  success: boolean;
  files?: string[];
  error?: string;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ListDirectoryResponse>> {
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
    const body = (await request
      .json()
      .catch(() => ({}))) as ListDirectoryRequest;
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

    // 4. List directory in sandbox
    const files = await withDevServer(repoId, async (handle) => {
      return await handle.fs.ls(path);
    });

    return NextResponse.json({
      success: true,
      files,
    });
  } catch (error: any) {
    console.error("[API] Error listing directory:", error);

    return NextResponse.json(
      { success: false, error: error?.message || "Failed to list directory" },
      { status: 500 },
    );
  }
}

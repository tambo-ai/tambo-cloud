/**
 * API Route: Write File to Freestyle Sandbox
 *
 * Writes content to a file in the sandbox filesystem.
 * Requires authentication and project ownership.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import { getDb, operations } from "@tambo-ai-cloud/db";
import { withDevServer } from "@/lib/playground/dev-server-manager";

export const runtime = "nodejs";

interface WriteFileRequest {
  projectId: string;
  repoId: string;
  path: string;
  content: string;
}

interface WriteFileResponse {
  success: boolean;
  error?: string;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<WriteFileResponse>> {
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
    const body = (await request.json().catch(() => ({}))) as WriteFileRequest;
    const { projectId, repoId, path, content } = body;

    if (!projectId || !repoId || !path || content === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "projectId, repoId, path, and content are required",
        },
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

    // 4. Write file to sandbox
    await withDevServer(repoId, async (handle) => {
      await handle.fs.writeFile(path, content);
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("[API] Error writing file:", error);

    return NextResponse.json(
      { success: false, error: error?.message || "Failed to write file" },
      { status: 500 },
    );
  }
}

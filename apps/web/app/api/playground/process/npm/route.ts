/**
 * API Route: Run npm install in Freestyle Sandbox
 *
 * Runs npm install in the sandbox environment.
 * Requires authentication and project ownership.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import { getDb, operations } from "@tambo-ai-cloud/db";
import { withDevServer } from "@/lib/playground/dev-server-manager";

export const runtime = "nodejs";

interface NpmInstallRequest {
  projectId: string;
  repoId: string;
  cwd?: string;
}

interface NpmInstallResponse {
  success: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<NpmInstallResponse>> {
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
    const body = (await request.json().catch(() => ({}))) as NpmInstallRequest;
    const { projectId, repoId, cwd } = body;

    if (!projectId || !repoId) {
      return NextResponse.json(
        { success: false, error: "projectId and repoId are required" },
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

    // 4. Run npm install in sandbox
    const result: any = await withDevServer(repoId, async (handle) => {
      const command = "npm install";
      const options: any = {};

      if (cwd) options.cwd = cwd;

      return await handle.process.exec(command, options);
    });

    // Convert stdout/stderr arrays to strings
    const stdout = Array.isArray(result.stdout)
      ? result.stdout.join("\n")
      : result.stdout || "";
    const stderr = Array.isArray(result.stderr)
      ? result.stderr.join("\n")
      : result.stderr || "";

    return NextResponse.json({
      success: true,
      message: "npm install completed successfully",
      stdout,
      stderr,
    });
  } catch (error: any) {
    console.error("[API] Error running npm install:", error);

    return NextResponse.json(
      { success: false, error: error?.message || "Failed to run npm install" },
      { status: 500 },
    );
  }
}

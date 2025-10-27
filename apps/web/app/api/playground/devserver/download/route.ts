/**
 * API Route: Download Freestyle Repository
 *
 * Downloads a Freestyle repository as a zip file.
 * Requires authentication and project ownership.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { env as appEnv } from "@/lib/env";
import { getDb, operations } from "@tambo-ai-cloud/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!session || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get repoId from query params
    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get("repoId");
    const projectId = searchParams.get("projectId");

    if (!repoId) {
      return NextResponse.json(
        { error: "repoId is required" },
        { status: 400 },
      );
    }

    // 3. Verify project ownership if projectId provided
    if (projectId) {
      const db = getDb(appEnv.DATABASE_URL);
      const project = await operations.getProject(db, projectId);

      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 },
        );
      }

      // Check if user is a member
      const isMember = project.members?.some((m) => m.userId === userId);

      if (!isMember) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Verify repo belongs to project
      if (project.freestyleRepoId !== repoId) {
        return NextResponse.json(
          { error: "Repository does not belong to this project" },
          { status: 403 },
        );
      }
    }

    // 4. Download zip from Freestyle API
    const apiKey = appEnv.FREESTYLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Freestyle API key not configured" },
        { status: 500 },
      );
    }

    const freestyleUrl = `https://api.freestyle.sh/git/v1/repo/${encodeURIComponent(repoId)}/zip?ref=HEAD`;

    const response = await fetch(freestyleUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(`[API] Failed to download repo ${repoId}:`, errorText);

      return NextResponse.json(
        { error: `Failed to download repository: ${response.status}` },
        { status: response.status },
      );
    }

    // 5. Stream the zip file to client
    const blob = await response.blob();

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${repoId}.zip"`,
      },
    });
  } catch (error: any) {
    console.error("[API] Error downloading repository:", error);

    return NextResponse.json(
      { error: error?.message || "Failed to download repository" },
      { status: 500 },
    );
  }
}

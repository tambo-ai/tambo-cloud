/**
 * API Route: Get or Create Tambo API Key (Project-scoped)
 * (Playground namespace)
 *
 * Returns presence of a project API key and a masked representation.
 * If no key exists, creates one. Never returns the raw secret.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import { getDb, operations } from "@tambo-ai-cloud/db";

export const runtime = "nodejs";

interface EnsureKeyRequest {
  projectId: string;
}

interface EnsureKeyResponse {
  success: boolean;
  hasKey: boolean;
  keyId?: string;
  masked?: string | null; // partially hidden key string from DB
  error?: string;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<EnsureKeyResponse>> {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!session || !userId) {
      return NextResponse.json(
        { success: false, hasKey: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as EnsureKeyRequest;
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { success: false, hasKey: false, error: "projectId is required" },
        { status: 400 },
      );
    }

    const db = getDb(env.DATABASE_URL);

    // Verify project access
    const project = await operations.getProject(db, projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, hasKey: false, error: "Project not found" },
        { status: 404 },
      );
    }
    const isMember = project.members?.some((m) => m.userId === userId);
    if (!isMember) {
      return NextResponse.json(
        { success: false, hasKey: false, error: "Access denied" },
        { status: 403 },
      );
    }

    // Fetch existing keys
    let keys = await operations.getApiKeys(db, projectId);
    if (!keys || keys.length === 0) {
      // Create a default key
      await operations.createApiKey(db, env.API_KEY_SECRET, {
        projectId,
        userId,
        name: "Playground Default",
      });
      // Refresh rows for masked view
      keys = await operations.getApiKeys(db, projectId);

      // Mark project as having an API key (usage tracking)
      await operations.updateApiKeyStatus(db, projectId, true);
    }

    const keyRow = keys[0];

    return NextResponse.json({
      success: true,
      hasKey: true,
      keyId: keyRow?.id,
      masked: keyRow?.partiallyHiddenKey,
    });
  } catch (error: any) {
    console.error("[API] playground/get-or-create tambo api key error:", error);
    return NextResponse.json(
      {
        success: false,
        hasKey: false,
        error: error?.message || "Failed to ensure API key",
      },
      { status: 500 },
    );
  }
}

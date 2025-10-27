/**
 * Tambo Tools: Project API Key and Settings
 *
 * Tools to ensure a project-scoped Tambo API key exists and to manage settings.
 */

import type { TamboTool } from "@tambo-ai/react";
import { z } from "zod";

function getProjectIdFromUrl(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const parts = window.location.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === "playground");
    if (idx !== -1 && parts.length > idx + 1) return parts[idx + 1];
  } catch (_err) {
    return undefined;
  }
  return undefined;
}

function getContextProjectId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const projectId = getProjectIdFromUrl();
    if (projectId) {
      const w = window as any;
      const ctx = w.__playgroundContexts?.[projectId];
      return ctx?.projectId as string | undefined;
    }
    return undefined;
  } catch (_err) {
    return undefined;
  }
}

async function post<TOut>(
  url: string,
  args: Record<string, any>,
): Promise<TOut> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed (${res.status}): ${text}`);
  }
  return await res.json();
}

export const ensureTamboApiKeyTool: TamboTool = {
  name: "ensure_tambo_api_key",
  description:
    "Ensure the current project has a Tambo API key. If none exists, create one and record presence in context. Returns masked information only.",
  tool: async (args: { projectId?: string }) => {
    const projectId =
      args.projectId || getContextProjectId() || getProjectIdFromUrl() || "";
    if (!projectId) {
      throw new Error(
        "Missing projectId. Pass projectId or ensure PlaygroundContextController is mounted.",
      );
    }

    const res = await post<{
      success: boolean;
      hasKey: boolean;
      keyId?: string;
      masked?: string | null;
      error?: string;
    }>("/api/playground/api-keys/get-or-create", { projectId });

    if (!res.success || !res.hasKey) {
      throw new Error(res.error || "Failed to ensure Tambo API key");
    }

    // Update namespaced context snapshot to reflect presence
    if (typeof window !== "undefined") {
      try {
        const w = window as any;
        w.__playgroundContexts = w.__playgroundContexts || {};
        const ctx = w.__playgroundContexts[projectId] || {};
        w.__playgroundContexts[projectId] = {
          ...ctx,
          projectId,
          hasTamboApiKey: true,
          tamboKeyId: res.keyId,
        };
      } catch (_err) {
        void 0;
      }
    }

    return {
      success: true,
      message: res.masked ? `API key ready (${res.masked})` : "API key ready",
      keyId: res.keyId,
      hasKey: true,
    } as const;
  },
  toolSchema: z
    .function()
    .args(
      z.object({
        projectId: z.string().optional().describe("Project ID to operate on"),
      }),
    )
    .returns(
      z.object({
        success: z.boolean(),
        message: z.string(),
        keyId: z.string().optional(),
        hasKey: z.literal(true),
      }),
    ),
};

export const tamboTools: TamboTool[] = [ensureTamboApiKeyTool];

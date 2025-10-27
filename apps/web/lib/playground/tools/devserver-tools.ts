/**
 * Tambo Tools: Dev Server Operations
 *
 * Tools for creating and managing Freestyle dev servers.
 * These tools call server-side API routes with proper authentication.
 */

import type { TamboTool } from "@tambo-ai/react";
import { z } from "zod";

/**
 * Helper function to make authenticated POST requests
 */
async function post<TOut>(
  url: string,
  args: Record<string, any>,
): Promise<TOut> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // Include session cookies
    body: JSON.stringify(args),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed (${res.status}): ${text}`);
  }

  return await res.json();
}

/**
 * Read the playground context injected by PlaygroundContextController
 */
function getPlaygroundContext(): {
  projectId?: string;
  repoId?: string;
  repoUrl?: string;
  templateGitUrl?: string;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const w = window as any;
    // Prefer namespaced contexts map when available
    const projectId = getProjectIdFromUrl();
    if (
      projectId &&
      w.__playgroundContexts &&
      w.__playgroundContexts[projectId]
    ) {
      return w.__playgroundContexts[projectId];
    }
    return null;
  } catch (_err) {
    return null;
  }
}

/**
 * Extract projectId from the URL path /playground/[projectId]
 */
function getProjectIdFromUrl(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const parts = window.location.pathname.split("/").filter(Boolean);
    // Expect ["playground", "<projectId>"] or ["(authed)", "playground", "<projectId>"]
    const idx = parts.findIndex((p) => p === "playground");
    if (idx !== -1 && parts.length > idx + 1) {
      return parts[idx + 1];
    }
  } catch (_err) {
    // ignore
  }
  return undefined;
}

/**
 * Build a per-project storage key for devserver state
 */
function getStorageKey(projectId?: string) {
  const pid = projectId || getProjectIdFromUrl() || "";
  return pid ? `playgroundDevServer:${pid}` : "playgroundDevServer";
}

/**
 * Create a Freestyle dev server
 *
 * Creates a Freestyle repository from a Git URL and requests a dev server.
 * Updates the playground viewer with the new sandbox URL.
 */
export const createDevServerTool: TamboTool = {
  name: "create_dev_server",
  description:
    "Create or connect to a Freestyle development sandbox. Provide either a Git URL to import a repository, or use an existing repoId. If no parameters are provided, creates a sandbox from the default template. The sandbox will be displayed in the app viewer.",
  tool: async (args: {
    projectId: string;
    repoId?: string;
    gitUrl?: string;
    name?: string;
  }) => {
    // Fill missing args from playground context for convenience
    const ctx = getPlaygroundContext();
    const finalArgs = {
      ...args,
      projectId:
        args.projectId || ctx?.projectId || getProjectIdFromUrl() || "",
    } as typeof args;

    if (!finalArgs.projectId) {
      throw new Error(
        "Missing projectId. Provide projectId in the tool call or ensure PlaygroundContextController is mounted.",
      );
    }

    const res = await post<{
      success: boolean;
      repoId?: string;
      repoUrl?: string;
      ephemeralUrl?: string;
      error?: string;
    }>("/api/playground/devserver/create", finalArgs);

    if (!res.success) {
      throw new Error(res.error || "Failed to create dev server");
    }

    // Update localStorage for AppViewer component
    if (typeof window !== "undefined" && res.repoId && res.ephemeralUrl) {
      try {
        const storageKey = getStorageKey(finalArgs.projectId);
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({
            projectId: finalArgs.projectId,
            repoId: res.repoId,
            repoUrl: res.repoUrl,
            ephemeralUrl: res.ephemeralUrl,
          }),
        );

        // Notify listeners to update immediately
        window.dispatchEvent(new Event("playground:devserver:updated"));
      } catch (e) {
        console.warn("Failed to update localStorage:", e);
      }
    }

    return {
      success: true,
      repoId: res.repoId,
      repoUrl: res.repoUrl,
      ephemeralUrl: res.ephemeralUrl,
      message: res.ephemeralUrl
        ? `Dev server created successfully. Preview available at: ${res.ephemeralUrl}`
        : "Dev server created successfully.",
    };
  },
  toolSchema: z
    .function()
    .args(
      z.object({
        projectId: z
          .string()
          .describe("The project ID this sandbox belongs to"),
        repoId: z
          .string()
          .optional()
          .describe("Existing Freestyle repository ID (if already created)"),
        gitUrl: z
          .string()
          .url()
          .optional()
          .describe(
            "Git repository URL to import (e.g., https://github.com/user/repo)",
          ),
        name: z
          .string()
          .optional()
          .describe("Name for the Freestyle repository"),
      }),
    )
    .returns(
      z.object({
        success: z.boolean(),
        repoId: z.string().optional(),
        repoUrl: z.string().optional(),
        ephemeralUrl: z.string().optional(),
        message: z.string(),
      }),
    ),
};

/**
 * Set the app viewer URL
 *
 * Updates the app viewer to display a specific URL.
 * Useful for showing external previews or changing the displayed URL.
 */
export const setAppViewerUrlTool: TamboTool = {
  name: "set_app_viewer_url",
  description:
    "Update the app viewer to display a specific URL. Use this to show a preview of the application or change what's being displayed in the viewer.",
  tool: async (args: { url: string; repoId?: string; projectId?: string }) => {
    if (typeof window !== "undefined") {
      try {
        const storageKey = getStorageKey(args.projectId);
        const currentData = window.localStorage.getItem(storageKey);
        const current = currentData ? JSON.parse(currentData) : {};

        window.localStorage.setItem(
          storageKey,
          JSON.stringify({
            ...current,
            ephemeralUrl: args.url,
            repoId: args.repoId || current.repoId,
          }),
        );

        window.dispatchEvent(new Event("playground:devserver:updated"));
      } catch (e) {
        console.warn("Failed to update app viewer URL:", e);
      }
    }

    return {
      success: true,
      message: `App viewer updated to display: ${args.url}`,
    };
  },
  toolSchema: z
    .function()
    .args(
      z.object({
        url: z.string().url().describe("URL to display in the app viewer"),
        repoId: z
          .string()
          .optional()
          .describe("Optional repository ID associated with this URL"),
      }),
    )
    .returns(
      z.object({
        success: z.boolean(),
        message: z.string(),
      }),
    ),
};

/**
 * Clear the app viewer
 *
 * Clears the app viewer, showing the empty state.
 */
export const clearAppViewerTool: TamboTool = {
  name: "clear_app_viewer",
  description:
    "Clear the app viewer to show the empty state. Use this when you want to hide the preview or reset the viewer.",
  tool: async () => {
    if (typeof window !== "undefined") {
      try {
        const storageKey = getStorageKey();
        window.localStorage.removeItem(storageKey);
        window.dispatchEvent(new Event("playground:devserver:updated"));
      } catch (e) {
        console.warn("Failed to clear app viewer:", e);
      }
    }

    return {
      success: true,
      message: "App viewer cleared",
    };
  },
  toolSchema: z
    .function()
    .args(z.object({}))
    .returns(
      z.object({
        success: z.boolean(),
        message: z.string(),
      }),
    ),
};

export const devserverTools: TamboTool[] = [
  createDevServerTool,
  setAppViewerUrlTool,
  clearAppViewerTool,
];

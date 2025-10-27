/**
 * Dev Server Manager for Freestyle Sandboxes
 *
 * Manages Freestyle dev server connections with caching and retry logic.
 * Ensures efficient reuse of handles and graceful error handling.
 */

import { FreestyleSandboxes } from "freestyle-sandboxes";
import { env } from "@/lib/env";

type Handle = Awaited<ReturnType<FreestyleSandboxes["requestDevServer"]>>;

// Cache for dev server handles
const CACHE: Record<string, { handle: Handle; timestamp: number }> = {};
const TTL_MS = 60_000; // 60 seconds cache TTL

/**
 * Get Freestyle client instance
 * Server-side only - API key is never exposed to client
 */
function getFreestyleClient(): FreestyleSandboxes {
  const apiKey = env.FREESTYLE_API_KEY;

  if (!apiKey) {
    throw new Error("FREESTYLE_API_KEY environment variable is not configured");
  }

  return new FreestyleSandboxes({ apiKey });
}

/**
 * Request a fresh dev server handle for the given repo ID
 * @param repoId - Freestyle repository ID
 * @returns Fresh dev server handle
 */
async function requestFreshHandle(repoId: string): Promise<Handle> {
  const freestyle = getFreestyleClient();
  const handle = await freestyle.requestDevServer({ repoId });

  // Cache the handle
  CACHE[repoId] = {
    handle,
    timestamp: Date.now(),
  };

  return handle;
}

/**
 * Get a cached or fresh dev server handle
 * @param repoId - Freestyle repository ID
 * @returns Dev server handle (cached if still valid, fresh otherwise)
 */
export async function getDevServerHandle(repoId: string): Promise<Handle> {
  const cached = CACHE[repoId];

  // Return cached handle if still valid
  if (cached && Date.now() - cached.timestamp < TTL_MS) {
    return cached.handle;
  }

  // Request fresh handle if cache expired or doesn't exist
  return await requestFreshHandle(repoId);
}

/**
 * Execute a function with a dev server handle, with automatic retry logic
 *
 * Attempts to execute the function with a cached handle first.
 * If that fails, requests a fresh handle and retries once.
 *
 * @param repoId - Freestyle repository ID
 * @param fn - Function to execute with the handle
 * @returns Result of the function execution
 */
export async function withDevServer<T>(
  repoId: string,
  fn: (handle: Handle) => Promise<T>,
): Promise<T> {
  let handle = await getDevServerHandle(repoId);

  // Health check - try to verify handle is working
  try {
    // Simple health check: try to list root directory
    await handle.fs.ls("/");
  } catch (error) {
    // Handle is stale, request fresh one
    console.warn(
      `[DevServerManager] Cached handle for ${repoId} is stale, refreshing...`,
      error,
    );
    handle = await requestFreshHandle(repoId);
  }

  // Execute function with retry logic
  try {
    return await fn(handle);
  } catch (error) {
    // If execution fails, try once more with a fresh handle
    console.warn(
      `[DevServerManager] Operation failed for ${repoId}, retrying with fresh handle...`,
      error,
    );
    handle = await requestFreshHandle(repoId);
    return await fn(handle);
  }
}

/**
 * Create a Freestyle Git repository from a Git URL
 * @param name - Repository name
 * @param gitUrl - Git repository URL to import
 * @returns Created repository ID
 */
export async function createFreestyleRepo(
  name: string,
  gitUrl: string,
): Promise<{ repoId: string; repoUrl?: string }> {
  const freestyle = getFreestyleClient();

  try {
    // Try SDK method first
    const result = await freestyle.createGitRepository({
      name,
      public: true,
      source: { url: gitUrl },
    });

    return {
      repoId: result?.repoId || "",
      repoUrl: (result as any)?.url,
    };
  } catch (sdkError) {
    // Fallback to REST API
    console.warn(
      "[DevServerManager] SDK method failed, trying REST API fallback",
      sdkError,
    );

    const apiKey = env.FREESTYLE_API_KEY!;
    const response = await fetch("https://api.freestyle.sh/repos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        name,
        public: true,
        source: { type: "git", url: gitUrl },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Failed to create Freestyle repo (${response.status}): ${errorText}`,
      );
    }

    const data = await response.json();
    return {
      repoId: data?.repo_id || data?.repoId || data?.id,
      repoUrl: data?.repo_url || data?.repoUrl || data?.url,
    };
  }
}

/**
 * Clear cache for a specific repo ID
 * Useful when you know a handle is no longer valid
 */
export function clearCache(repoId: string): void {
  delete CACHE[repoId];
}

/**
 * Clear all cached handles
 * Use sparingly - mainly for testing or cleanup
 */
export function clearAllCache(): void {
  Object.keys(CACHE).forEach((key) => delete CACHE[key]);
}

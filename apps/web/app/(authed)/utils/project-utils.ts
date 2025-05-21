"use server";

import { createCaller } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

/**
 * Checks if the current user is authenticated
 * @returns Authentication status with session if authenticated or login info if not
 */
export async function checkAuthentication() {
  const ctx = await createTRPCContext({
    headers: new Headers(),
  });

  if (!ctx.session?.user) {
    return {
      authenticated: false,
      requiresAuthentication: true,
      loginUrl: "/login",
    };
  }

  return {
    authenticated: true,
    session: ctx.session,
    ctx: ctx,
  };
}

/**
 * Fetches all projects associated with the authenticated user
 * @returns List of user projects or authentication error
 */
export async function fetchUserProjects() {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    const projects = await caller.project.getUserProjects();
    return projects;
  } catch (error) {
    console.error("Error fetching projects:", error);
    return { success: false, error: "Failed to fetch projects" };
  }
}

/**
 * Retrieves API keys for a specific project
 * @param projectId - ID of the project to fetch API keys for
 * @returns List of API keys or authentication error
 */
export async function fetchProjectApiKeys(projectId: string) {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    const apiKeys = await caller.project.getApiKeys(projectId);
    return apiKeys;
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return { success: false, error: "Failed to fetch API keys" };
  }
}

/**
 * Generates a new API key for a project
 * @param projectId - ID of the project
 * @param name - Name for the new API key
 * @returns Newly created API key or error
 */
export async function generateProjectApiKey(projectId: string, name: string) {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    const newKey = await caller.project.generateApiKey({
      projectId,
      name,
    });
    return newKey;
  } catch (error) {
    console.error("Error generating API key:", error);
    return { success: false, error: "Failed to generate API key" };
  }
}

/**
 * Deletes an API key from a project
 * @param projectId - ID of the project containing the API key
 * @param apiKeyId - ID of the API key to delete
 * @returns Success status or error
 */
export async function deleteProjectApiKey(projectId: string, apiKeyId: string) {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    await caller.project.removeApiKey({
      projectId,
      apiKeyId,
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting API key:", error);
    return { success: false, error: "Failed to delete API key" };
  }
}

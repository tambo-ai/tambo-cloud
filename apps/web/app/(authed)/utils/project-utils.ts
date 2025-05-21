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

/**
 * Updates LLM settings for a project
 * @param projectId - ID of the project
 * @param defaultLlmProviderName - Name of the default LLM provider
 * @param defaultLlmModelName - Name of the default LLM model
 * @param customLlmModelName - Custom LLM model name
 * @param customLlmBaseURL - Base URL for custom LLM
 * @returns Updated settings or error
 */
export async function updateProjectLlmSettings({
  projectId,
  defaultLlmProviderName,
  defaultLlmModelName,
  customLlmModelName,
  customLlmBaseURL,
}: {
  projectId: string;
  defaultLlmProviderName: string;
  defaultLlmModelName: string | null;
  customLlmModelName: string | null;
  customLlmBaseURL: string | null;
}) {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    const updatedSettings = await caller.project.updateProjectLlmSettings({
      projectId,
      defaultLlmProviderName,
      defaultLlmModelName,
      customLlmModelName,
      customLlmBaseURL,
    });
    return { success: true, data: updatedSettings };
  } catch (error) {
    console.error("Error updating LLM settings:", error);
    return { success: false, error: "Failed to update LLM settings" };
  }
}

/**
 * Adds or updates a provider API key for a project
 * @param projectId - ID of the project
 * @param provider - Name of the LLM provider
 * @param providerKey - API key for the provider
 * @returns Success status or error
 */
export async function addOrUpdateProviderKey({
  projectId,
  provider,
  providerKey,
}: {
  projectId: string;
  provider: string;
  providerKey: string | undefined;
}) {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    await caller.project.addProviderKey({
      projectId,
      provider,
      providerKey,
    });
    return { success: true };
  } catch (error) {
    console.error("Error saving provider key:", error);
    return { success: false, error: "Failed to save provider key" };
  }
}

/**
 * Fetches LLM provider configuration
 * @returns LLM provider configuration or error
 */
export async function fetchLlmProviderConfig() {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    const config = await caller.llm.getLlmProviderConfig();
    return config;
  } catch (error) {
    console.error("Error fetching LLM provider config:", error);
    return {
      success: false,
      error: "Failed to fetch LLM provider configuration",
    };
  }
}

/**
 * Fetches LLM settings for a project
 * @param projectId - ID of the project
 * @returns Project LLM settings or error
 */
export async function fetchProjectLlmSettings(projectId: string) {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    const settings = await caller.project.getProjectLlmSettings({
      projectId,
    });
    return settings;
  } catch (error) {
    console.error("Error fetching project LLM settings:", error);
    return { success: false, error: "Failed to fetch project LLM settings" };
  }
}

/**
 * Fetches provider keys for a project
 * @param projectId - ID of the project
 * @returns Provider keys or error
 */
export async function fetchProviderKeys(projectId: string) {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    const keys = await caller.project.getProviderKeys(projectId);
    return keys;
  } catch (error) {
    console.error("Error fetching provider keys:", error);
    return { success: false, error: "Failed to fetch provider keys" };
  }
}

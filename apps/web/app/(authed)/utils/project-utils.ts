"use server";

import { createCaller } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { ComposioAuthMode, MCPTransport } from "@tambo-ai-cloud/core";

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

export async function getCaller() {
  const ctx = await createTRPCContext({
    headers: new Headers(),
  });
  const caller = createCaller(ctx);
  return caller;
}

/**
 * Fetches all projects associated with the authenticated user
 * @returns List of user projects or authentication error
 */
export async function fetchUserProjects() {
  const caller = await getCaller();
  const projects = await caller.project.getUserProjects();
  return projects;
}

export async function updateProject(
  projectId: string,
  project: {
    name: string;
    customInstructions: string;
    defaultLlmProviderName: string;
    defaultLlmModelName: string;
    customLlmModelName: string;
    customLlmBaseURL: string;
  },
) {
  const caller = await getCaller();
  const updatedProject = await caller.project.updateProject({
    projectId,
    name: project.name,
    customInstructions: project.customInstructions,
    defaultLlmProviderName: project.defaultLlmProviderName,
    defaultLlmModelName: project.defaultLlmModelName,
    customLlmModelName: project.customLlmModelName,
    customLlmBaseURL: project.customLlmBaseURL,
  });
  return updatedProject;
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

/**
 * Fetches a specific project by ID
 * @param projectId - ID of the project to fetch
 * @returns Project details or authentication error
 */
export async function fetchProjectById(projectId: string) {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    const projects = await caller.project.getUserProjects();
    const project = projects.find((p) => p.id === projectId);

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    return project;
  } catch (error) {
    console.error("Error fetching project:", error);
    return { success: false, error: "Failed to fetch project" };
  }
}

/**
 * Fetches custom instructions for a project
 * @param projectId - ID of the project
 * @returns Project custom instructions or error
 */
export async function fetchProjectCustomInstructions(projectId: string) {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    const projects = await caller.project.getUserProjects();
    const project = projects.find((p) => p.id === projectId);

    if (!project) {
      return {
        success: false,
        error: "Project not found",
      };
    }

    return {
      success: true,
      customInstructions: project.customInstructions,
    };
  } catch (error) {
    console.error("Error fetching project custom instructions:", error);
    return {
      success: false,
      error: "Failed to fetch project custom instructions",
    };
  }
}

/**
 * Updates custom instructions for a project
 * @param projectId - ID of the project to update
 * @param customInstructions - New custom instructions text
 * @returns Success status or error
 */
export async function updateProjectCustomInstructions({
  projectId,
  customInstructions,
}: {
  projectId: string;
  customInstructions: string;
}) {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    await caller.project.updateProject({
      projectId,
      customInstructions,
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating custom instructions:", error);
    return { success: false, error: "Failed to update custom instructions" };
  }
}

/**
 * Creates a new project with a simple name
 * @param name - Name of the project
 * @returns Newly created project or error
 */
export async function createProject(name: string) {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    const project = await caller.project.createProject(name);
    return { success: true, project };
  } catch (error) {
    console.error("Error creating project:", error);
    return { success: false, error: "Failed to create project" };
  }
}

/**
 * Creates a new project with custom instructions and optional MCP servers
 * @param name - Name of the project
 * @param customInstructions - Custom instructions for the AI assistant
 * @param mcpServers - Optional array of MCP servers to configure
 * @returns Newly created project or error
 */
export async function createProjectWithCustomInstructions({
  name,
  customInstructions,
  mcpServers,
}: {
  name: string;
  customInstructions?: string | null;
  mcpServers?: Array<{
    url: string;
    customHeaders: Record<string, string>;
    mcpTransport: MCPTransport;
  }>;
}) {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    const project = await caller.project.createProject2({
      name,
      customInstructions,
      mcpServers,
    });
    return { success: true, project };
  } catch (error) {
    console.error("Error creating project with custom instructions:", error);
    return {
      success: false,
      error: "Failed to create project with custom instructions",
    };
  }
}

/**
 * Removes a project by ID
 * @param projectId - ID of the project to remove
 * @returns Success status or error
 */
export async function removeProject(projectId: string) {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    await caller.project.removeProject(projectId);
    return { success: true };
  } catch (error) {
    console.error("Error removing project:", error);
    return { success: false, error: "Failed to remove project" };
  }
}

/**
 * Updates the project name
 * @param projectId - ID of the project to update
 * @param name - New name for the project
 * @returns Updated project or error
 */
export async function updateProjectName({
  projectId,
  name,
}: {
  projectId: string;
  name: string;
}) {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    const updatedProject = await caller.project.updateProject({
      projectId,
      name,
    });
    return { success: true, project: updatedProject };
  } catch (error) {
    console.error("Error updating project name:", error);
    return { success: false, error: "Failed to update project name" };
  }
}

/**
 * Fetches the current authenticated user details
 * @returns User details or authentication error
 */
export async function fetchCurrentUser() {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    const user = await caller.user.getUser();
    return { success: true, user };
  } catch (error) {
    console.error("Error fetching user:", error);
    return { success: false, error: "Failed to fetch user" };
  }
}

/**
 * Fetches MCP servers for a project
 * @param projectId - ID of the project
 * @returns List of MCP servers or error
 */
export async function fetchProjectMcpServers(projectId: string) {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    const mcpServers = await caller.tools.listMcpServers({
      projectId,
    });
    return mcpServers;
  } catch (error) {
    console.error("Error fetching MCP servers:", error);
    return { success: false, error: "Failed to fetch MCP servers" };
  }
}

/**
 * Adds a new MCP server to a project
 * @param projectId - ID of the project
 * @param url - URL of the MCP server
 * @param customHeaders - Custom headers for the MCP server
 * @param mcpTransport - Transport mechanism for MCP communication
 * @returns Added MCP server or error
 */
export async function addMcpServer({
  projectId,
  url,
  customHeaders,
  mcpTransport,
}: {
  projectId: string;
  url: string;
  customHeaders: Record<string, string>;
  mcpTransport: MCPTransport;
}) {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    const mcpServer = await caller.tools.addMcpServer({
      projectId,
      url,
      customHeaders,
      mcpTransport,
    });
    return mcpServer;
  } catch (error) {
    console.error("Error adding MCP server:", error);
    return { success: false, error: "Failed to add MCP server" };
  }
}

/**
 * Updates an existing MCP server
 * @param projectId - ID of the project
 * @param serverId - ID of the MCP server to update
 * @param url - New URL for the MCP server
 * @param customHeaders - New custom headers for the MCP server
 * @param mcpTransport - New transport mechanism for MCP communication
 * @returns Updated MCP server or error
 */
export async function updateMcpServer({
  projectId,
  serverId,
  url,
  customHeaders,
  mcpTransport,
}: {
  projectId: string;
  serverId: string;
  url: string;
  customHeaders: Record<string, string>;
  mcpTransport: MCPTransport;
}) {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    const mcpServer = await caller.tools.updateMcpServer({
      projectId,
      serverId,
      url,
      customHeaders,
      mcpTransport,
    });
    return mcpServer;
  } catch (error) {
    console.error("Error updating MCP server:", error);
    return { success: false, error: "Failed to update MCP server" };
  }
}

/**
 * Deletes an MCP server
 * @param projectId - ID of the project
 * @param serverId - ID of the MCP server to delete
 * @returns Success status or error
 */
export async function deleteMcpServer({
  projectId,
  serverId,
}: {
  projectId: string;
  serverId: string;
}) {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    await caller.tools.deleteMcpServer({
      projectId,
      serverId,
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting MCP server:", error);
    return { success: false, error: "Failed to delete MCP server" };
  }
}

/**
 * Authorizes an MCP server
 * @param contextKey - Optional context key for authorization
 * @param toolProviderId - ID of the MCP server to authorize
 * @returns Authorization result or error
 */
export async function authorizeMcpServer({
  contextKey,
  toolProviderId,
}: {
  contextKey: string | null;
  toolProviderId: string;
}) {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    const authResult = await caller.tools.authorizeMcpServer({
      contextKey,
      toolProviderId,
    });
    return authResult;
  } catch (error) {
    console.error("Error authorizing MCP server:", error);
    return { success: false, error: "Failed to authorize MCP server" };
  }
}

/**
 * Inspects an MCP server to get available tools
 * @param projectId - ID of the project
 * @param serverId - ID of the MCP server to inspect
 * @returns List of available tools or error
 */
export async function inspectMcpServer({
  projectId,
  serverId,
}: {
  projectId: string;
  serverId: string;
}) {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    const toolInfo = await caller.tools.inspectMcpServer({
      projectId,
      serverId,
    });
    return toolInfo;
  } catch (error) {
    console.error("Error inspecting MCP server:", error);
    return { success: false, error: "Failed to inspect MCP server" };
  }
}

/**
 * Lists available apps/tools for a project
 * @param projectId - ID of the project
 * @returns List of available apps or error
 */
export async function listAvailableApps(projectId: string) {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    const apps = await caller.tools.listApps({
      projectId,
    });
    return apps;
  } catch (error) {
    console.error("Error listing available apps:", error);
    return { success: false, error: "Failed to list available apps" };
  }
}

/**
 * Enables an app/tool for a project
 * @param projectId - ID of the project
 * @param appId - ID of the app to enable
 * @returns Success status or error
 */
export async function enableApp({
  projectId,
  appId,
}: {
  projectId: string;
  appId: string;
}) {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    await caller.tools.enableApp({
      projectId,
      appId,
    });
    return { success: true };
  } catch (error) {
    console.error("Error enabling app:", error);
    return { success: false, error: "Failed to enable app" };
  }
}

/**
 * Disables an app/tool for a project
 * @param projectId - ID of the project
 * @param appId - ID of the app to disable
 * @returns Success status or error
 */
export async function disableApp({
  projectId,
  appId,
}: {
  projectId: string;
  appId: string;
}) {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    await caller.tools.disableApp({
      projectId,
      appId,
    });
    return { success: true };
  } catch (error) {
    console.error("Error disabling app:", error);
    return { success: false, error: "Failed to disable app" };
  }
}

/**
 * Gets authentication details for a Composio tool
 * @param projectId - ID of the project
 * @param appId - ID of the app to get authentication for
 * @param contextKey - Optional context key for the authentication
 * @returns Authentication details or error
 */
export async function getComposioAuth({
  projectId,
  appId,
  contextKey,
}: {
  projectId: string;
  appId: string;
  contextKey: string | null;
}) {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    const authDetails = await caller.tools.getComposioAuth({
      projectId,
      appId,
      contextKey,
    });
    return authDetails;
  } catch (error) {
    console.error("Error getting tool authentication:", error);
    return { success: false, error: "Failed to get tool authentication" };
  }
}

/**
 * Updates authentication for a Composio tool
 * @param projectId - ID of the project
 * @param appId - ID of the app to update authentication for
 * @param contextKey - Optional context key for the authentication
 * @param authMode - Authentication mode to use
 * @param authFields - Authentication field values
 * @returns Success status or error
 */
export async function updateComposioAuth({
  projectId,
  appId,
  contextKey,
  authMode,
  authFields,
}: {
  projectId: string;
  appId: string;
  contextKey: string | null;
  authMode: ComposioAuthMode;
  authFields: Record<string, string>;
}) {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    await caller.tools.updateComposioAuth({
      projectId,
      appId,
      contextKey,
      authMode,
      authFields,
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating tool authentication:", error);
    return { success: false, error: "Failed to update tool authentication" };
  }
}

/**
 * Checks the status of a Composio connected account
 * @param projectId - ID of the project
 * @param toolProviderId - ID of the tool provider to check
 * @param contextKey - Optional context key for the authentication
 * @returns Connection status or error
 */
export async function checkComposioConnectedAccountStatus({
  projectId,
  toolProviderId,
  contextKey,
}: {
  projectId: string;
  toolProviderId: string;
  contextKey: string | null;
}) {
  try {
    const authCheck = await checkAuthentication();

    if (!authCheck.authenticated) {
      return authCheck;
    }

    const caller = createCaller(authCheck.ctx!);

    const status = await caller.tools.checkComposioConnectedAccountStatus({
      projectId,
      toolProviderId,
      contextKey,
    });
    return status;
  } catch (error) {
    console.error("Error checking connected account status:", error);
    return {
      success: false,
      error: "Failed to check connected account status",
    };
  }
}

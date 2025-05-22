"use client";

import {
  addMcpServer,
  addOrUpdateProviderKey,
  authorizeMcpServer,
  checkComposioConnectedAccountStatus,
  createProject,
  createProjectWithCustomInstructions,
  deleteMcpServer,
  deleteProjectApiKey,
  disableApp,
  enableApp,
  fetchCurrentUser,
  fetchLlmProviderConfig,
  fetchProjectApiKeys,
  fetchProjectById,
  fetchProjectCustomInstructions,
  fetchProjectLlmSettings,
  fetchProjectMcpServers,
  fetchProviderKeys,
  generateProjectApiKey,
  getComposioAuth,
  inspectMcpServer,
  listAvailableApps,
  removeProject,
  updateComposioAuth,
  updateMcpServer,
  updateProjectCustomInstructions,
  updateProjectLlmSettings,
  updateProjectName,
} from "@/app/(authed)/utils/project-utils";
import { APIKeySchema } from "@/components/dashboard-components/project-details/api-key-list";
import { ToolAppSchema } from "@/components/dashboard-components/project-details/available-tools";
import { ProjectTableSchema } from "@/components/dashboard-components/project-table";
import { ComposioAuthMode, MCPTransport } from "@tambo-ai-cloud/core";
import { z } from "zod";

/**
 * Helper function to handle authentication and error checks
 * @param result - The result from an API call
 * @param authMessageTemplate - The message template to display when authentication is required
 * @returns An object with authentication/error info or null if no issues
 */
const handleAuthAndErrors = (result: any, authMessageTemplate: string) => {
  // Check if authentication is required
  if (result && "requiresAuthentication" in result) {
    const loginUrl = result.loginUrl || "/login";
    return {
      authRequired: true,
      loginUrl,
      message: `You need to be logged in to ${authMessageTemplate}. Please [login](${loginUrl}) to continue.`,
    };
  }

  // Check for other errors
  if (result && "error" in result) {
    return {
      error: result.error,
    };
  }

  // No authentication issues or errors
  return null;
};

/**
 * Fetches all projects for the current user
 * @returns Object containing projects array or error information
 */
// export const fetchProjects = async () => {
//   const ctx = await createTRPCContext({
//     headers: new Headers(),
//   });
//   const caller = createCaller(ctx);

//   const projects = await caller.project.getUserProjects();
//   return projects;
//   const result = await api.client.project.;
// try {
// const result = await fetchUserProjects();

//   const authCheck = handleAuthAndErrors(result, "view your projects");

//   if (authCheck) {
//     return {
//       projects: [],
//       ...authCheck,
//     };
//   }

//   return { projects: result };
// } catch (error) {
//   console.error("Error in fetchAndDisplayUserProjects tool:", error);
//   return {
//     projects: [],
//     error: "An unexpected error occurred",
//   };
// }
// };

/**
 * Zod schema for fetchProjects function
 * Defines the return type as an object containing an array of projects
 */
export const fetchProjectsSchema = z
  .function()
  .args()
  .returns(z.object({ projects: z.array(ProjectTableSchema) }));

export const updateProjectSchema = z
  .function()
  .args(
    z.object({
      name: z.string().describe("The new name of the project"),
      customInstructions: z
        .string()
        .describe("The new custom instructions for the project"),
    }),
  )
  .returns(
    z.object({
      success: z.boolean(),
      project: z.any().optional(),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
    }),
  );

/**
 * Fetches API keys for a specific project
 * @param projectId - The ID of the project to fetch API keys for
 * @returns Object containing API keys array or error information
 */
export const fetchApiKeys = async (projectId: string) => {
  try {
    const result = await fetchProjectApiKeys(projectId);

    const authCheck = handleAuthAndErrors(result, "view API keys");

    if (authCheck) {
      return {
        apiKeys: [],
        ...authCheck,
      };
    }

    return { apiKeys: result };
  } catch (error) {
    console.error("Error in fetchApiKeys tool:", error);
    return {
      apiKeys: [],
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for fetchApiKeys function
 * Defines input as project ID and return type as object containing API keys or error information
 */
export const fetchApiKeysSchema = z
  .function()
  .args(z.string().describe("The project ID to fetch API keys for"))
  .returns(
    z.object({
      apiKeys: z.array(APIKeySchema),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Deletes an API key for a specific project
 * @param projectId - The ID of the project
 * @param apiKeyId - The ID of the API key to delete
 * @returns Object indicating success status or error information
 */
export const deleteApiKey = async (projectId: string, apiKeyId: string) => {
  try {
    const result = await deleteProjectApiKey(projectId, apiKeyId);

    const authCheck = handleAuthAndErrors(result, "delete API keys");

    if (authCheck) {
      return {
        success: false,
        ...authCheck,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteApiKey tool:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for deleteApiKey function
 * Defines inputs as project ID and API key ID, and return type as success status or error information
 */
export const deleteApiKeySchema = z
  .function()
  .args(
    z.string().describe("The project ID"),
    z.string().describe("The API key ID"),
  )
  .returns(
    z.object({
      success: z.boolean(),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Generates a new API key for a specific project
 * @param projectId - The ID of the project
 * @param name - The name to assign to the new API key
 * @returns Object containing the generated API key or error information
 */
export const generateApiKey = async (projectId: string, name: string) => {
  try {
    const result = await generateProjectApiKey(projectId, name);

    const authCheck = handleAuthAndErrors(result, "generate API keys");

    if (authCheck) {
      return {
        success: false,
        ...authCheck,
      };
    }

    if ("apiKey" in result) {
      return { success: true, apiKey: result.apiKey };
    }
    return { success: false, error: "Failed to generate API key" };
  } catch (error) {
    console.error("Error in generateApiKey tool:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
};

/**
 * Zod schema for generateApiKey function
 * Defines inputs as project ID and API key name, and return type as success status with API key or error information
 */
export const generateApiKeySchema = z
  .function()
  .args(
    z.string().describe("The project ID"),
    z.string().describe("The name of the API key"),
  )
  .returns(
    z.object({
      success: z.boolean(),
      apiKey: z.string().optional(),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Checks if the user is currently logged in.
 * @returns Object indicating login status or error information
 */
export const checkUserLoginStatus = async () => {
  try {
    // const result = await checkLogin(); // This function needs to be implemented or imported
    // For now, let's simulate a successful login check if no actual endpoint exists.
    // Replace this with the actual call to `checkLogin()` when available.
    const result = { loggedIn: true }; // Simulated result

    const authCheck = handleAuthAndErrors(result, "perform this action");

    if (authCheck) {
      // If authCheck returns, it means login is required or there was an error
      return {
        isLoggedIn: false,
        ...authCheck,
      };
    }

    // If result explicitly states loggedIn is false, but no auth error from handleAuthAndErrors
    if (result && "loggedIn" in result && result.loggedIn === false) {
      return {
        isLoggedIn: false,
        message: "User is not logged in.",
      };
    }

    // If no auth issues and result indicates logged in (or doesn't have a requiresAuthentication field)
    return { isLoggedIn: true, message: "User is logged in." };
  } catch (error) {
    console.error("Error in checkUserLoginStatus tool:", error);
    return {
      isLoggedIn: false,
      error: "An unexpected error occurred while checking login status",
    };
  }
};

/**
 * Zod schema for checkUserLoginStatus function
 * Defines the return type as an object indicating login status or error information
 */
export const checkUserLoginStatusSchema = z
  .function()
  .args()
  .returns(
    z.object({
      isLoggedIn: z.boolean(),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Fetches LLM provider configuration
 * @returns Object containing provider configuration or error information
 */
export const fetchLlmConfig = async () => {
  try {
    const result = await fetchLlmProviderConfig();

    const authCheck = handleAuthAndErrors(result, "view LLM configuration");

    if (authCheck) {
      return {
        providers: {},
        ...authCheck,
      };
    }

    return { providers: result };
  } catch (error) {
    console.error("Error in fetchLlmConfig tool:", error);
    return {
      providers: {},
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for fetchLlmConfig function
 * Defines the return type as an object containing provider configuration
 */
export const fetchLlmConfigSchema = z
  .function()
  .args()
  .returns(
    z.object({
      providers: z.record(z.any()),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Fetches LLM settings for a specific project
 * @param projectId - The ID of the project
 * @returns Object containing project LLM settings or error information
 */
export const fetchLlmSettings = async (projectId: string) => {
  try {
    const result = await fetchProjectLlmSettings(projectId);

    const authCheck = handleAuthAndErrors(result, "view project LLM settings");

    if (authCheck) {
      return {
        settings: null,
        ...authCheck,
      };
    }

    return { settings: result };
  } catch (error) {
    console.error("Error in fetchLlmSettings tool:", error);
    return {
      settings: null,
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for fetchLlmSettings function
 * Defines input as project ID and return type as object containing LLM settings or error information
 */
export const fetchLlmSettingsSchema = z
  .function()
  .args(z.string().describe("The project ID to fetch LLM settings for"))
  .returns(
    z.object({
      settings: z.any().nullable(),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Fetches provider keys for a specific project
 * @param projectId - The ID of the project
 * @returns Object containing provider keys or error information
 */
export const fetchProviderApiKeys = async (projectId: string) => {
  try {
    const result = await fetchProviderKeys(projectId);

    const authCheck = handleAuthAndErrors(result, "view provider keys");

    if (authCheck) {
      return {
        providerKeys: [],
        ...authCheck,
      };
    }

    return { providerKeys: result };
  } catch (error) {
    console.error("Error in fetchProviderApiKeys tool:", error);
    return {
      providerKeys: [],
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for fetchProviderApiKeys function
 * Defines input as project ID and return type as object containing provider keys or error information
 */
export const fetchProviderApiKeysSchema = z
  .function()
  .args(z.string().describe("The project ID to fetch provider keys for"))
  .returns(
    z.object({
      providerKeys: z.array(z.any()),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Updates LLM settings for a specific project
 * @param projectId - The ID of the project
 * @param settings - The LLM settings to update
 * @returns Object indicating success status or error information
 */
export const updateLlmSettings = async (
  projectId: string,
  settings: {
    defaultLlmProviderName: string;
    defaultLlmModelName: string | null;
    customLlmModelName: string | null;
    customLlmBaseURL: string | null;
  },
) => {
  try {
    const result = await updateProjectLlmSettings({
      projectId,
      ...settings,
    });

    const authCheck = handleAuthAndErrors(result, "update LLM settings");

    if (authCheck) {
      return {
        success: false,
        ...authCheck,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in updateLlmSettings tool:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for updateLlmSettings function
 * Defines inputs as project ID and settings object, and return type as success status or error information
 */
export const updateLlmSettingsSchema = z
  .function()
  .args(
    z.string().describe("The project ID"),
    z
      .object({
        defaultLlmProviderName: z.string(),
        defaultLlmModelName: z.string().nullable(),
        customLlmModelName: z.string().nullable(),
        customLlmBaseURL: z.string().nullable(),
      })
      .describe("The LLM settings to update"),
  )
  .returns(
    z.object({
      success: z.boolean(),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Adds or updates a provider API key for a specific project
 * @param projectId - The ID of the project
 * @param provider - The name of the provider
 * @param providerKey - The API key for the provider (null to remove)
 * @returns Object indicating success status or error information
 */
export const updateProviderKey = async (
  projectId: string,
  provider: string,
  providerKey: string | null,
) => {
  try {
    const result = await addOrUpdateProviderKey({
      projectId,
      provider,
      providerKey: providerKey || undefined,
    });

    const authCheck = handleAuthAndErrors(result, "update provider key");

    if (authCheck) {
      return {
        success: false,
        ...authCheck,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in updateProviderKey tool:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for updateProviderKey function
 * Defines inputs as project ID, provider name, and optional API key, and return type as success status or error information
 */
export const updateProviderKeySchema = z
  .function()
  .args(
    z.string().describe("The project ID"),
    z.string().describe("The provider name"),
    z
      .union([z.string(), z.null()])
      .describe("The provider API key (null to remove)"),
  )
  .returns(
    z.object({
      success: z.boolean(),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Fetches custom instructions for a specific project
 * @param projectId - The ID of the project
 * @returns Object containing custom instructions or error information
 */
export const fetchCustomInstructions = async (projectId: string) => {
  try {
    const result = await fetchProjectCustomInstructions(projectId);

    const authCheck = handleAuthAndErrors(result, "view custom instructions");

    if (authCheck) {
      return {
        customInstructions: null,
        ...authCheck,
      };
    }

    // Type guard to ensure result has the expected structure
    if (
      typeof result === "object" &&
      result !== null &&
      "success" in result &&
      result.success &&
      "customInstructions" in result
    ) {
      return { customInstructions: result.customInstructions || null };
    }

    return {
      customInstructions: null,
      error: "Unexpected response format",
    };
  } catch (error) {
    console.error("Error in fetchCustomInstructions tool:", error);
    return {
      customInstructions: null,
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for fetchCustomInstructions function
 * Defines input as project ID and return type as object containing custom instructions or error information
 */
export const fetchCustomInstructionsSchema = z
  .function()
  .args(z.string().describe("The project ID to fetch custom instructions for"))
  .returns(
    z.object({
      customInstructions: z.string().nullable(),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Updates custom instructions for a specific project
 * @param projectId - The ID of the project
 * @param customInstructions - The new custom instructions text
 * @returns Object indicating success status or error information
 */
export const updateCustomInstructions = async (
  projectId: string,
  customInstructions: string,
) => {
  try {
    const result = await updateProjectCustomInstructions({
      projectId,
      customInstructions,
    });

    const authCheck = handleAuthAndErrors(result, "update custom instructions");

    if (authCheck) {
      return {
        success: false,
        ...authCheck,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in updateCustomInstructions tool:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for updateCustomInstructions function
 * Defines inputs as project ID and custom instructions text, and return type as success status or error information
 */
export const updateCustomInstructionsSchema = z
  .function()
  .args(
    z.string().describe("The project ID"),
    z.string().describe("The custom instructions text"),
  )
  .returns(
    z.object({
      success: z.boolean(),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Fetches a specific project by ID
 * @param projectId - The ID of the project to fetch
 * @returns Object containing project details or error information
 */
export const fetchProject = async (projectId: string) => {
  try {
    const result = await fetchProjectById(projectId);

    const authCheck = handleAuthAndErrors(result, "view project details");

    if (authCheck) {
      return {
        project: null,
        ...authCheck,
      };
    }

    return { project: result };
  } catch (error) {
    console.error("Error in fetchProject tool:", error);
    return {
      project: null,
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for fetchProject function
 * Defines input as project ID and return type as object containing project details or error information
 */
export const fetchProjectSchema = z
  .function()
  .args(z.string().describe("The project ID to fetch"))
  .returns(
    z.object({
      project: z.any().nullable(),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Updates the name of a specific project
 * @param projectId - The ID of the project
 * @param name - The new project name
 * @returns Object indicating success status or error information
 */
export const updateProjectNameTool = async (
  projectId: string,
  name: string,
) => {
  try {
    const result = await updateProjectName({
      projectId,
      name,
    });

    const authCheck = handleAuthAndErrors(result, "update project name");

    if (authCheck) {
      return {
        success: false,
        ...authCheck,
      };
    }

    // Type guard to ensure result has the expected structure
    if (
      typeof result === "object" &&
      result !== null &&
      "success" in result &&
      result.success &&
      "project" in result
    ) {
      return { success: true, project: result.project };
    }

    return {
      success: false,
      error: "Unexpected response format",
    };
  } catch (error) {
    console.error("Error in updateProjectNameTool:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for updateProjectNameTool function
 * Defines inputs as project ID and project name, and return type as success status with updated project or error information
 */
export const updateProjectNameSchema = z
  .function()
  .args(
    z.string().describe("The project ID"),
    z.string().describe("The new project name"),
  )
  .returns(
    z.object({
      success: z.boolean(),
      project: z.any().optional(),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Creates a new project with a simple name
 * @param name - Name for the new project
 * @returns Object containing the created project or error information
 */
export const createNewProject = async (name: string) => {
  try {
    const result = await createProject(name);

    const authCheck = handleAuthAndErrors(result, "create a new project");

    if (authCheck) {
      return {
        success: false,
        ...authCheck,
      };
    }

    // Type guard to ensure result has the expected structure
    if (
      typeof result === "object" &&
      result !== null &&
      "success" in result &&
      result.success &&
      "project" in result
    ) {
      return { success: true, project: result.project };
    }

    return {
      success: false,
      error: "Unexpected response format",
    };
  } catch (error) {
    console.error("Error in createNewProject tool:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for createNewProject function
 * Defines input as project name and return type as success status with created project or error information
 */
export const createNewProjectSchema = z
  .function()
  .args(z.string().describe("The name for the new project"))
  .returns(
    z.object({
      success: z.boolean(),
      project: z.any().optional(),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Creates a new project with custom instructions
 * @param name - Name for the new project
 * @param customInstructions - Custom instructions for the AI assistant
 * @returns Object containing the created project or error information
 */
export const createProjectWithInstructions = async (
  name: string,
  customInstructions: string,
) => {
  try {
    const result = await createProjectWithCustomInstructions({
      name,
      customInstructions,
    });

    const authCheck = handleAuthAndErrors(
      result,
      "create a project with custom instructions",
    );

    if (authCheck) {
      return {
        success: false,
        ...authCheck,
      };
    }

    // Type guard to ensure result has the expected structure
    if (
      typeof result === "object" &&
      result !== null &&
      "success" in result &&
      result.success &&
      "project" in result
    ) {
      return { success: true, project: result.project };
    }

    return {
      success: false,
      error: "Unexpected response format",
    };
  } catch (error) {
    console.error("Error in createProjectWithInstructions tool:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for createProjectWithInstructions function
 * Defines inputs as project name and custom instructions, and return type as success status with created project or error information
 */
export const createProjectWithInstructionsSchema = z
  .function()
  .args(
    z.string().describe("The name for the new project"),
    z.string().describe("The custom instructions for the project"),
  )
  .returns(
    z.object({
      success: z.boolean(),
      project: z.any().optional(),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Deletes a project by ID
 * @param projectId - The ID of the project to delete
 * @returns Object indicating success status or error information
 */
export const deleteProject = async (projectId: string) => {
  try {
    const result = await removeProject(projectId);

    const authCheck = handleAuthAndErrors(result, "delete a project");

    if (authCheck) {
      return {
        success: false,
        ...authCheck,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteProject tool:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for deleteProject function
 * Defines input as project ID and return type as success status or error information
 */
export const deleteProjectSchema = z
  .function()
  .args(z.string().describe("The ID of the project to delete"))
  .returns(
    z.object({
      success: z.boolean(),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Fetches details of the currently authenticated user
 * @returns Object containing user details or error information
 */
export const getCurrentUser = async () => {
  try {
    const result = await fetchCurrentUser();

    const authCheck = handleAuthAndErrors(result, "fetch user details");

    if (authCheck) {
      return {
        user: null,
        ...authCheck,
      };
    }

    // Type guard to ensure result has the expected structure
    if (
      typeof result === "object" &&
      result !== null &&
      "success" in result &&
      result.success &&
      "user" in result
    ) {
      return { user: result.user };
    }

    return {
      user: null,
      error: "Unexpected response format",
    };
  } catch (error) {
    console.error("Error in getCurrentUser tool:", error);
    return {
      user: null,
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for getCurrentUser function
 * Defines return type as object containing user details or error information
 */
export const getCurrentUserSchema = z
  .function()
  .args()
  .returns(
    z.object({
      user: z.any().nullable(),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Fetches MCP servers for a specific project
 * @param projectId - The ID of the project
 * @returns Object containing MCP servers array or error information
 */
export const fetchMcpServers = async (projectId: string) => {
  try {
    const result = await fetchProjectMcpServers(projectId);

    const authCheck = handleAuthAndErrors(result, "view MCP servers");

    if (authCheck) {
      return {
        mcpServers: [],
        ...authCheck,
      };
    }

    return { mcpServers: result };
  } catch (error) {
    console.error("Error in fetchMcpServers tool:", error);
    return {
      mcpServers: [],
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for fetchMcpServers function
 * Defines input as project ID and return type as object containing MCP servers or error information
 */
export const fetchMcpServersSchema = z
  .function()
  .args(z.string().describe("The project ID to fetch MCP servers for"))
  .returns(
    z.object({
      mcpServers: z.array(z.any()),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Adds a new MCP server to a project
 * @param projectId - The ID of the project
 * @param url - URL of the MCP server
 * @param customHeaders - Custom headers for the MCP server
 * @param mcpTransport - Transport mechanism for MCP communication
 * @returns Object containing the added MCP server or error information
 */
export const addNewMcpServer = async (
  projectId: string,
  url: string,
  customHeaders: Record<string, string>,
  mcpTransport: MCPTransport,
) => {
  try {
    const result = await addMcpServer({
      projectId,
      url,
      customHeaders,
      mcpTransport,
    });

    const authCheck = handleAuthAndErrors(result, "add an MCP server");

    if (authCheck) {
      return {
        success: false,
        ...authCheck,
      };
    }

    return { success: true, server: result };
  } catch (error) {
    console.error("Error in addNewMcpServer tool:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for addNewMcpServer function
 * Defines inputs for adding a new MCP server and return type as success status with server info or error
 */
export const addNewMcpServerSchema = z
  .function()
  .args(
    z.string().describe("The project ID"),
    z.string().describe("The URL of the MCP server"),
    z.record(z.string()).describe("Custom headers for the MCP server"),
    z
      .nativeEnum(MCPTransport)
      .describe("Transport mechanism for MCP communication"),
  )
  .returns(
    z.object({
      success: z.boolean(),
      server: z.any().optional(),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Updates an existing MCP server
 * @param projectId - The ID of the project
 * @param serverId - ID of the MCP server to update
 * @param url - Updated URL of the MCP server
 * @param customHeaders - Updated custom headers for the MCP server
 * @param mcpTransport - Updated transport mechanism for MCP communication
 * @returns Object containing the updated MCP server or error information
 */
export const updateExistingMcpServer = async (
  projectId: string,
  serverId: string,
  url: string,
  customHeaders: Record<string, string>,
  mcpTransport: MCPTransport,
) => {
  try {
    const result = await updateMcpServer({
      projectId,
      serverId,
      url,
      customHeaders,
      mcpTransport,
    });

    const authCheck = handleAuthAndErrors(result, "update an MCP server");

    if (authCheck) {
      return {
        success: false,
        ...authCheck,
      };
    }

    return { success: true, server: result };
  } catch (error) {
    console.error("Error in updateExistingMcpServer tool:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for updateExistingMcpServer function
 * Defines inputs for updating an MCP server and return type as success status with server info or error
 */
export const updateExistingMcpServerSchema = z
  .function()
  .args(
    z.string().describe("The project ID"),
    z.string().describe("The ID of the MCP server to update"),
    z.string().describe("The updated URL of the MCP server"),
    z.record(z.string()).describe("Updated custom headers for the MCP server"),
    z
      .nativeEnum(MCPTransport)
      .describe("Updated transport mechanism for MCP communication"),
  )
  .returns(
    z.object({
      success: z.boolean(),
      server: z.any().optional(),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Deletes an MCP server from a project
 * @param projectId - The ID of the project
 * @param serverId - ID of the MCP server to delete
 * @returns Object indicating success status or error information
 */
export const removeMcpServer = async (projectId: string, serverId: string) => {
  try {
    const result = await deleteMcpServer({
      projectId,
      serverId,
    });

    const authCheck = handleAuthAndErrors(result, "delete an MCP server");

    if (authCheck) {
      return {
        success: false,
        ...authCheck,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in removeMcpServer tool:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for removeMcpServer function
 * Defines inputs as project ID and server ID, and return type as success status or error information
 */
export const removeMcpServerSchema = z
  .function()
  .args(
    z.string().describe("The project ID"),
    z.string().describe("The ID of the MCP server to delete"),
  )
  .returns(
    z.object({
      success: z.boolean(),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Authorizes an MCP server
 * @param contextKey - Optional context key for authorization
 * @param toolProviderId - ID of the MCP server to authorize
 * @returns Object containing authorization result or error information
 */
export const authorizeMcpServerTool = async (
  contextKey: string | null,
  toolProviderId: string,
) => {
  try {
    const result = await authorizeMcpServer({
      contextKey,
      toolProviderId,
    });

    const authCheck = handleAuthAndErrors(result, "authorize an MCP server");

    if (authCheck) {
      return {
        success: false,
        ...authCheck,
      };
    }

    return { success: true, authResult: result };
  } catch (error) {
    console.error("Error in authorizeMcpServerTool:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for authorizeMcpServerTool function
 * Defines inputs as context key and tool provider ID, and return type as success status with auth result or error
 */
export const authorizeMcpServerSchema = z
  .function()
  .args(
    z
      .union([z.string(), z.null()])
      .describe("Optional context key for authorization"),
    z.string().describe("The ID of the MCP server to authorize"),
  )
  .returns(
    z.object({
      success: z.boolean(),
      authResult: z.any().optional(),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Inspects an MCP server to get available tools
 * @param projectId - The ID of the project
 * @param serverId - ID of the MCP server to inspect
 * @returns Object containing inspection result or error information
 */
export const inspectMcpServerTool = async (
  projectId: string,
  serverId: string,
) => {
  try {
    const result = await inspectMcpServer({
      projectId,
      serverId,
    });

    const authCheck = handleAuthAndErrors(result, "inspect an MCP server");

    if (authCheck) {
      return {
        success: false,
        ...authCheck,
      };
    }

    return { success: true, toolInfo: result };
  } catch (error) {
    console.error("Error in inspectMcpServerTool:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for inspectMcpServerTool function
 * Defines inputs as project ID and server ID, and return type as success status with tool info or error
 */
export const inspectMcpServerSchema = z
  .function()
  .args(
    z.string().describe("The project ID"),
    z.string().describe("The ID of the MCP server to inspect"),
  )
  .returns(
    z.object({
      success: z.boolean(),
      toolInfo: z.any().optional(),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Lists available apps/tools for a project
 * @param projectId - The ID of the project to fetch apps for
 * @returns Object containing apps array or error information
 */
export const listAvailableAppsTool = async (projectId: string) => {
  try {
    const result = await listAvailableApps(projectId);

    const authCheck = handleAuthAndErrors(result, "view available apps");

    if (authCheck) {
      return {
        apps: [],
        ...authCheck,
      };
    }

    return { apps: result };
  } catch (error) {
    console.error("Error in listAvailableAppsTool:", error);
    return {
      apps: [],
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for listAvailableAppsTool function
 * Defines input as project ID and return type as object containing apps array or error information
 */
export const listAvailableAppsSchema = z
  .function()
  .args(z.string().describe("The project ID to fetch available apps for"))
  .returns(
    z.object({
      apps: z.array(ToolAppSchema),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Enables an app/tool for a project
 * @param projectId - The ID of the project
 * @param appId - The ID of the app to enable
 * @returns Object indicating success status or error information
 */
export const enableAppTool = async (projectId: string, appId: string) => {
  try {
    const result = await enableApp({ projectId, appId });

    const authCheck = handleAuthAndErrors(result, "enable an app");

    if (authCheck) {
      return {
        success: false,
        ...authCheck,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in enableAppTool:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for enableAppTool function
 * Defines inputs as project ID and app ID, and return type as success status or error information
 */
export const enableAppSchema = z
  .function()
  .args(
    z.string().describe("The project ID"),
    z.string().describe("The ID of the app to enable"),
  )
  .returns(
    z.object({
      success: z.boolean(),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Disables an app/tool for a project
 * @param projectId - The ID of the project
 * @param appId - The ID of the app to disable
 * @returns Object indicating success status or error information
 */
export const disableAppTool = async (projectId: string, appId: string) => {
  try {
    const result = await disableApp({ projectId, appId });

    const authCheck = handleAuthAndErrors(result, "disable an app");

    if (authCheck) {
      return {
        success: false,
        ...authCheck,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in disableAppTool:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for disableAppTool function
 * Defines inputs as project ID and app ID, and return type as success status or error information
 */
export const disableAppSchema = z
  .function()
  .args(
    z.string().describe("The project ID"),
    z.string().describe("The ID of the app to disable"),
  )
  .returns(
    z.object({
      success: z.boolean(),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Gets authentication details for a Composio tool
 * @param projectId - The ID of the project
 * @param appId - The ID of the app to get authentication for
 * @param contextKey - Optional context key for the authentication
 * @returns Object containing authentication details or error information
 */
export const getComposioAuthTool = async (
  projectId: string,
  appId: string,
  contextKey: string | null,
) => {
  try {
    const result = await getComposioAuth({ projectId, appId, contextKey });

    const authCheck = handleAuthAndErrors(result, "get tool authentication");

    if (authCheck) {
      return {
        authDetails: null,
        ...authCheck,
      };
    }

    return { authDetails: result };
  } catch (error) {
    console.error("Error in getComposioAuthTool:", error);
    return {
      authDetails: null,
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for getComposioAuthTool function
 * Defines inputs as project ID, app ID, and context key, and return type as auth details or error information
 */
export const getComposioAuthSchema = z
  .function()
  .args(
    z.string().describe("The project ID"),
    z.string().describe("The ID of the app to get authentication for"),
    z
      .union([z.string(), z.null()])
      .describe("Optional context key for the authentication"),
  )
  .returns(
    z.object({
      authDetails: z.any().nullable(),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Updates authentication for a Composio tool
 * @param projectId - The ID of the project
 * @param appId - The ID of the app to update authentication for
 * @param contextKey - Optional context key for the authentication
 * @param authMode - Authentication mode to use
 * @param authFields - Authentication field values
 * @returns Object indicating success status or error information
 */
export const updateComposioAuthTool = async (
  projectId: string,
  appId: string,
  contextKey: string | null,
  authMode: ComposioAuthMode,
  authFields: Record<string, string>,
) => {
  try {
    const result = await updateComposioAuth({
      projectId,
      appId,
      contextKey,
      authMode,
      authFields,
    });

    const authCheck = handleAuthAndErrors(result, "update tool authentication");

    if (authCheck) {
      return {
        success: false,
        ...authCheck,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in updateComposioAuthTool:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for updateComposioAuthTool function
 * Defines inputs for updating authentication and return type as success status or error information
 */
export const updateComposioAuthSchema = z
  .function()
  .args(
    z.string().describe("The project ID"),
    z.string().describe("The ID of the app to update authentication for"),
    z
      .union([z.string(), z.null()])
      .describe("Optional context key for the authentication"),
    z.nativeEnum(ComposioAuthMode).describe("Authentication mode to use"),
    z.record(z.string()).describe("Authentication field values"),
  )
  .returns(
    z.object({
      success: z.boolean(),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

/**
 * Checks the status of a Composio connected account
 * @param projectId - The ID of the project
 * @param toolProviderId - The ID of the tool provider to check
 * @param contextKey - Optional context key for the authentication
 * @returns Object containing connection status or error information
 */
export const checkComposioConnectedAccountStatusTool = async (
  projectId: string,
  toolProviderId: string,
  contextKey: string | null,
) => {
  try {
    const result = await checkComposioConnectedAccountStatus({
      projectId,
      toolProviderId,
      contextKey,
    });

    const authCheck = handleAuthAndErrors(
      result,
      "check connected account status",
    );

    if (authCheck) {
      return {
        status: null,
        ...authCheck,
      };
    }

    return { status: result };
  } catch (error) {
    console.error("Error in checkComposioConnectedAccountStatusTool:", error);
    return {
      status: null,
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for checkComposioConnectedAccountStatusTool function
 * Defines inputs for checking connection status and return type as status info or error
 */
export const checkComposioConnectedAccountStatusSchema = z
  .function()
  .args(
    z.string().describe("The project ID"),
    z.string().describe("The ID of the tool provider to check"),
    z
      .union([z.string(), z.null()])
      .describe("Optional context key for the authentication"),
  )
  .returns(
    z.object({
      status: z.any().nullable(),
      authRequired: z.boolean().optional(),
      loginUrl: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  );

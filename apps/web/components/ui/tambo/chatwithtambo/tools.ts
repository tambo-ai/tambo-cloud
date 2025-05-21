"use client";

import {
  addOrUpdateProviderKey,
  createProject,
  createProjectWithCustomInstructions,
  deleteProjectApiKey,
  fetchCurrentUser,
  fetchLlmProviderConfig,
  fetchProjectApiKeys,
  fetchProjectById,
  fetchProjectCustomInstructions,
  fetchProjectLlmSettings,
  fetchProviderKeys,
  fetchUserProjects,
  generateProjectApiKey,
  removeProject,
  updateProjectCustomInstructions,
  updateProjectLlmSettings,
  updateProjectName,
} from "@/app/(authed)/utils/project-utils";
import { APIKeySchema } from "@/components/dashboard-components/project-details/api-key-list";
import { ProjectInfoSchema } from "@/components/dashboard-components/project-details/project-info";
import { ProjectTableSchema } from "@/components/dashboard-components/project-table";
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
export const fetchProjects = async () => {
  try {
    const result = await fetchUserProjects();

    const authCheck = handleAuthAndErrors(result, "view your projects");

    if (authCheck) {
      return {
        projects: [],
        ...authCheck,
      };
    }

    return { projects: result };
  } catch (error) {
    console.error("Error in fetchAndDisplayUserProjects tool:", error);
    return {
      projects: [],
      error: "An unexpected error occurred",
    };
  }
};

/**
 * Zod schema for fetchProjects function
 * Defines the return type as an object containing an array of projects
 */
export const fetchProjectsSchema = z
  .function()
  .args()
  .returns(z.object({ projects: z.array(ProjectTableSchema) }));

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

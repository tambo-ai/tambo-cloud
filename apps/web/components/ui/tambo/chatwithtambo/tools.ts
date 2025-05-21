"use client";

import {
  deleteProjectApiKey,
  fetchProjectApiKeys,
  fetchUserProjects,
  generateProjectApiKey,
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
 * Zod schema for fetchProjectInfo function
 * Defines input as project ID string and return type containing project info
 */
export const fetchProjectInfoSchema = z
  .function()
  .args(z.string())
  .returns(z.object({ project: ProjectInfoSchema }));

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

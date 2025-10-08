"use client";

import { APIKeySchema } from "@/components/dashboard-components/project-details/api-key-list";
import { ProjectTableSchema } from "@/components/dashboard-components/project-table";
import { customLlmParametersSchema } from "@/lib/llm-parameters";
import { api, useTRPCClient } from "@/trpc/react";
import {
  AgentProviderType,
  AiProviderType,
  llmProviderConfig,
  MCPTransport,
  OAuthValidationMode,
  type CustomLlmParameters,
} from "@tambo-ai-cloud/core";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";
import { z } from "zod";

/** user management */

/**
 * Zod schema for the `fetchCurrentUser` function.
 * Defines no arguments and a return type as an object containing user details (id, email, createdAt, imageUrl).
 */
export const fetchCurrentUserSchema = z
  .function()
  .args()
  .returns(
    z.object({
      id: z.string(),
      email: z.string().optional(),
      createdAt: z.string(),
      imageUrl: z.string().optional(),
    }),
  );

/** project management */

/**
 * Zod schema for the `fetchAllProjects` function.
 * Defines no arguments and the return type as an object with a `projects` property, which is an array of project details.
 */
export const fetchAllProjectsSchema = z
  .function()
  .args()
  .returns(z.object({ projects: z.array(ProjectTableSchema) }));

/**
 * Zod schema for the `fetchProjectById` function.
 * Defines the argument as a project ID string and the return type as an object containing detailed project information.
 */
export const fetchProjectByIdSchema = z
  .function()
  .args(z.string().describe("The project ID to fetch"))
  .returns(
    z.object({
      id: z.string(),
      name: z.string(),
      userId: z.string(),
      createdAt: z.string(),
      composioEnabled: z.boolean(),
      customInstructions: z.string().nullable(),
      defaultLlmProviderName: z.string().nullable(),
      defaultLlmModelName: z.string().nullable(),
      customLlmModelName: z.string().nullable(),
      customLlmBaseURL: z.string().nullable(),
      customLlmParameters: customLlmParametersSchema,
      maxInputTokens: z.number().nullable(),
      maxToolCallLimit: z.number(),
      isTokenRequired: z.boolean(),
      providerType: z.nativeEnum(AiProviderType),
      agentProviderType: z.nativeEnum(AgentProviderType),
      agentUrl: z.string().nullable(),
      agentName: z.string().nullable(),
      agentHeaders: z.record(z.string(), z.string()).nullable(),
      allowSystemPromptOverride: z.boolean(),
    }),
  );

/**
 * Zod schema for the `updateProject` function.
 * Defines the argument as an object containing project update parameters (ID, name, custom instructions, LLM settings, agent configuration, and security settings)
 * and the return type as an object representing the updated project details.
 */
export const updateProjectSchema = z
  .function()
  .args(
    z.object({
      id: z.string().describe("The ID of the project to update"),
      name: z.string().describe("The new name of the project"),
      customInstructions: z
        .string()
        .describe("The new custom instructions for the project"),
      defaultLlmProviderName: z
        .string()
        .describe("The new default LLM provider name for the project"),
      defaultLlmModelName: z
        .string()
        .describe("The new default LLM model name for the project"),
      customLlmModelName: z
        .string()
        .describe("The new custom LLM model name for the project"),
      customLlmBaseURL: z
        .string()
        .describe("The new custom LLM base URL for the project"),
      customLlmParameters: customLlmParametersSchema.describe(
        "The new custom LLM parameters for the project",
      ),
      maxInputTokens: z
        .number()
        .describe("The new max input tokens for the project"),
      maxToolCallLimit: z
        .number()
        .optional()
        .describe("The new maximum number of tool calls allowed per response"),
      isTokenRequired: z
        .boolean()
        .describe("Whether API token is required for access to the project"),
      providerType: z
        .nativeEnum(AiProviderType)
        .describe("The AI provider type for the project"),
      agentProviderType: z
        .nativeEnum(AgentProviderType)
        .describe("The agent provider type for the project"),
      agentUrl: z.string().describe("The agent URL for the project"),
      agentName: z.string().describe("The agent name for the project"),
      agentHeaders: z
        .record(z.string(), z.string())
        .describe("Custom headers for agent requests"),
      allowSystemPromptOverride: z
        .boolean()
        .describe(
          "Whether system prompt overrides are allowed for the project",
        ),
    }),
  )
  .returns(
    z.object({
      id: z.string(),
      name: z.string(),
      userId: z.string(),
      customInstructions: z.string().nullable(),
      composioEnabled: z.boolean(),
      defaultLlmProviderName: z.string().nullable(),
      defaultLlmModelName: z.string().nullable(),
      customLlmModelName: z.string().nullable(),
      customLlmBaseURL: z.string().nullable(),
      customLlmParameters: customLlmParametersSchema,
      maxInputTokens: z.number().nullable(),
      maxToolCallLimit: z.number(),
      isTokenRequired: z.boolean(),
      providerType: z.nativeEnum(AiProviderType),
      agentProviderType: z.nativeEnum(AgentProviderType),
      agentUrl: z.string().nullable(),
      agentName: z.string().nullable(),
      agentHeaders: z.record(z.string(), z.string()).nullable(),
      allowSystemPromptOverride: z.boolean(),
    }),
  );

/**
 * Zod schema for the `createProject` function.
 * Defines the argument as the project name string and the return type as an object representing the newly created project (id, name, userId).
 */
export const createProjectSchema = z
  .function()
  .args(z.string().describe("The name of the project to create"))
  .returns(
    z.object({
      id: z.string(),
      name: z.string(),
      userId: z.string(),
      providerType: z.nativeEnum(AiProviderType),
    }),
  );

/**
 * Zod schema for the `removeProject` function.
 * Defines the argument as the project ID string and the return type as an object indicating success (e.g., `{ success: true }`).
 */
export const removeProjectSchema = z
  .function()
  .args(z.string().describe("The ID of the project to remove"))
  .returns(z.object({ success: z.boolean() }));

/** tambo API key management */

/**
 * Zod schema for the `fetchProjectApiKeys` function.
 * Defines the argument as a project ID string and the return type as an object with an `apiKeys` property,
 * which is an array of API key details.
 */
export const fetchProjectApiKeysSchema = z
  .function()
  .args(z.string().describe("The project ID to fetch API keys for"))
  .returns(
    z.object({
      apiKeys: z.array(APIKeySchema),
    }),
  );

/**
 * Zod schema for the `generateProjectApiKey` function.
 * Defines arguments as the project ID string and API key name string,
 * and the return type as an object representing the newly generated API key details.
 */
export const generateProjectApiKeySchema = z
  .function()
  .args(
    z.string().describe("The project ID"),
    z.string().describe("The name of the API key"),
  )
  .returns(
    z.object({
      apiKey: z.string(),
      id: z.string(),
      name: z.string(),
      partiallyHiddenKey: z.string().nullable(),
      lastUsedAt: z.date().nullable(),
      projectId: z.string(),
      hashedKey: z.string(),
      createdAt: z.date(),
      updatedAt: z.date(),
      createdByUserId: z.string(),
    }),
  );

/**
 * Zod schema for the `deleteProjectApiKey` function.
 * Defines arguments as the project ID string and API key ID string,
 * and the return type as an object indicating the key was processed for deletion (e.g., `{ deletedKey: undefined }`).
 */
export const deleteProjectApiKeySchema = z
  .function()
  .args(
    z.string().describe("The project ID"),
    z.string().describe("The API key ID"),
  )
  .returns(
    z.object({
      deletedKey: z.void(),
    }),
  );

/** dashboard statistics management */

/**
 * Zod schema for the `fetchProjectCount` function.
 * Defines no arguments and returns the count of projects for the current user.
 */
export const fetchProjectCountSchema = z
  .function()
  .args()
  .returns(
    z.object({
      count: z.number(),
    }),
  );

/**
 * Zod schema for the `fetchTotalMessageUsage` function.
 * Defines a period argument and returns total message usage.
 */
export const fetchTotalMessageUsageSchema = z
  .function()
  .args(
    z
      .string()
      .describe(
        "Time period filter: 'all time', 'per month', or 'per week'. Defaults to 'all time'",
      ),
  )
  .returns(
    z.object({
      totalMessages: z.number(),
      period: z.string(),
    }),
  );

/**
 * Zod schema for the `fetchTotalUsers` function.
 * Defines a period argument and returns total user count.
 */
export const fetchTotalUsersSchema = z
  .function()
  .args(
    z
      .string()
      .describe(
        "Time period filter: 'all time', 'per month', or 'per week'. Defaults to 'all time'",
      ),
  )
  .returns(
    z.object({
      totalUsers: z.number(),
      period: z.string(),
    }),
  );

/** llm provider settings management */

/**
 * Zod schema for the `fetchAvailableModels` function.
 * Lists all available LLM providers and their models with API names.
 */
export const fetchAvailableModelsSchema = z
  .function()
  .args(
    z
      .string()
      .optional()
      .describe(
        "Optional provider name to filter by (e.g., 'openai', 'anthropic'). If not provided, returns all providers.",
      ),
  )
  .returns(
    z.array(
      z.object({
        provider: z.string(),
        providerDisplayName: z.string(),
        models: z.array(
          z.object({
            apiName: z.string(),
            displayName: z.string(),
            status: z.string(),
          }),
        ),
      }),
    ),
  );

/**
 * Zod schema for the `fetchProjectLlmSettings` function.
 * Defines the argument as a project ID string and the return type as an object containing LLM settings.
 * Returns complete LLM configuration including provider settings, model settings, custom parameters,
 * and agent configuration.
 */
export const fetchProjectLlmSettingsSchema = z
  .function()
  .args(z.string().describe("The project ID to fetch LLM settings for"))
  .returns(
    z.object({
      defaultLlmProviderName: z.string().nullable(),
      defaultLlmModelName: z.string().nullable(),
      customLlmModelName: z.string().nullable(),
      customLlmBaseURL: z.string().nullable(),
      customLlmParameters: customLlmParametersSchema,
      maxInputTokens: z.number().nullable(),
      providerType: z.nativeEnum(AiProviderType),
      agentProviderType: z.nativeEnum(AgentProviderType),
      agentUrl: z.string().nullable(),
      agentName: z.string().nullable(),
      agentHeaders: z.record(z.string(), z.string()).nullable(),
    }),
  );

/**
 * Zod schema for the `updateProjectModelConfig` function.
 * Defines arguments as the project ID string and a model configuration object (with all fields optional for partial updates),
 * and the return type as an object representing the updated model configuration.
 * The customLlmParameters field supports partial updates through deep merging.
 */
export const updateProjectModelConfigSchema = z
  .function()
  .args(
    z.string().describe("The project ID"),
    z
      .object({
        defaultLlmProviderName: z.string().nullable().optional(),
        defaultLlmModelName: z.string().nullable().optional(),
        customLlmModelName: z.string().nullable().optional(),
        customLlmBaseURL: z.string().nullable().optional(),
        customLlmParameters: customLlmParametersSchema
          .nullable()
          .optional()
          .describe(
            "PARTIAL updates supported - will be deep merged with existing parameters. Example: to set thinking=true for gpt-4o, pass { openai: { 'gpt-4o': { thinking: true } } }. Structure: { [provider]: { [model]: { [paramName]: value } } }. Common params: temperature, thinking, maxOutputTokens, topP, topK, presencePenalty, frequencyPenalty.",
          ),
        maxInputTokens: z.number().nullable().optional(),
      })
      .describe("The model configuration to update"),
  )
  .returns(
    z.object({
      defaultLlmProviderName: z.string().nullable(),
      defaultLlmModelName: z.string().nullable(),
      customLlmModelName: z.string().nullable(),
      customLlmBaseURL: z.string().nullable(),
      customLlmParameters: customLlmParametersSchema.nullable(),
      maxInputTokens: z.number().nullable(),
    }),
  );

/** mcp server management */

/**
 * Zod schema for the `fetchProjectMcpServers` function.
 * Defines the argument as a project ID string.
 * The schema's return type is an object representing the details of a single MCP server (as per this schema definition).
 */
export const fetchProjectMcpServersSchema = z
  .function()
  .args(z.string().describe("The project ID to fetch MCP servers for"))
  .returns(
    z.object({
      id: z.string(),
      url: z.string().nullable(),
      customHeaders: z.record(z.string(), z.string()).nullable(),
      mcpRequiresAuth: z.boolean(),
      mcpIsAuthed: z.boolean(),
    }),
  );

/**
 * Zod schema for the `addMcpServer` function.
 * Defines the argument as an object containing parameters for adding an MCP server (project ID, URL, custom headers, MCP transport)
 * and the return type as an object representing the added MCP server's details.
 */
export const addMcpServerSchema = z
  .function()
  .args(
    z.object({
      projectId: z.string().describe("The project ID"),
      url: z.string().describe("The URL of the MCP server"),
      customHeaders: z
        .record(z.string(), z.string())
        .describe("Custom headers for the MCP server"),
      mcpTransport: z
        .nativeEnum(MCPTransport)
        .describe("Transport mechanism for MCP communication, default is SSE"),
    }),
  )
  .returns(
    z.object({
      id: z.string(),
      url: z.string(),
      customHeaders: z.record(z.string(), z.string()),
      mcpTransport: z.nativeEnum(MCPTransport),
      mcpRequiresAuth: z.boolean(),
      mcpCapabilities: z.record(z.string(), z.any()).optional(),
      mcpVersion: z.record(z.string(), z.any()).optional(),
      mcpInstructions: z.string().optional(),
    }),
  );

/**
 * Zod schema for the `deleteMcpServer` function.
 * Defines the argument as an object containing the project ID and server ID,
 * and the return type as an object indicating success.
 */
export const deleteMcpServerSchema = z
  .function()
  .args(
    z.object({
      projectId: z.string().describe("The project ID"),
      serverId: z.string().describe("The ID of the MCP server to delete"),
    }),
  )
  .returns(
    z.object({
      success: z.boolean(),
    }),
  );

/**
 * Zod schema for the `authorizeMcpServer` function.
 * Defines the argument as an object containing an optional context key and the tool provider ID,
 * and the return type as an object indicating success and an optional redirect URL.
 */
export const authorizeMcpServerSchema = z
  .function()
  .args(
    z.object({
      contextKey: z
        .string()
        .nullable()
        .describe("Optional context key for authorization"),
      toolProviderId: z
        .string()
        .describe("The ID of the MCP server to authorize"),
    }),
  )
  .returns(
    z.object({
      success: z.boolean(),
      redirectUrl: z.string().optional(),
    }),
  );

/**
 * Zod schema for the `getMcpServerTools` function.
 * Defines the argument as an object containing the project ID and server ID,
 * and the return type as an object containing available tools and server information.
 */
export const getMcpServerToolsSchema = z
  .function()
  .args(
    z.object({
      projectId: z.string().describe("The project ID"),
      serverId: z.string().describe("The ID of the MCP server to inspect"),
    }),
  )
  .returns(
    z.object({
      tools: z.object({
        name: z.string(),
        description: z.string().optional(),
        inputSchema: z.any().optional(),
      }),
      serverInfo: z.object({
        version: z.record(z.string(), z.any()).optional(),
        instructions: z.string().optional(),
        capabilities: z.record(z.string(), z.any()).optional(),
      }),
    }),
  );

/** thread and message management */

/**
 * Zod schema for the `fetchProjectThreads` function.
 * Defines arguments as project ID and optional filters,
 * and the return type as an object containing threads array and total count.
 */
export const fetchProjectThreadsSchema = z
  .function()
  .args(
    z.object({
      projectId: z.string().describe("The project ID to fetch threads for"),
      limit: z
        .number()
        .optional()
        .default(10)
        .describe("Maximum number of threads to return (1-100, default: 10)"),
      sortField: z
        .enum([
          "created",
          "updated",
          "threadId",
          "threadName",
          "contextKey",
          "messages",
          "errors",
        ])
        .optional()
        .default("created")
        .describe("Field to sort threads by (default: created)"),
      sortDirection: z
        .enum(["asc", "desc"])
        .optional()
        .default("desc")
        .describe("Sort direction (default: desc for newest first)"),
    }),
  )
  .returns(
    z.object({
      threads: z.array(
        z.object({
          id: z.string(),
          name: z.string().nullable(),
          createdAt: z.date(),
          updatedAt: z.date(),
          contextKey: z.string().nullable(),
          messageCount: z.number(),
          errorCount: z.number(),
        }),
      ),
      totalCount: z.number(),
    }),
  );

/** oauth validation settings management */

/**
 * Zod schema for the `fetchOAuthValidationSettings` function.
 * Defines the argument as a project ID string and the return type as an object containing OAuth validation settings.
 */
export const fetchOAuthValidationSettingsSchema = z
  .function()
  .args(
    z
      .string()
      .describe("The project ID to fetch OAuth validation settings for"),
  )
  .returns(
    z.object({
      mode: z
        .nativeEnum(OAuthValidationMode)
        .describe("The OAuth validation mode"),
      publicKey: z
        .string()
        .nullable()
        .describe("The public key for asymmetric validation"),
      hasSecretKey: z
        .boolean()
        .describe("Whether a secret key is stored for symmetric validation"),
    }),
  );

/**
 * Zod schema for the `updateOAuthValidationSettings` function.
 * Defines arguments as the project ID string and OAuth validation settings object,
 * and the return type as an object representing the updated OAuth validation settings.
 */
export const updateOAuthValidationSettingsSchema = z
  .function()
  .args(
    z.string().describe("The project ID"),
    z
      .object({
        mode: z
          .nativeEnum(OAuthValidationMode)
          .describe("The OAuth validation mode"),
        secretKey: z
          .string()
          .optional()
          .describe("The secret key for symmetric validation"),
        publicKey: z
          .string()
          .optional()
          .describe("The public key for asymmetric manual validation"),
      })
      .describe("The OAuth validation settings to update"),
  )
  .returns(
    z.object({
      mode: z.nativeEnum(OAuthValidationMode),
      publicKey: z.string().nullable(),
      hasSecretKey: z.boolean(),
    }),
  );

export function useTamboManagementTools() {
  const { registerTool } = useTambo();
  const trpcClient = useTRPCClient();
  const utils = api.useUtils();

  /* user management */
  useEffect(() => {
    /**
     * Registers a tool to fetch the current user information.
     * Returns user details including ID, email, creation date, and image URL.
     * If the user is not logged in, provides a link to the login page.
     */
    registerTool({
      name: "fetchCurrentUser",
      description:
        "Fetches the current user. If the user is not logged in, return a link that leads to the login page at /login",
      tool: async () => {
        try {
          return await trpcClient.user.getUser.query();
        } catch (_error) {
          return {
            error: "User not logged in",
            loginUrl: "/login",
            message: "Please log in to access your account",
          };
        }
      },
      toolSchema: fetchCurrentUserSchema,
    });

    /* project management */

    /**
     * Registers a tool to fetch all projects for the current user.
     * Returns an array of project objects with detailed information.
     */
    registerTool({
      name: "fetchAllProjects",
      description: "Fetches all projects for the current user.",
      tool: async () => {
        return await trpcClient.project.getUserProjects.query();
      },
      toolSchema: fetchAllProjectsSchema,
    });

    /**
     * Registers a tool to fetch a specific project by its ID.
     * @param {string} projectId - The unique identifier of the project to fetch
     * @returns {Object} Project details including ID, name, user ID, settings, and timestamps
     */
    registerTool({
      name: "fetchProjectById",
      description: "Fetches a specific project by ID.",
      tool: async (projectId: string) => {
        const projects = await trpcClient.project.getUserProjects.query();
        return projects.find((p: { id: string }) => p.id === projectId);
      },
      toolSchema: fetchProjectByIdSchema,
    });

    /**
     * Registers a tool to update an existing project's configuration.
     * Updates project name, custom instructions, LLM provider settings, agent configuration, and security settings.
     * @param {Object} params - Project update parameters
     * @param {string} params.id - The ID of the project to update
     * @param {string} params.name - The new name for the project
     * @param {string} params.customInstructions - Custom AI instructions for the project
     * @param {string} params.defaultLlmProviderName - Default LLM provider name
     * @param {string} params.defaultLlmModelName - Default LLM model name
     * @param {string} params.customLlmModelName - Custom LLM model name
     * @param {string} params.customLlmBaseURL - Custom LLM base URL
     * @param {CustomLlmParameters} params.customLlmParameters - Custom LLM parameters (provider -> model -> parameter structure)
     * @param {number} params.maxInputTokens - Maximum input tokens for the project
     * @param {number} params.maxToolCallLimit - Maximum tool calls allowed per response (optional)
     * @param {boolean} params.isTokenRequired - Whether API token is required for access
     * @param {AiProviderType} params.providerType - The AI provider type (e.g., LLM, agent)
     * @param {AgentProviderType} params.agentProviderType - The agent provider type
     * @param {string} params.agentUrl - URL for agent provider
     * @param {string} params.agentName - Name of the agent
     * @param {Record<string, string>} params.agentHeaders - Custom headers for agent requests
     * @param {boolean} params.allowSystemPromptOverride - Whether system prompt overrides are allowed
     * @returns {Object} Updated project details
     */
    registerTool({
      name: "updateProject",
      description: "Updates a project, and every settings associated with it.",
      tool: async (params: {
        id: string;
        name: string;
        customInstructions: string;
        defaultLlmProviderName: string;
        defaultLlmModelName: string;
        customLlmModelName: string;
        customLlmBaseURL: string;
        maxInputTokens: number;
        maxToolCallLimit?: number;
        isTokenRequired: boolean;
        providerType: AiProviderType;
        customLlmParameters: CustomLlmParameters;
        agentProviderType: AgentProviderType;
        agentUrl: string;
        agentName: string;
        agentHeaders: Record<string, string>;
        allowSystemPromptOverride: boolean;
      }) => {
        const result = await trpcClient.project.updateProject.mutate({
          projectId: params.id,
          name: params.name,
          customInstructions: params.customInstructions,
          defaultLlmProviderName: params.defaultLlmProviderName,
          defaultLlmModelName: params.defaultLlmModelName,
          customLlmModelName: params.customLlmModelName,
          customLlmBaseURL: params.customLlmBaseURL,
          maxInputTokens: params.maxInputTokens,
          ...(params.maxToolCallLimit !== undefined && {
            maxToolCallLimit: params.maxToolCallLimit,
          }),
          isTokenRequired: params.isTokenRequired,
          providerType: params.providerType,
          customLlmParameters: params.customLlmParameters,
          agentProviderType: params.agentProviderType,
          agentUrl: params.agentUrl,
          agentName: params.agentName,
          agentHeaders: params.agentHeaders,
          allowSystemPromptOverride: params.allowSystemPromptOverride,
        });

        // Invalidate the project cache to refresh the component
        await utils.project.getUserProjects.invalidate();

        return result;
      },
      toolSchema: updateProjectSchema,
    });

    /**
     * Registers a tool to create a new project.
     * @param {string} projectName - The name for the new project
     * @returns {Object} Created project details with ID, name, and user ID
     */
    registerTool({
      name: "createProject",
      description: "create a new project",
      tool: async (projectName: string) => {
        const result =
          await trpcClient.project.createProject.mutate(projectName);

        // Invalidate the project cache to refresh the component
        await utils.project.getUserProjects.invalidate();

        return result;
      },
      toolSchema: createProjectSchema,
    });

    /**
     * Registers a tool to remove/delete a project.
     * @param {string} projectId - The ID of the project to remove
     * @returns {Object} Success status indicating the project was deleted
     */
    registerTool({
      name: "removeProject",
      description: "remove a project",
      tool: async (projectId: string) => {
        await trpcClient.project.removeProject.mutate(projectId);

        // Invalidate the project cache to refresh the component
        await utils.project.getUserProjects.invalidate();

        return { success: true };
      },
      toolSchema: removeProjectSchema,
    });

    /* tambo API key management */

    /**
     * Registers a tool to fetch all API keys for a specific project.
     * @param {string} projectId - The project ID to fetch API keys for
     * @returns {Object} Object containing an array of API key details
     */
    registerTool({
      name: "fetchProjectApiKeys",
      description: "get all api keys for the current project",
      tool: async (projectId: string) => {
        return await trpcClient.project.getApiKeys.query(projectId);
      },
      toolSchema: fetchProjectApiKeysSchema,
    });

    /**
     * Registers a tool to generate a new API key for a project.
     * @param {string} projectId - The project ID to generate an API key for
     * @param {string} name - The name/label for the new API key
     * @returns {Object} Generated API key details including the key value and metadata
     */
    registerTool({
      name: "generateProjectApiKey",
      description: "generate a new api key for the current project",
      tool: async (projectId: string, name: string) => {
        const result = await trpcClient.project.generateApiKey.mutate({
          projectId,
          name,
        });

        // Invalidate the API keys cache to refresh the component
        await utils.project.getApiKeys.invalidate(projectId);

        return result;
      },
      toolSchema: generateProjectApiKeySchema,
    });

    /**
     * Registers a tool to delete an existing API key from a project.
     * @param {string} projectId - The project ID containing the API key
     * @param {string} apiKeyId - The ID of the API key to delete
     * @returns {Object} Confirmation message that the key was deleted
     */
    registerTool({
      name: "deleteProjectApiKey",
      description: "delete an api key for the current project",
      tool: async (projectId: string, apiKeyId: string) => {
        await trpcClient.project.removeApiKey.mutate({
          projectId,
          apiKeyId,
        });

        // Invalidate the API keys cache to refresh the component
        await utils.project.getApiKeys.invalidate(projectId);

        return { deletedKey: "The key was deleted successfully." };
      },
      toolSchema: deleteProjectApiKeySchema,
    });

    /* dashboard statistics management */

    /**
     * Registers a tool to fetch the total number of projects for the current user.
     * Returns the count of projects associated with the user's account.
     * @returns {Object} Object containing the project count
     */
    registerTool({
      name: "fetchProjectCount",
      description: "Fetches the total number of projects for the current user.",
      tool: async () => {
        const projects = await trpcClient.project.getUserProjects.query();
        return { count: projects.length };
      },
      toolSchema: fetchProjectCountSchema,
    });

    /**
     * Registers a tool to fetch total message usage statistics.
     * @param {string} period - Time period filter ('all time', 'per month', 'per week'). Defaults to 'all time' if not specified.
     * @returns {Object} Object containing total message count and period
     */
    registerTool({
      name: "fetchTotalMessageUsage",
      description:
        "Fetches total message usage statistics with period filtering. Period can be 'all time', 'per month', or 'per week'.",
      tool: async (period: string) => {
        // Use 'all time' as default if period is not provided or invalid
        const validPeriod = period || "all time";
        const result = await trpcClient.project.getTotalMessageUsage.query({
          period: validPeriod,
        });
        return {
          totalMessages: result.totalMessages,
          period: validPeriod,
        };
      },
      toolSchema: fetchTotalMessageUsageSchema,
    });

    /**
     * Registers a tool to fetch total user count statistics.
     * @param {string} period - Time period filter ('all time', 'per month', 'per week'). Defaults to 'all time' if not specified.
     * @returns {Object} Object containing total user count and period
     */
    registerTool({
      name: "fetchTotalUsers",
      description:
        "Fetches total user count statistics with period filtering. Period can be 'all time', 'per month', or 'per week'.",
      tool: async (period: string) => {
        // Use 'all time' as default if period is not provided or invalid
        const validPeriod = period || "all time";
        const result = await trpcClient.project.getTotalUsers.query({
          period: validPeriod,
        });
        return {
          totalUsers: result.totalUsers,
          period: validPeriod,
        };
      },
      toolSchema: fetchTotalUsersSchema,
    });

    /* llm provider settings management */

    /**
     * Registers a tool to fetch available LLM models from all providers.
     * IMPORTANT: When users want to change models, you MUST use the exact apiName from this list.
     * @param {string} providerName - Optional provider name to filter (e.g., 'openai', 'anthropic')
     * @returns {Array} List of providers with their available models and apiNames
     */
    registerTool({
      name: "fetchAvailableModels",
      description:
        "Lists all available LLM providers and models. CRITICAL: When setting a model, you MUST use the exact 'apiName' field (e.g., 'gpt-5-2025-08-07', not 'gpt-5'). Users will say friendly names like 'gpt-5' or 'claude sonnet', but you must translate these to the correct apiName from this list.",
      tool: async (providerName?: string) => {
        const providers = Object.entries(llmProviderConfig)
          .filter(([key]) => !providerName || key === providerName)
          .map(([key, config]) => ({
            provider: key,
            providerDisplayName: config.displayName,
            models: Object.entries(config.models || {}).map(
              ([_modelKey, modelConfig]) => ({
                apiName: modelConfig.apiName,
                displayName: modelConfig.displayName,
                status: modelConfig.status,
              }),
            ),
          }));

        return providers;
      },
      toolSchema: fetchAvailableModelsSchema,
    });

    /**
     * Registers a tool to fetch LLM configuration settings for a project.
     * Returns the current LLM provider, model, and custom settings.
     * @param {string} projectId - The project ID to fetch LLM settings for
     * @returns {Object} LLM configuration including provider, model, and custom settings
     */
    registerTool({
      name: "fetchProjectLlmSettings",
      description: "Fetches LLM configuration settings for a project.",
      tool: async (projectId: string) => {
        return await trpcClient.project.getProjectLlmSettings.query({
          projectId,
        });
      },
      toolSchema: fetchProjectLlmSettingsSchema,
    });

    /**
     * Registers a tool to update LLM model configuration for a project.
     * Updates model configuration like provider, model name, and technical settings (temperature, thinking mode, topP, etc.).
     * This is for TECHNICAL MODEL CONFIGURATION ONLY - NOT for custom instructions text.
     * CRITICAL: ALWAYS call fetchAvailableModels FIRST to get the correct model apiName.
     * Supports partial updates for customLlmParameters - they will be deep merged with existing values.
     * @param {string} projectId - The project ID to update
     * @param {Object} config - Model configuration to update
     * @param {string|null} config.defaultLlmProviderName - The LLM provider name (e.g., 'openai', 'anthropic')
     * @param {string|null} config.defaultLlmModelName - The model apiName (MUST use exact apiName from fetchAvailableModels, not display name!)
     * @param {string|null} config.customLlmModelName - Custom model name if using custom provider
     * @param {string|null} config.customLlmBaseURL - Custom base URL for LLM API
     * @param {number|null} config.maxInputTokens - Maximum input tokens for the project
     * @param {CustomLlmParameters|null} config.customLlmParameters - Custom LLM parameters (provider -> model -> parameter structure)
     * @returns {Object} Updated model configuration
     */
    registerTool({
      name: "updateProjectModelConfig",
      description:
        "TOOL: Updates ONLY the technical LLM MODEL CONFIGURATION like provider, model selection, temperature, thinking mode, maxOutputTokens, topP, topK, presencePenalty, frequencyPenalty, etc. Use this for CHANGING MODEL SETTINGS, NOT for updating custom instructions text. CRITICAL: Before setting defaultLlmModelName, you MUST call fetchAvailableModels to get the exact apiName (e.g., 'gpt-5-2025-08-07' not 'gpt-5'). For customLlmParameters field, you can provide partial updates - they will be merged with existing values. Example: to turn on thinking for gpt-4o, just pass { openai: { 'gpt-4o': { thinking: true } } }.",
      tool: async (
        projectId: string,
        config: {
          defaultLlmProviderName?: string | null;
          defaultLlmModelName?: string | null;
          customLlmModelName?: string | null;
          customLlmBaseURL?: string | null;
          maxInputTokens?: number | null;
          customLlmParameters?: CustomLlmParameters | null;
        },
      ) => {
        // Merge customLlmParameters if provided (deep merge at model level)
        let customLlmParameters = config.customLlmParameters;
        if (customLlmParameters) {
          const projects = await trpcClient.project.getUserProjects.query();
          const current =
            projects.find((p) => p.id === projectId)?.customLlmParameters || {};

          const merged = { ...current };
          for (const [provider, models] of Object.entries(
            customLlmParameters,
          )) {
            merged[provider] = merged[provider] || {};
            for (const [model, params] of Object.entries(models)) {
              merged[provider][model] = {
                ...merged[provider][model],
                ...params,
              };
            }
          }
          customLlmParameters = merged;
        }

        const result = await trpcClient.project.updateProject.mutate({
          projectId,
          ...config,
          customLlmParameters,
        });

        // Invalidate caches to refresh UI
        await utils.project.getProjectLlmSettings.invalidate({ projectId });
        await utils.project.getUserProjects.invalidate();

        return result;
      },
      toolSchema: updateProjectModelConfigSchema,
    });

    /* mcp server management */

    /**
     * Registers a tool to fetch all MCP (Model Context Protocol) servers for a project.
     * Returns server configuration including URL, headers, and authentication status.
     * @param {string} projectId - The project ID to fetch MCP servers for
     * @returns {Object} MCP server details including ID, URL, headers, and auth status
     */
    registerTool({
      name: "fetchProjectMcpServers",
      description: "Fetches MCP servers for a project.",
      tool: async (projectId: string) => {
        return await trpcClient.tools.listMcpServers.query({ projectId });
      },
      toolSchema: fetchProjectMcpServersSchema,
    });

    /**
     * Registers a tool to add a new MCP server to a project.
     * @param {string} projectId - The project ID to add the MCP server to
     * @param {Object} server - MCP server configuration
     * @param {string} server.url - The URL of the MCP server
     * @param {Record<string, string>} server.customHeaders - Custom HTTP headers for the server
     * @param {MCPTransport} server.mcpTransport - Transport mechanism (e.g., SSE, WebSocket)
     * @returns {Object} Created MCP server details including capabilities and version info
     */
    registerTool({
      name: "addMcpServer",
      description: "Adds a new MCP server to a project.",
      tool: async (params: {
        projectId: string;
        url: string;
        customHeaders: Record<string, string>;
        mcpTransport: MCPTransport;
      }) => {
        const result = await trpcClient.tools.addMcpServer.mutate({
          projectId: params.projectId,
          url: params.url,
          customHeaders: params.customHeaders,
          mcpTransport: params.mcpTransport,
        });

        // Invalidate the mcp server cache to refresh the component
        await utils.tools.listMcpServers.invalidate({
          projectId: params.projectId,
        });

        return result;
      },
      toolSchema: addMcpServerSchema,
    });

    /**
     * Registers a tool to delete an MCP server from a project.
     * @param {Object} params - Deletion parameters
     * @param {string} params.projectId - The project ID containing the MCP server
     * @param {string} params.serverId - The ID of the MCP server to delete
     * @returns {Object} Success status indicating the server was deleted
     */
    registerTool({
      name: "deleteMcpServer",
      description: "Deletes an MCP server for a project.",
      tool: async (params: { projectId: string; serverId: string }) => {
        await trpcClient.tools.deleteMcpServer.mutate({
          projectId: params.projectId,
          serverId: params.serverId,
        });

        // Invalidate the mcp server cache to refresh the component
        await utils.tools.listMcpServers.invalidate({
          projectId: params.projectId,
        });

        return { success: true };
      },
      toolSchema: deleteMcpServerSchema,
    });

    /**
     * Registers a tool to authorize an MCP server for access to external services.
     * Handles OAuth flows and other authentication mechanisms for MCP servers.
     * @param {Object} params - Authorization parameters
     * @param {string|null} params.contextKey - Optional context key for authorization flow
     * @param {string} params.toolProviderId - The ID of the MCP server to authorize
     * @returns {Object} Authorization result with success status and optional redirect URL
     */
    registerTool({
      name: "authorizeMcpServer",
      description: "Authorizes an MCP server for a project.",
      tool: async (params: {
        contextKey: string | null;
        toolProviderId: string;
      }) => {
        const authResult = await trpcClient.tools.authorizeMcpServer.mutate({
          contextKey: params.contextKey,
          toolProviderId: params.toolProviderId,
        });
        return authResult;
      },
      toolSchema: authorizeMcpServerSchema,
    });

    /**
     * Registers a tool to inspect and get available tools from an MCP server.
     * Returns the tools/capabilities exposed by the MCP server along with server information.
     * @param {Object} params - Inspection parameters
     * @param {string} params.projectId - The project ID containing the MCP server
     * @param {string} params.serverId - The ID of the MCP server to inspect
     * @returns {Object} Available tools and server information including capabilities and version
     */
    registerTool({
      name: "getMcpServerTools",
      description: "Gets the tools for an MCP server for a project.",
      tool: async (params: { projectId: string; serverId: string }) => {
        return await trpcClient.tools.inspectMcpServer.query({
          projectId: params.projectId,
          serverId: params.serverId,
        });
      },
      toolSchema: getMcpServerToolsSchema,
    });

    /* oauth validation settings management */

    /**
     * Registers a tool to fetch OAuth validation settings for a project.
     * Returns the current OAuth validation mode, public key, and secret key status.
     * @param {string} projectId - The project ID to fetch OAuth validation settings for
     * @returns {Object} OAuth validation settings including mode, public key, and secret key status
     */
    registerTool({
      name: "fetchOAuthValidationSettings",
      description: "Fetches OAuth validation settings for a project.",
      tool: async (projectId: string) => {
        return await trpcClient.project.getOAuthValidationSettings.query({
          projectId,
        });
      },
      toolSchema: fetchOAuthValidationSettingsSchema,
    });

    /**
     * Registers a tool to update OAuth validation settings for a project.
     * Updates the OAuth validation mode and associated keys (secret key for symmetric, public key for asymmetric manual).
     * @param {string} projectId - The project ID to update
     * @param {Object} settings - OAuth validation settings to update
     * @param {OAuthValidationMode} settings.mode - The OAuth validation mode
     * @param {string} settings.secretKey - The secret key for symmetric validation (optional)
     * @param {string} settings.publicKey - The public key for asymmetric manual validation (optional)
     * @returns {Object} Updated OAuth validation settings
     */
    registerTool({
      name: "updateOAuthValidationSettings",
      description: "Updates OAuth validation settings for a project.",
      tool: async (
        projectId: string,
        settings: {
          mode: OAuthValidationMode;
          secretKey?: string;
          publicKey?: string;
        },
      ) => {
        const result =
          await trpcClient.project.updateOAuthValidationSettings.mutate({
            projectId: projectId,
            mode: settings.mode,
            secretKey: settings.secretKey,
            publicKey: settings.publicKey,
          });

        // Invalidate the OAuth settings cache to refresh the component
        await utils.project.getOAuthValidationSettings.invalidate({
          projectId,
        });

        return result;
      },
      toolSchema: updateOAuthValidationSettingsSchema,
    });

    /* thread and message management */

    /**
     * Registers a tool to fetch threads for a specific project.
     * Returns thread list with message counts, errors, and metadata.
     * Useful for finding the latest thread or listing all threads in a project.
     * @param {Object} params - Fetch parameters
     * @param {string} params.projectId - The project ID to fetch threads for
     * @param {number} params.limit - Maximum number of threads to return (1-100, default: 10)
     * @param {string} params.sortField - Field to sort by (default: created)
     * @param {string} params.sortDirection - Sort direction (default: desc for newest first)
     * @returns {Object} Object containing threads array and total count
     */
    registerTool({
      name: "fetchProjectThreads",
      description:
        "Fetches threads for a specific project. By default returns the 10 most recent threads sorted by creation date (newest first). Use this to find the latest thread or list threads in a project. IMPORTANT: To show the last message in a project, call this with limit=1 and sortField='created' to get the most recent thread. The response includes the COMPLETE thread ID (e.g., 'thr_AjVDAowI.646605') - you MUST use the ENTIRE ID string when passing it to ThreadMessagesInline component. DO NOT truncate or shorten the thread ID.",
      tool: async (params: {
        projectId: string;
        limit?: number;
        sortField?:
          | "created"
          | "updated"
          | "threadId"
          | "threadName"
          | "contextKey"
          | "messages"
          | "errors";
        sortDirection?: "asc" | "desc";
      }) => {
        const result = await trpcClient.thread.getThreads.query({
          projectId: params.projectId,
          offset: 0,
          limit: params.limit || 10,
          includeMessages: false,
          sortField: params.sortField || "created",
          sortDirection: params.sortDirection || "desc",
        });

        return result;
      },
      toolSchema: fetchProjectThreadsSchema,
    });
  }, [registerTool, trpcClient, utils]);
}

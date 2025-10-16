import type { CustomLlmParameters } from "@tambo-ai-cloud/core";
import { z } from "zod";
import { invalidateLlmSettingsCache } from "./helpers";
import type { RegisterToolFn, ToolContext } from "./types";

/**
 * Zod schema for the `fetchAvailableLlmModels` function.
 * Returns all available LLM providers and their models with IDs.
 */
export const fetchAvailableLlmModelsSchema = z
  .function()
  .args()
  .returns(
    z.record(
      z.string(),
      z.object({
        apiName: z.string(),
        displayName: z.string(),
        docLinkRoot: z.string().optional(),
        apiKeyLink: z.string().optional(),
        isCustomProvider: z.boolean().optional(),
        requiresBaseUrl: z.boolean().optional(),
        isDefaultProvider: z.boolean().optional(),
        models: z
          .record(
            z.string(),
            z.object({
              displayName: z.string(),
              apiName: z.string(),
              inputTokenLimit: z.union([z.number(), z.string()]).optional(),
              outputTokenLimit: z.union([z.number(), z.string()]).optional(),
              status: z.enum(["tested", "untested", "deprecated"]).optional(),
              releaseDate: z.string().optional(),
              modelSpecificParams: z.record(z.string(), z.any()).optional(),
            }),
          )
          .optional(),
        providerSpecificParams: z.record(z.string(), z.any()).optional(),
      }),
    ),
  );

/**
 * Zod schema for the `fetchProjectLlmSettings` function.
 * Defines the argument as a project ID string and the return type as an object containing LLM settings.
 */
export const fetchProjectLlmSettingsSchema = z
  .function()
  .args(
    z
      .object({
        projectId: z
          .string()
          .describe(
            "The complete project ID (e.g., 'p_u2tgQg5U.43bbdf'). Must include the 'p_' prefix.",
          ),
      })
      .describe("Arguments for fetching project LLM settings"),
  )
  .returns(
    z.object({
      defaultLlmProviderName: z.string().nullable(),
      defaultLlmModelName: z.string().nullable(),
      customLlmModelName: z.string().nullable(),
      customLlmBaseURL: z.string().nullable(),
      maxInputTokens: z.number().nullable(),
      providerType: z.string().nullable(),
      agentProviderType: z.string().nullable(),
      agentUrl: z.string().nullable(),
      agentName: z.string().nullable(),
      agentHeaders: z.record(z.string(), z.string()).nullable(),
      customLlmParameters: z
        .record(
          z.string().describe("Provider name"),
          z.record(
            z.string().describe("Model name"),
            z.record(
              z.string().describe("Parameter name"),
              z.any().describe("Parameter value"),
            ),
          ),
        )
        .nullable()
        .describe(
          'Structure: { "providerName": { "modelName": { "parameterName": value } } }',
        ),
    }),
  );

/**
 * Zod schema for the `updateProjectLlmSettings` function.
 * Defines arguments as the project ID string and an LLM settings object,
 * and the return type as an object representing the updated LLM settings.
 */
export const updateProjectLlmSettingsSchema = z
  .function()
  .args(
    z
      .object({
        projectId: z
          .string()
          .describe(
            "The complete project ID (e.g., 'p_u2tgQg5U.43bbdf'). Must include the 'p_' prefix.",
          ),
        defaultLlmProviderName: z.string().optional(),
        defaultLlmModelName: z.string().nullable().optional(),
        customLlmModelName: z.string().nullable().optional(),
        customLlmBaseURL: z.string().nullable().optional(),
        maxInputTokens: z.number().nullable().optional(),
        customLlmParameters: z
          .record(
            z.string().describe("Provider name (e.g., 'openai', 'anthropic')"),
            z.record(
              z
                .string()
                .describe("Model name (e.g., 'gpt-4o', 'gpt-5-2025-08-07')"),
              z.record(
                z
                  .string()
                  .describe(
                    "Parameter name (e.g., 'reasoningEffort', 'temperature')",
                  ),
                z.any().describe("Parameter value (e.g., 'high', 0.7, true)"),
              ),
            ),
          )
          .nullable()
          .optional()
          .describe(
            'Custom LLM parameters. Structure: { "providerName": { "modelName": { "parameterName": parameterValue } } }. Example: { "openai": { "gpt-5-2025-08-07": { "reasoningEffort": "high", "reasoningSummary": "auto" } } }',
          ),
      })
      .describe("The LLM settings to update"),
  )
  .returns(
    z.object({
      defaultLlmProviderName: z.string().nullable(),
      defaultLlmModelName: z.string().nullable(),
      customLlmModelName: z.string().nullable(),
      customLlmBaseURL: z.string().nullable(),
      maxInputTokens: z.number().nullable(),
      customLlmParameters: z
        .record(z.string(), z.record(z.string(), z.record(z.string(), z.any())))
        .nullable()
        .optional(),
    }),
  );

/**
 * Register LLM provider settings management tools
 */
export function registerLlmTools(
  registerTool: RegisterToolFn,
  ctx: ToolContext,
) {
  /**
   * Registers a tool to fetch all available LLM providers and models.
   * Returns a comprehensive list of providers with their model IDs and metadata.
   * This helps identify the correct model ID to use when updating LLM settings.
   * @returns {Object} Complete LLM provider configuration with all available models
   */
  registerTool({
    name: "fetchAvailableLlmModels",
    description:
      "Fetches all available LLM providers and their models with IDs. Use this to find the correct model ID (apiName) when users want to change models. For example, if a user asks to change to GPT-4, this returns the actual model ID like 'gpt-4o' or 'gpt-4-turbo' that should be used with updateProjectLlmSettings.",
    tool: async () => {
      return await ctx.trpcClient.llm.getLlmProviderConfig.query();
    },
    toolSchema: fetchAvailableLlmModelsSchema,
  });

  /**
   * Registers a tool to fetch LLM configuration settings for a project.
   * Returns the current LLM provider, model, custom settings, and agent settings.
   * @param {Object} params - Parameters object
   * @param {string} params.projectId - The complete project ID including 'p_' prefix
   * @returns {Object} LLM configuration including provider, model, custom settings, and agent settings
   */
  registerTool({
    name: "fetchProjectLlmSettings",
    description:
      "Fetches LLM configuration settings for a project. Requires the complete project ID with 'p_' prefix.",
    tool: async ({ projectId }: { projectId: string }) => {
      return await ctx.trpcClient.project.getProjectLlmSettings.query({
        projectId,
      });
    },
    toolSchema: fetchProjectLlmSettingsSchema,
  });

  /**
   * Registers a tool to update LLM configuration settings for a project.
   * Updates the default LLM provider, model, custom configurations, and custom LLM parameters.
   * IMPORTANT: After calling this tool, wait for it to complete, then show a NEW instance of the ProviderKeySection component to display the updated settings.
   * @param {Object} params - Parameters object
   * @param {string} params.projectId - The complete project ID including 'p_' prefix
   * @param {string} params.defaultLlmProviderName - The LLM provider name (e.g., 'openai', 'anthropic')
   * @param {string|null} params.defaultLlmModelName - The default model name
   * @param {string|null} params.customLlmModelName - Custom model name if using custom provider
   * @param {string|null} params.customLlmBaseURL - Custom base URL for LLM API
   * @param {number|null} params.maxInputTokens - Maximum input tokens
   * @param {CustomLlmParameters|null} params.customLlmParameters - Custom parameters with structure: { providerName: { modelName: { parameterName: parameterValue } } }
   * @returns {Object} Updated LLM configuration settings
   */
  registerTool({
    name: "updateProjectLlmSettings",
    description:
      'Updates LLM configuration settings for a project, including provider, model, and custom LLM parameters. For customLlmParameters, use the structure: { "providerName": { "modelName": { "parameterName": parameterValue } } }. Example: { "openai": { "gpt-5-2025-08-07": { "reasoningEffort": "high" } } }. IMPORTANT: After this tool completes, show a NEW ProviderKeySection component to display the updated settings. The component will automatically fetch the latest data.',
    tool: async ({
      projectId,
      defaultLlmProviderName,
      defaultLlmModelName,
      customLlmModelName,
      customLlmBaseURL,
      maxInputTokens,
      customLlmParameters,
    }: {
      projectId: string;
      defaultLlmProviderName?: string;
      defaultLlmModelName?: string | null;
      customLlmModelName?: string | null;
      customLlmBaseURL?: string | null;
      maxInputTokens?: number | null;
      customLlmParameters?: CustomLlmParameters | null;
    }) => {
      const result =
        await ctx.trpcClient.project.updateProjectLlmSettings.mutate({
          projectId,
          ...(defaultLlmProviderName !== undefined && {
            defaultLlmProviderName,
          }),
          ...(defaultLlmModelName !== undefined && {
            defaultLlmModelName,
          }),
          ...(customLlmModelName !== undefined && {
            customLlmModelName,
          }),
          ...(customLlmBaseURL !== undefined && {
            customLlmBaseURL,
          }),
          ...(maxInputTokens !== undefined && {
            maxInputTokens,
          }),
          ...(customLlmParameters !== undefined && {
            customLlmParameters,
          }),
        });

      // Invalidate all caches that display LLM settings
      await Promise.all([
        invalidateLlmSettingsCache(ctx, projectId),
        ctx.utils.project.getProjectById.invalidate(projectId),
        ctx.utils.project.getUserProjects.invalidate(),
      ]);

      return result;
    },
    toolSchema: updateProjectLlmSettingsSchema,
  });
}

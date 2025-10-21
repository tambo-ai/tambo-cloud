import {
  getProjectLlmSettingsInput,
  llmProviderConfigSchema,
  projectLlmSettingsSchema,
  updateProjectLlmSettingsInput,
  updateProjectLlmSettingsOutputSchema,
} from "@/lib/schemas/llm";
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
  .returns(llmProviderConfigSchema);

/**
 * Zod schema for the `fetchProjectLlmSettings` function.
 * Defines the argument as a project ID string and the return type as an object containing LLM settings.
 */
export const fetchProjectLlmSettingsSchema = z
  .function()
  .args(getProjectLlmSettingsInput)
  .returns(projectLlmSettingsSchema);

/**
 * Zod schema for the `updateProjectLlmSettings` function.
 * Defines arguments as the project ID string and an LLM settings object,
 * and the return type as an object representing the updated LLM settings.
 */
export const updateProjectLlmSettingsSchema = z
  .function()
  .args(updateProjectLlmSettingsInput)
  .returns(updateProjectLlmSettingsOutputSchema);

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
   * @param {string} params.projectId - The complete project ID
   * @returns {Object} LLM configuration including provider, model, custom settings, and agent settings
   */
  registerTool({
    name: "fetchProjectLlmSettings",
    description:
      "Fetches LLM configuration settings for a project. Requires the complete project ID.",
    tool: async (params: { projectId: string }) => {
      return await ctx.trpcClient.project.getProjectLlmSettings.query({
        projectId: params.projectId,
      });
    },
    toolSchema: fetchProjectLlmSettingsSchema,
  });

  /**
   * Registers a tool to update LLM configuration settings for a project.
   * Updates the default LLM provider, model, custom configurations, and custom LLM parameters.
   * IMPORTANT: After calling this tool, wait for it to complete, then show a NEW instance of the ProviderKeySection component to display the updated settings.
   * @param {Object} params - Parameters object
   * @param {string} params.projectId - The complete project ID
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
    tool: async (params: {
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
          projectId: params.projectId,
          ...(params.defaultLlmProviderName !== undefined && {
            defaultLlmProviderName: params.defaultLlmProviderName,
          }),
          ...(params.defaultLlmModelName !== undefined && {
            defaultLlmModelName: params.defaultLlmModelName,
          }),
          ...(params.customLlmModelName !== undefined && {
            customLlmModelName: params.customLlmModelName,
          }),
          ...(params.customLlmBaseURL !== undefined && {
            customLlmBaseURL: params.customLlmBaseURL,
          }),
          ...(params.maxInputTokens !== undefined && {
            maxInputTokens: params.maxInputTokens,
          }),
          ...(params.customLlmParameters !== undefined && {
            customLlmParameters: params.customLlmParameters,
          }),
        });

      // Invalidate all caches that display LLM settings
      await Promise.all([
        invalidateLlmSettingsCache(ctx, params.projectId),
        ctx.utils.project.getProjectById.invalidate(params.projectId),
        ctx.utils.project.getUserProjects.invalidate(),
      ]);

      return result;
    },
    toolSchema: updateProjectLlmSettingsSchema,
  });
}

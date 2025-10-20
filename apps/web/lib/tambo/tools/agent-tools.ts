import { AgentProviderType, AiProviderType } from "@tambo-ai-cloud/core";
import { z } from "zod";
import { invalidateLlmSettingsCache, invalidateProjectCache } from "./helpers";
import type { RegisterToolFn, ToolContext } from "./types";

/**
 * Zod schema for the `updateProjectAgentSettings` function.
 * Defines arguments as the project ID string and agent settings object.
 */
export const updateProjectAgentSettingsSchema = z
  .function()
  .args(
    z
      .object({
        projectId: z
          .string()
          .describe("The complete project ID (e.g., 'p_u2tgQg5U.43bbdf')."),
        providerType: z
          .nativeEnum(AiProviderType)
          .describe("The provider type (LLM or AGENT)"),
        agentProviderType: z
          .nativeEnum(AgentProviderType)
          .nullable()
          .optional()
          .describe("The agent provider type if using agent mode"),
        agentUrl: z
          .string()
          .url()
          .nullable()
          .optional()
          .describe("The agent URL if using agent mode"),
        agentName: z
          .string()
          .nullable()
          .optional()
          .describe("The agent name if using agent mode"),
        agentHeaders: z
          .record(z.string(), z.string())
          .nullable()
          .optional()
          .describe("Custom headers for agent requests"),
      })
      .describe("The agent settings to update"),
  )
  .returns(
    z.object({
      providerType: z.nativeEnum(AiProviderType),
      agentProviderType: z.nativeEnum(AgentProviderType).nullable(),
      agentUrl: z.string().nullable(),
      agentName: z.string().nullable(),
      agentHeaders: z.record(z.string(), z.string()).nullable(),
    }),
  );

/**
 * Register agent-specific settings management tools
 */
export function registerAgentTools(
  registerTool: RegisterToolFn,
  ctx: ToolContext,
) {
  /**
   * Registers a tool to update agent settings for a project.
   * Updates the provider type (LLM or AGENT) and agent-specific configurations.
   * @param {Object} params - Parameters object
   * @param {string} params.projectId - The complete project ID
   * @param {AiProviderType} params.providerType - The provider type (LLM or AGENT)
   * @param {AgentProviderType} params.agentProviderType - The agent provider type (optional)
   * @param {string} params.agentUrl - The agent URL (optional)
   * @param {string} params.agentName - The agent name (optional)
   * @param {Record<string, string>} params.agentHeaders - Custom headers for agent requests (optional)
   * @returns {Object} Updated agent settings
   */
  registerTool({
    name: "updateProjectAgentSettings",
    description:
      "Updates agent settings for a project, including provider type and agent-specific configurations. Requires complete project ID.",
    tool: async ({
      projectId,
      providerType,
      agentProviderType,
      agentUrl,
      agentName,
      agentHeaders,
    }: {
      projectId: string;
      providerType: AiProviderType;
      agentProviderType?: AgentProviderType | null;
      agentUrl?: string | null;
      agentName?: string | null;
      agentHeaders?: Record<string, string> | null;
    }) => {
      const result =
        await ctx.trpcClient.project.updateProjectAgentSettings.mutate({
          projectId,
          providerType,
          agentProviderType,
          agentUrl,
          agentName,
          agentHeaders,
        });

      // Invalidate all caches that display agent settings (shown in LLM settings view)
      await Promise.all([
        invalidateLlmSettingsCache(ctx, projectId),
        ctx.utils.project.getProjectById.invalidate(projectId),
        invalidateProjectCache(ctx),
      ]);

      return result;
    },
    toolSchema: updateProjectAgentSettingsSchema,
  });
}

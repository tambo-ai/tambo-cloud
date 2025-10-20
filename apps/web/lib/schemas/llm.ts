import { customLlmParametersSchema } from "@/lib/llm-parameters";
import { agentHeadersSchema } from "@/lib/schemas/project";
import { AgentProviderType, AiProviderType } from "@tambo-ai-cloud/core";
import { z } from "zod";

/**
 * Shared schemas for LLM operations.
 * Used by both tRPC routers and tool definitions.
 */

// Input schemas
export const getProjectLlmSettingsInput = z.object({
  projectId: z
    .string()
    .describe("The complete project ID (e.g., 'p_u2tgQg5U.43bbdf')"),
});

export const updateProjectLlmSettingsInput = z.object({
  projectId: z
    .string()
    .describe("The complete project ID (e.g., 'p_u2tgQg5U.43bbdf')"),
  defaultLlmProviderName: z
    .string()
    .nullable()
    .optional()
    .describe("The LLM provider name (e.g., 'openai', 'anthropic')"),
  defaultLlmModelName: z
    .string()
    .nullable()
    .optional()
    .describe("The default model name"),
  customLlmModelName: z
    .string()
    .nullable()
    .optional()
    .describe("Custom model name if using custom provider"),
  customLlmBaseURL: z
    .string()
    .nullable()
    .optional()
    .describe("Custom base URL for LLM API"),
  maxInputTokens: z
    .number()
    .nullable()
    .optional()
    .describe("Maximum input tokens"),
  customLlmParameters: customLlmParametersSchema
    .nullable()
    .optional()
    .describe(
      'Custom LLM parameters. Structure: { "providerName": { "modelName": { "parameterName": parameterValue } } }',
    ),
});

// Output schemas
export const projectLlmSettingsSchema = z.object({
  defaultLlmProviderName: z.string().nullable(),
  defaultLlmModelName: z.string().nullable(),
  customLlmModelName: z.string().nullable(),
  customLlmBaseURL: z.string().nullable(),
  maxInputTokens: z.number().nullable(),
  providerType: z.nativeEnum(AiProviderType).nullish(),
  agentProviderType: z.nativeEnum(AgentProviderType).nullish(),
  agentUrl: z.string().nullable(),
  agentName: z.string().nullable(),
  agentHeaders: agentHeadersSchema.nullable(),
  customLlmParameters: customLlmParametersSchema.nullable(),
});

export const updateProjectLlmSettingsOutputSchema = z.object({
  defaultLlmProviderName: z.string().nullable(),
  defaultLlmModelName: z.string().nullable(),
  customLlmModelName: z.string().nullable(),
  customLlmBaseURL: z.string().nullable(),
  maxInputTokens: z.number().nullable(),
  customLlmParameters: customLlmParametersSchema.nullable(),
});

// For fetchAvailableLlmModels - this returns the LlmProviderConfig from core
export const llmProviderConfigSchema = z.record(
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
          inputTokenLimit: z.number().optional(),
          outputTokenLimit: z.number().optional(),
          status: z.enum(["tested", "untested", "deprecated"]).optional(),
          releaseDate: z.string().optional(),
          notes: z.string().optional(),
          docLink: z.string().optional(),
          modelSpecificParams: z.record(z.string(), z.any()).optional(),
        }),
      )
      .optional(),
    providerSpecificParams: z.record(z.string(), z.any()).optional(),
  }),
);

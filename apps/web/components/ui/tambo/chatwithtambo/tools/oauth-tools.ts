import { OAuthValidationMode } from "@tambo-ai-cloud/core";
import { z } from "zod";
import { invalidateOAuthSettingsCache } from "./helpers";
import type { RegisterToolFn, ToolContext } from "./types";

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
          .describe(
            "The secret key for symmetric validation (required when mode is SYMMETRIC)",
          ),
        publicKey: z
          .string()
          .optional()
          .describe(
            "The public key for asymmetric manual validation (required when mode is ASYMMETRIC_MANUAL)",
          ),
      })
      .refine(
        (data) => {
          // Validate required fields based on mode
          if (data.mode === OAuthValidationMode.SYMMETRIC) {
            return !!data.secretKey;
          }
          if (data.mode === OAuthValidationMode.ASYMMETRIC_MANUAL) {
            return !!data.publicKey;
          }
          return true;
        },
        {
          message:
            "Secret key is required for SYMMETRIC mode, public key is required for ASYMMETRIC_MANUAL mode",
        },
      )
      .describe("The OAuth validation settings to update"),
  )
  .returns(
    z.object({
      mode: z.nativeEnum(OAuthValidationMode),
      publicKey: z.string().nullable(),
      hasSecretKey: z.boolean(),
    }),
  );

/**
 * Register OAuth validation settings management tools
 */
export function registerOAuthTools(
  registerTool: RegisterToolFn,
  ctx: ToolContext,
) {
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
      return await ctx.trpcClient.project.getOAuthValidationSettings.query({
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
        await ctx.trpcClient.project.updateOAuthValidationSettings.mutate({
          projectId: projectId,
          mode: settings.mode,
          secretKey: settings.secretKey,
          publicKey: settings.publicKey,
        });

      // Invalidate the OAuth settings cache to refresh the component
      await invalidateOAuthSettingsCache(ctx, projectId);

      return result;
    },
    toolSchema: updateOAuthValidationSettingsSchema,
  });
}

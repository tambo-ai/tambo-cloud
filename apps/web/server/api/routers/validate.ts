import {
  validateBasicFormat,
  type ApiKeyValidationResult,
} from "@/lib/api-key-validation";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const ApiKeyValidationOptionsSchema = z.object({
  allowEmpty: z.boolean().optional(),
  timeout: z.number().optional().default(10000),
});

export const validateRouter = createTRPCRouter({
  validateApiKey: publicProcedure
    .input(
      z.object({
        apiKey: z.string(),
        provider: z.string(),
        options: ApiKeyValidationOptionsSchema.optional().default({}),
      }),
    )
    .mutation(async ({ input }) => {
      const { apiKey, provider, options = {} } = input;
      const { allowEmpty = false, timeout = 10000 } = options as z.infer<
        typeof ApiKeyValidationOptionsSchema
      >;

      // Validate required fields
      if (!provider) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Missing required field: provider",
        });
      }

      // Handle empty API key based on allowEmpty flag
      if (!apiKey.trim()) {
        if (allowEmpty) {
          return {
            isValid: true,
            provider,
            details: {
              note: "Empty API key accepted for this provider",
            },
          };
        }
        return {
          isValid: false,
          error: "API key cannot be empty",
          provider,
        };
      }

      // Basic format validation first
      const basicValidation = validateBasicFormat(apiKey.trim(), provider);
      if (!basicValidation.isValid) {
        return basicValidation;
      }

      // Perform provider-specific validation
      let result: ApiKeyValidationResult;
      switch (provider.toLowerCase()) {
        case "openai":
          result = await validateOpenAIKey(apiKey.trim(), timeout);
          break;
        case "anthropic":
          result = await validateAnthropicKey(apiKey.trim(), timeout);
          break;
        case "mistral":
          result = await validateMistralKey(apiKey.trim(), timeout);
          break;
        case "openai-compatible":
          // Static validation only for OpenAI-compatible providers
          result = {
            isValid: true,
            provider,
            details: {
              note: "Format validation only - endpoint structures vary by provider",
            },
          };
          break;
        default:
          result = {
            isValid: true,
            provider,
            details: {
              note: "Dynamic validation not available for this provider - basic format validation only",
            },
          };
      }

      return result;
    }),
});

// OpenAI validation
async function validateOpenAIKey(
  key: string,
  timeout: number,
): Promise<ApiKeyValidationResult> {
  const provider = "openai";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return {
        isValid: true,
        provider,
        details: {
          modelCount: data.data?.length || 0,
        },
      };
    } else if (response.status === 401) {
      return {
        isValid: false,
        error: "Invalid API key - authentication failed",
        provider,
      };
    } else if (response.status === 429) {
      return {
        isValid: false,
        error: "Rate limit exceeded - key is likely valid but rate limited",
        provider,
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        isValid: false,
        error: errorData.error?.message || `API error: ${response.status}`,
        provider,
      };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        isValid: false,
        error: "Validation timed out",
        provider,
      };
    }
    throw error;
  }
}

// Anthropic validation
async function validateAnthropicKey(
  key: string,
  timeout: number,
): Promise<ApiKeyValidationResult> {
  const provider = "anthropic";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch("https://api.anthropic.com/v1/models", {
      method: "GET",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return {
        isValid: true,
        provider,
        details: {
          modelCount: data.data?.length || 0,
        },
      };
    } else if (response.status === 401) {
      return {
        isValid: false,
        error: "Invalid API key - authentication failed",
        provider,
      };
    } else if (response.status === 429) {
      return {
        isValid: false,
        error: "Rate limit exceeded - key is likely valid but rate limited",
        provider,
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        isValid: false,
        error: errorData.error?.message || `API error: ${response.status}`,
        provider,
      };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        isValid: false,
        error: "Validation timed out",
        provider,
      };
    }
    throw error;
  }
}

// Mistral validation
async function validateMistralKey(
  key: string,
  timeout: number,
): Promise<ApiKeyValidationResult> {
  const provider = "mistral";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch("https://api.mistral.ai/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return {
        isValid: true,
        provider,
        details: {
          modelCount: data.data?.length || 0,
        },
      };
    } else if (response.status === 401) {
      return {
        isValid: false,
        error: "Invalid API key - authentication failed",
        provider,
      };
    } else if (response.status === 429) {
      return {
        isValid: false,
        error: "Rate limit exceeded - key is likely valid but rate limited",
        provider,
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        isValid: false,
        error: errorData.error?.message || `API error: ${response.status}`,
        provider,
      };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        isValid: false,
        error: "Validation timed out",
        provider,
      };
    }
    throw error;
  }
}

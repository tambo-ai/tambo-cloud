/**
 * API Key Validation Utilities
 *
 * This module provides validation for various LLM provider API keys
 * using server-side validation for major providers (OpenAI, Anthropic, Mistral)
 * and static validation for OpenAI-compatible providers.
 */

export interface ApiKeyValidationResult {
  isValid: boolean;
  error?: string;
  provider?: string;
  details?: {
    note?: string;
    modelCount?: number;
    quotaInfo?: any;
  };
}

export interface ApiKeyValidationOptions {
  allowEmpty?: boolean;
  timeout?: number; // in milliseconds, default 10000
  skipDynamicValidation?: boolean; // fallback to basic format check
}

/**
 * Main validation function that uses server-side validation for major providers
 */
export async function validateApiKey(
  apiKey: string,
  providerName: string,
  options: ApiKeyValidationOptions = {},
): Promise<ApiKeyValidationResult> {
  const {
    allowEmpty = false,
    timeout = 10000,
    skipDynamicValidation = false,
  } = options;

  // Handle empty keys
  if (!apiKey || !apiKey.trim()) {
    if (allowEmpty) {
      return { isValid: true, provider: providerName };
    }
    return {
      isValid: false,
      error: "API key cannot be empty",
      provider: providerName,
    };
  }

  const trimmedKey = apiKey.trim();

  // Basic format validation first (quick client-side check)
  const basicValidation = validateBasicFormat(trimmedKey, providerName);
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  // Skip dynamic validation if requested or for OpenAI-compatible providers
  if (
    skipDynamicValidation ||
    providerName.toLowerCase() === "openai-compatible"
  ) {
    const note =
      providerName.toLowerCase() === "openai-compatible"
        ? "Format validation only - endpoint structures vary by provider"
        : "Basic format validation only";

    return {
      isValid: true,
      provider: providerName,
      details: { note },
    };
  }

  // Use server-side validation for major providers only
  const supportedProviders = ["openai", "anthropic", "mistral"];
  if (!supportedProviders.includes(providerName.toLowerCase())) {
    return {
      isValid: true,
      provider: providerName,
      details: {
        note: "Dynamic validation not available for this provider - basic format validation only",
      },
    };
  }

  try {
    const response = await fetch("/api/validate-api-key", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKey: trimmedKey,
        provider: providerName,
        options: { timeout },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        isValid: false,
        error: errorData.error || `Server error: ${response.status}`,
        provider: providerName,
      };
    }

    return await response.json();
  } catch (error) {
    return {
      isValid: false,
      error: `Validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      provider: providerName,
    };
  }
}

/**
 * Basic format validation (client-side for immediate feedback)
 */
function validateBasicFormat(
  key: string,
  providerName: string,
): ApiKeyValidationResult {
  // Basic length check
  if (key.length < 8) {
    return {
      isValid: false,
      error: "API key appears to be too short",
      provider: providerName,
    };
  }

  // Check for obviously invalid patterns
  const invalidPatterns = [
    /^(your|api|key|token|secret|test|demo|example|sample)/i,
    /\s/, // Contains whitespace
    /<|>/, // Contains angle brackets
    /^[x]+$/i, // All x's (redacted)
    /\*{3,}/, // Multiple asterisks (redacted)
  ];

  for (const pattern of invalidPatterns) {
    if (pattern.test(key)) {
      return {
        isValid: false,
        error:
          "API key appears to be a placeholder or contains invalid characters",
        provider: providerName,
      };
    }
  }

  // Provider-specific basic format checks
  switch (providerName.toLowerCase()) {
    case "openai":
      if (!key.startsWith("sk-")) {
        return {
          isValid: false,
          error: "OpenAI API key must start with 'sk-'",
          provider: providerName,
        };
      }
      break;
    case "anthropic":
      if (!key.startsWith("sk-ant-api03-")) {
        return {
          isValid: false,
          error: "Anthropic API key must start with 'sk-ant-api03-'",
          provider: providerName,
        };
      }
      break;
    // No specific format requirements for Mistral or OpenAI-compatible
  }

  return { isValid: true, provider: providerName };
}

/**
 * Utility function to get validation requirements for a provider
 */
export function getProviderKeyRequirements(providerName: string): {
  description: string;
} {
  switch (providerName.toLowerCase()) {
    case "openai":
      return {
        description: "OpenAI API keys start with 'sk-' and vary by key type",
      };
    case "anthropic":
      return {
        description: "Anthropic API keys start with 'sk-ant-api03-'",
      };
    case "mistral":
      return {
        description: "Mistral API keys are 32-character alphanumeric strings",
      };
    case "openai-compatible":
      return {
        description: "Format varies by OpenAI-compatible provider",
      };
    default:
      return {
        description: "Format varies by provider",
      };
  }
}

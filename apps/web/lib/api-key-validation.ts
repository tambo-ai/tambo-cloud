/**
 * Shared API Key Validation Utilities
 *
 * This module contains validation logic shared between client-side and server-side
 * validation functions to avoid code duplication.
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

/**
 * Basic format validation for API keys
 * Performs client-side validation for immediate feedback without API calls
 */
export function validateBasicFormat(
  key: string,
  providerName: string,
): ApiKeyValidationResult {
  // Basic length check
  if (key.length < 15) {
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

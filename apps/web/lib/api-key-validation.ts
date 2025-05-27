/**
 * API Key Validation Utilities
 *
 * This module provides robust validation for various LLM provider API keys.
 * Each provider has specific format requirements that are strictly enforced.
 */

export interface ApiKeyValidationResult {
  isValid: boolean;
  error?: string;
  provider?: string;
}

export interface ApiKeyValidationOptions {
  allowEmpty?: boolean;
  strictMode?: boolean;
}

/**
 * Main validation function that routes to provider-specific validators
 */
export function validateApiKey(
  apiKey: string,
  providerName: string,
  options: ApiKeyValidationOptions = {},
): ApiKeyValidationResult {
  const { allowEmpty = false, strictMode = true } = options;

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

  // Route to provider-specific validation
  switch (providerName.toLowerCase()) {
    case "openai":
      return validateOpenAIKey(trimmedKey, strictMode);
    case "anthropic":
      return validateAnthropicKey(trimmedKey, strictMode);
    case "mistral":
      return validateMistralKey(trimmedKey, strictMode);
    case "openai-compatible":
      return validateOpenAICompatibleKey(trimmedKey, strictMode);
    default:
      return validateGenericKey(trimmedKey, providerName);
  }
}

/**
 * OpenAI API Key Validation
 *
 * OpenAI supports multiple key formats:
 * - Legacy: sk-[48 chars]
 * - Project: sk-proj-[variable length]
 * - User: sk-None-[variable length]
 * - Service Account: sk-svcacct-[variable length]
 */
function validateOpenAIKey(
  key: string,
  strictMode: boolean,
): ApiKeyValidationResult {
  const provider = "openai";

  // Must start with 'sk-'
  if (!key.startsWith("sk-")) {
    return {
      isValid: false,
      error: "OpenAI API key must start with 'sk-'",
      provider,
    };
  }

  // Define valid prefixes and their minimum lengths
  const validFormats = [
    { prefix: "sk-proj-", minLength: 60, name: "Project API Key" },
    { prefix: "sk-None-", minLength: 40, name: "User API Key" },
    { prefix: "sk-svcacct-", minLength: 50, name: "Service Account API Key" },
    { prefix: "sk-", minLength: 48, name: "Legacy API Key" }, // Must be last for proper matching
  ];

  // Find matching format
  const matchingFormat = validFormats.find((format) =>
    key.startsWith(format.prefix),
  );

  if (!matchingFormat) {
    return {
      isValid: false,
      error:
        "Invalid OpenAI API key format. Expected formats: sk-proj-, sk-None-, sk-svcacct-, or legacy sk-",
      provider,
    };
  }

  // Length validation
  if (strictMode && key.length < matchingFormat.minLength) {
    return {
      isValid: false,
      error: `${matchingFormat.name} appears to be too short (minimum ${matchingFormat.minLength} characters)`,
      provider,
    };
  }

  // Basic length check for non-strict mode
  if (key.length < 20) {
    return {
      isValid: false,
      error: "OpenAI API key appears to be too short",
      provider,
    };
  }

  // Character validation - OpenAI keys contain alphanumeric, hyphens, and underscores
  const validCharsRegex = /^sk-[a-zA-Z0-9\-_]+$/;
  if (!validCharsRegex.test(key)) {
    return {
      isValid: false,
      error:
        "OpenAI API key contains invalid characters. Only letters, numbers, hyphens, and underscores are allowed",
      provider,
    };
  }

  // Additional validation for project keys
  if (key.startsWith("sk-proj-") && strictMode) {
    const keyBody = key.substring(8); // Remove 'sk-proj-' prefix
    if (keyBody.length < 50) {
      return {
        isValid: false,
        error: "Project API key body appears to be too short",
        provider,
      };
    }
  }

  return { isValid: true, provider };
}

/**
 * Anthropic (Claude) API Key Validation
 *
 * Anthropic keys follow the format: sk-ant-api03-[base64-like string]
 */
function validateAnthropicKey(
  key: string,
  strictMode: boolean,
): ApiKeyValidationResult {
  const provider = "anthropic";
  const expectedPrefix = "sk-ant-api03-";

  // Must start with specific prefix
  if (!key.startsWith(expectedPrefix)) {
    return {
      isValid: false,
      error: `Anthropic API key must start with '${expectedPrefix}'`,
      provider,
    };
  }

  // Length validation
  const minLength = strictMode ? 95 : 50; // Anthropic keys are typically ~95 characters
  if (key.length < minLength) {
    return {
      isValid: false,
      error: `Anthropic API key appears to be too short (minimum ${minLength} characters)`,
      provider,
    };
  }

  // Extract key body after prefix
  const keyBody = key.substring(expectedPrefix.length);

  // Validate key body format - should be base64-like
  const validCharsRegex = /^[a-zA-Z0-9\-_]+$/;
  if (!validCharsRegex.test(keyBody)) {
    return {
      isValid: false,
      error: "Anthropic API key contains invalid characters after prefix",
      provider,
    };
  }

  // Additional strict validation
  if (strictMode) {
    // Key body should be substantial length
    if (keyBody.length < 80) {
      return {
        isValid: false,
        error: "Anthropic API key body appears to be too short",
        provider,
      };
    }

    // Should not contain common invalid patterns
    if (keyBody.includes("...") || keyBody.includes("***")) {
      return {
        isValid: false,
        error: "API key appears to be redacted or incomplete",
        provider,
      };
    }
  }

  return { isValid: true, provider };
}

/**
 * Mistral AI API Key Validation
 *
 * Mistral keys are typically 32-character alphanumeric strings without prefixes
 */
function validateMistralKey(
  key: string,
  strictMode: boolean,
): ApiKeyValidationResult {
  const provider = "mistral";

  // Length validation - Mistral keys are typically 32 characters
  const expectedLength = 32;
  const minLength = strictMode ? expectedLength : 20;
  const maxLength = strictMode ? expectedLength : 64;

  if (key.length < minLength || key.length > maxLength) {
    if (strictMode && key.length !== expectedLength) {
      return {
        isValid: false,
        error: `Mistral API key must be exactly ${expectedLength} characters`,
        provider,
      };
    } else {
      return {
        isValid: false,
        error: `Mistral API key should be between ${minLength}-${maxLength} characters`,
        provider,
      };
    }
  }

  // Character validation - only alphanumeric characters
  const validCharsRegex = /^[a-zA-Z0-9]+$/;
  if (!validCharsRegex.test(key)) {
    return {
      isValid: false,
      error: "Mistral API key should only contain letters and numbers",
      provider,
    };
  }

  // Additional strict validation
  if (strictMode) {
    // Should have a good mix of letters and numbers
    const letterCount = (key.match(/[a-zA-Z]/g) || []).length;
    const numberCount = (key.match(/[0-9]/g) || []).length;

    if (letterCount === 0 || numberCount === 0) {
      return {
        isValid: false,
        error: "Mistral API key should contain both letters and numbers",
        provider,
      };
    }

    // Should not be all the same character
    if (new Set(key).size < 5) {
      return {
        isValid: false,
        error: "API key appears to be invalid (insufficient character variety)",
        provider,
      };
    }
  }

  return { isValid: true, provider };
}

/**
 * OpenAI-Compatible Provider Key Validation
 *
 * More lenient validation for custom OpenAI-compatible providers
 */
function validateOpenAICompatibleKey(
  key: string,
  strictMode: boolean,
): ApiKeyValidationResult {
  const provider = "openai-compatible";

  // Basic length check
  const minLength = strictMode ? 15 : 10;
  if (key.length < minLength) {
    return {
      isValid: false,
      error: `API key appears to be too short (minimum ${minLength} characters)`,
      provider,
    };
  }

  // Character validation - allow more flexibility for custom providers
  const validCharsRegex = /^[a-zA-Z0-9\-_.]+$/;
  if (!validCharsRegex.test(key)) {
    return {
      isValid: false,
      error:
        "API key contains invalid characters. Only letters, numbers, hyphens, underscores, and dots are allowed",
      provider,
    };
  }

  // Additional strict validation
  if (strictMode) {
    // Should not be obviously fake
    const suspiciousPatterns = [
      /^(test|demo|example|sample)/i,
      /^[a-z]+$/i, // All letters
      /^[0-9]+$/, // All numbers
      /(.)\1{10,}/, // Repeated character
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(key)) {
        return {
          isValid: false,
          error: "API key appears to be a placeholder or test value",
          provider,
        };
      }
    }
  }

  return { isValid: true, provider };
}

/**
 * Generic API Key Validation
 *
 * Fallback validation for unknown providers
 */
function validateGenericKey(
  key: string,
  providerName: string,
): ApiKeyValidationResult {
  const provider = providerName;

  // Basic length check
  if (key.length < 8) {
    return {
      isValid: false,
      error: "API key appears to be too short",
      provider,
    };
  }

  // Basic character validation
  const validCharsRegex = /^[a-zA-Z0-9\-_.]+$/;
  if (!validCharsRegex.test(key)) {
    return {
      isValid: false,
      error: "API key contains invalid characters",
      provider,
    };
  }

  // Check for obviously invalid patterns
  const invalidPatterns = [
    /^(your|api|key|token|secret)/i,
    /\s/, // Contains whitespace
    /<|>/, // Contains angle brackets
  ];

  for (const pattern of invalidPatterns) {
    if (pattern.test(key)) {
      return {
        isValid: false,
        error:
          "API key appears to be a placeholder or contains invalid characters",
        provider,
      };
    }
  }

  return { isValid: true, provider };
}

/**
 * Utility function to get validation requirements for a provider
 */
export function getProviderKeyRequirements(providerName: string): {
  format: string;
  example: string;
  minLength: number;
  description: string;
} {
  switch (providerName.toLowerCase()) {
    case "openai":
      return {
        format:
          "sk-[key] or sk-proj-[key] or sk-None-[key] or sk-svcacct-[key]",
        example: "sk-proj-abc123...",
        minLength: 48,
        description: "OpenAI API keys start with 'sk-' and vary by key type",
      };
    case "anthropic":
      return {
        format: "sk-ant-api03-[key]",
        example: "sk-ant-api03-abc123...",
        minLength: 95,
        description: "Anthropic API keys start with 'sk-ant-api03-'",
      };
    case "mistral":
      return {
        format: "[32 alphanumeric characters]",
        example: "abc123def456...",
        minLength: 32,
        description: "Mistral API keys are 32-character alphanumeric strings",
      };
    case "openai-compatible":
      return {
        format: "[provider-specific format]",
        example: "varies by provider",
        minLength: 10,
        description: "Format varies by OpenAI-compatible provider",
      };
    default:
      return {
        format: "[provider-specific format]",
        example: "varies by provider",
        minLength: 8,
        description: "Format varies by provider",
      };
  }
}

/**
 * Utility function to sanitize API key for logging (shows only first/last few chars)
 */
export function sanitizeApiKeyForLogging(key: string): string {
  if (!key || key.length < 8) {
    return "[invalid]";
  }

  if (key.length <= 12) {
    return key.substring(0, 4) + "***" + key.substring(key.length - 2);
  }

  return key.substring(0, 6) + "***" + key.substring(key.length - 4);
}

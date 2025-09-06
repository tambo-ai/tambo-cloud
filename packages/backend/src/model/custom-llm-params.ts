/**
 * Custom LLM Parameters Types and Utilities
 *
 * This module provides types and utilities for handling custom LLM parameters
 * that can be passed to providers with proper precedence and validation.
 */

/**
 * Custom LLM parameters that can be passed to providers.
 * Kept permissive to allow provider-specific parameters.
 */
export type CustomLlmParams = Record<string, unknown>;

/**
 * Reserved/locked keys that should not be overridden by custom parameters.
 * These keys are critical for routing, observability, and core functionality.
 */
export const RESERVED_LLM_PARAM_KEYS = new Set([
  "model",
  "messages",
  "tools",
  "tool_choice",
  "response_format",
  "stream",
  "user",
  "logit_bias",
  "logprobs",
  "top_logprobs",
  "n",
  "parallel_tool_calls",
  "service_tier",
  "stop",
  "stream_options",
  "metadata",
  "store",
]);

/**
 * Standard LLM parameters that should be passed as normal model options.
 * These are common parameters supported across most providers.
 */
export const STANDARD_LLM_PARAM_KEYS = new Set([
  "temperature",
  "top_p",
  "max_tokens",
  "max_completion_tokens",
  "presence_penalty",
  "frequency_penalty",
  "seed",
]);

/**
 * Parameters for the mergeModelParams function.
 */
export interface MergeModelParamsInput {
  /** Default parameters (lowest precedence) */
  defaults?: CustomLlmParams;
  /** Project-level parameters (medium precedence) */
  projectParams?: CustomLlmParams;
  /** Request-level overrides (highest precedence) */
  requestOverrides?: CustomLlmParams;
}

/**
 * Result of merging model parameters.
 */
export interface MergedModelParams {
  /** Standard parameters that should be passed as normal model options */
  standardParams: Record<string, unknown>;
  /** Provider-specific parameters that should be passed via providerOptions */
  providerOptions: Record<string, unknown>;
  /** All merged parameters (for debugging/logging) */
  allParams: CustomLlmParams;
}

/**
 * Deep merge utility for objects.
 * Later objects override earlier ones, with deep merging for nested objects.
 */
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (value === null || value === undefined) {
      result[key] = value;
    } else if (
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof result[key] === "object" &&
      !Array.isArray(result[key]) &&
      result[key] !== null
    ) {
      result[key] = deepMerge(
        result[key] as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Strips reserved/locked keys from parameters.
 * Logs warnings for any stripped keys.
 */
function stripReservedKeys(
  params: CustomLlmParams,
  logger?: { debug: (message: string) => void },
): CustomLlmParams {
  const result: CustomLlmParams = {};
  const strippedKeys: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (RESERVED_LLM_PARAM_KEYS.has(key)) {
      strippedKeys.push(key);
    } else {
      result[key] = value;
    }
  }

  if (strippedKeys.length > 0 && logger) {
    logger.debug(
      `Stripped reserved LLM parameter keys: ${strippedKeys.join(", ")}`,
    );
  }

  return result;
}

/**
 * Merges model parameters with proper precedence: defaults < projectParams < requestOverrides.
 * Performs deep merging for nested objects and strips reserved keys.
 *
 * @param input - The parameters to merge
 * @param logger - Optional logger for debug messages
 * @returns Merged parameters split into standard params and provider options
 */
export function mergeModelParams(
  input: MergeModelParamsInput,
  logger?: { debug: (message: string) => void },
): MergedModelParams {
  const { defaults = {}, projectParams = {}, requestOverrides = {} } = input;

  // Merge with proper precedence (last-in wins)
  let merged = deepMerge({}, defaults);
  merged = deepMerge(merged, projectParams);
  merged = deepMerge(merged, requestOverrides);

  // Strip reserved keys
  const cleanParams = stripReservedKeys(merged, logger);

  // Split into standard params and provider options
  const standardParams: Record<string, unknown> = {};
  const providerOptions: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(cleanParams)) {
    if (STANDARD_LLM_PARAM_KEYS.has(key)) {
      standardParams[key] = value;
    } else {
      providerOptions[key] = value;
    }
  }

  if (logger && Object.keys(providerOptions).length > 0) {
    logger.debug(
      `Passing provider-specific options: ${Object.keys(providerOptions).join(", ")}`,
    );
  }

  return {
    standardParams,
    providerOptions,
    allParams: cleanParams,
  };
}

/**
 * Validates that custom LLM parameters are a valid JSON object.
 *
 * @param params - The parameters to validate
 * @returns True if valid, false otherwise
 */
export function validateCustomLlmParams(
  params: unknown,
): params is CustomLlmParams {
  return (
    typeof params === "object" && params !== null && !Array.isArray(params)
  );
}

/**
 * Gets the size of a JSON object in bytes (approximate).
 * Used for validating parameter payload size limits.
 *
 * @param params - The parameters to measure
 * @returns Size in bytes
 */
export function getCustomLlmParamsSize(params: CustomLlmParams): number {
  return new TextEncoder().encode(JSON.stringify(params)).length;
}

/**
 * Maximum allowed size for custom LLM parameters (16KB).
 */
export const MAX_CUSTOM_LLM_PARAMS_SIZE = 16 * 1024; // 16KB

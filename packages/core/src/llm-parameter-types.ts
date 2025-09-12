/**
 * Represents any valid JSON value.
 * This recursive type can represent any value that can be serialized to JSON.
 *
 * Used specifically for custom LLM parameters that allow provider-specific configuration.
 * The structure follows: `Record<providerName, Record<parameterName, JSONValue>>`
 */
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JSONValue }
  | JSONValue[];

/**
 * Type for custom LLM parameters organized by provider.
 * Maps provider names (e.g., "openai", "anthropic") to their specific parameter configurations.
 * Each provider's parameters are key-value pairs where values can be any JSON-serializable data.
 *
 * @example
 * ```typescript
 * const params: CustomLlmParameters = {
 *   "openai": {
 *     "temperature": 0.7,
 *     "top_p": 0.9,
 *     "frequency_penalty": 0.1
 *   },
 *   "anthropic": {
 *     "temperature": 0.8,
 *     "top_k": 250
 *   }
 * };
 * ```
 */
export type CustomLlmParameters = Record<string, Record<string, JSONValue>>;

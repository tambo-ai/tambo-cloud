import { PARAMETER_METADATA } from "@tambo-ai-cloud/backend";
import type { CustomLlmParameters, JSONValue } from "@tambo-ai-cloud/core";
import { z } from "zod";

/**
 * Recursive Zod schema for JSONValue type.
 * Validates any JSON-serializable value (string, number, boolean, null, object, array).
 */
export const jsonValueSchema: z.ZodType<JSONValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.record(jsonValueSchema),
    z.array(jsonValueSchema),
  ]),
);

/**
 * Zod schema for CustomLlmParameters.
 * Validates a three-level nested object structure:
 * provider -> model -> parameter -> value
 *
 * @example
 * {
 *   "openai": {
 *     "gpt-4.1": {
 *       "temperature": 0.7,
 *       "top_p": 0.9
 *     },
 *     "gpt-4": {
 *       "temperature": 0.5,
 *       "max_tokens": 1000
 *     }
 *   }
 * }
 */
export const customLlmParametersSchema: z.ZodType<CustomLlmParameters> =
  z.record(
    z.string(),
    z.record(z.string(), z.record(z.string(), jsonValueSchema)),
  );

export type ParameterType = (typeof PARAMETER_SUGGESTIONS)[number]["type"];

export const PARAMETER_SUGGESTIONS = Object.entries(PARAMETER_METADATA).map(
  ([key, { description, uiType }]) => ({
    key,
    description,
    type: uiType,
  }),
);

/**
 * Validates if a value is valid for the given parameter type
 */
export const validateValue = (value: string, type: ParameterType) => {
  if (!value.trim()) return { isValid: true, error: null }; // Empty values are allowed

  switch (type) {
    case "boolean":
      return {
        isValid: value === "true" || value === "false",
        error:
          value !== "true" && value !== "false"
            ? "Must be 'true' or 'false'"
            : null,
      };

    case "number": {
      const num = parseFloat(value);
      return {
        isValid: !isNaN(num) && isFinite(num),
        error: isNaN(num) || !isFinite(num) ? "Must be a valid number" : null,
      };
    }

    case "array":
      try {
        const parsed = JSON.parse(value);
        return {
          isValid: Array.isArray(parsed),
          error: !Array.isArray(parsed)
            ? "Must be a valid JSON array (e.g., [1, 2, 3])"
            : null,
        };
      } catch {
        return {
          isValid: false,
          error: "Must be valid JSON array format",
        };
      }

    case "object":
      try {
        const parsed = JSON.parse(value);
        const isValidObject =
          typeof parsed === "object" &&
          parsed !== null &&
          !Array.isArray(parsed);
        return {
          isValid: isValidObject,
          error: !isValidObject
            ? 'Must be a valid JSON object (e.g., {"key": "value"})'
            : null,
        };
      } catch {
        return {
          isValid: false,
          error: "Must be valid JSON object format",
        };
      }

    case "string":
    default:
      return { isValid: true, error: null };
  }
};

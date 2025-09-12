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
 * Validates a two-level nested object structure:
 * provider -> parameter -> value
 *
 * @example
 * {
 *   "openai": {
 *     "temperature": 0.7,
 *     "top_p": 0.9
 *   }
 * }
 */
export const customLlmParametersSchema: z.ZodType<CustomLlmParameters> =
  z.record(z.string(), z.record(z.string(), jsonValueSchema));

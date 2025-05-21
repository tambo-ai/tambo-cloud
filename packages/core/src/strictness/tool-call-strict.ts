import { ToolCallRequest } from "@tambo-ai-cloud/core";
import {
  JSONSchema7,
  JSONSchema7Definition,
  JSONSchema7Object,
} from "json-schema";
import OpenAI from "openai";

/** Take a tool call request that was built from a strict JSON Schema, and try
 * to re-apply the original schema to the parameters.
 */
export function unstrictifyToolCallRequest(
  originalTool: OpenAI.Chat.Completions.ChatCompletionTool | undefined,
  toolCallRequest: ToolCallRequest | undefined,
): ToolCallRequest | undefined {
  if (!originalTool || !toolCallRequest) {
    return toolCallRequest;
  }

  if (!originalTool.function.parameters) {
    // no original pareters, so we can just return the tool call request
    return toolCallRequest;
  }

  // unpack the actual tool call request
  const originalToolParams = originalTool.function
    .parameters as JSONSchema7Object;
  const params = Object.fromEntries(
    toolCallRequest.parameters.map(({ parameterName, parameterValue }) => {
      return [parameterName, parameterValue] as const;
    }),
  );

  // unstrictify the parameters
  const newParamsRecord = unstrictifyToolCallParams(
    originalToolParams as JSONSchema7,
    params,
  );

  // repack the parameters into the tool call request
  const newParams = Object.entries(newParamsRecord).map(
    ([parameterName, parameterValue]) => {
      return { parameterName, parameterValue };
    },
  );
  return {
    ...toolCallRequest,
    parameters: newParams,
  };
}

/** Unstrictify the parameters of a tool call request.
 *
 * This effectively reverses the process of strictifyToolCallParams, for a
 * tool call request that was built from a strict JSON Schema, by returning a
 * updated tool call request with the parameter values unstrictified.
 */
function unstrictifyToolCallParams(
  originalToolParamSchema: JSONSchema7,
  toolCallRequestParams: Record<string, unknown>,
): Record<string, unknown> {
  if (originalToolParamSchema.type !== "object") {
    throw new Error(
      `tool call parameter schema must be an object, instead got ${originalToolParamSchema.type} / ${typeof originalToolParamSchema}`,
    );
  }
  const newParams = Object.entries(toolCallRequestParams)
    .map(([parameterName, parameterValue]) => {
      const isRequired =
        originalToolParamSchema.required?.includes(parameterName);
      // find the param in the original tool schema
      const originalParamSchema =
        parameterName in (originalToolParamSchema.properties ?? {})
          ? originalToolParamSchema.properties?.[parameterName]
          : undefined;

      // This should never happen, because the strict schema was derived from
      // the original schema, so the parameter should always be present.
      if (!originalParamSchema) {
        throw new Error(
          `Tool call request parameter ${parameterName} not found in original tool`,
        );
      }

      if (
        parameterValue === null &&
        !canBeNull(originalParamSchema) &&
        !isRequired
      ) {
        // This is the meat of this function. In the strict schema, this is
        // "required and can be null", but in the original schema, the param was
        // not required.
        return undefined;
      }

      // recurse into the parameter value, passing along the matching original schema
      if (
        typeof originalParamSchema === "object" &&
        originalParamSchema.type === "object"
      ) {
        // parameter value better itself be an object
        const newParamValue = unstrictifyToolCallParams(
          originalParamSchema,
          parameterValue as Record<string, unknown>,
        );
        return [parameterName, newParamValue] as const;
      }

      return [parameterName, parameterValue] as const;
    })
    .filter((param) => param !== undefined);
  return Object.fromEntries(newParams);
}

// Export for testing
export function canBeNull(originalSchema: JSONSchema7Definition): boolean {
  if (typeof originalSchema !== "object") {
    return false;
  }

  if (originalSchema.type === "null") {
    return true;
  }

  if (originalSchema.anyOf?.some((anyOf) => canBeNull(anyOf))) {
    return true;
  }
  return false;
}

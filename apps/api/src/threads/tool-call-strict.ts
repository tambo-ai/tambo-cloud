import { ToolCallRequest } from "@tambo-ai-cloud/core";
import { JSONSchema7, JSONSchema7Object } from "json-schema";
import OpenAI from "openai";

export function unstrictifyToolCallRequest(
  originalTool: OpenAI.Chat.Completions.ChatCompletionTool | undefined,
  strictTool: OpenAI.Chat.Completions.ChatCompletionTool | undefined,
  toolCallRequest: ToolCallRequest | undefined,
): ToolCallRequest | undefined {
  if (!strictTool || !originalTool || !toolCallRequest) {
    return toolCallRequest;
  }

  const originalToolParams = (originalTool.function.parameters ??
    {}) as JSONSchema7Object;
  const strictToolParams = (strictTool.function.parameters ??
    {}) as JSONSchema7Object;
  const newParams = unstrictifyToolCallParams(
    originalToolParams.properties as Record<string, JSONSchema7>,
    strictToolParams.properties as Record<string, JSONSchema7>,
    toolCallRequest.parameters,
  ).filter((param) => param !== undefined);
  return {
    ...toolCallRequest,
    parameters: newParams,
  };
}
function unstrictifyToolCallParams(
  originalToolParams: Record<string, JSONSchema7>,
  strictToolParams: Record<string, JSONSchema7>,
  toolCallRequestParams: { parameterName: string; parameterValue: any }[],
) {
  return toolCallRequestParams.map((param) => {
    const { parameterName, parameterValue } = param;
    // find the param in the original tool
    const originalParamSchema =
      parameterName in originalToolParams
        ? originalToolParams[parameterName]
        : undefined;

    if (!originalParamSchema) {
      console.warn("original tool params:", originalToolParams);
      throw new Error(
        `Tool call request parameter ${parameterName} not found in original tool`,
      );
    }

    const strictParamSchema = strictToolParams[param.parameterName] as
      | JSONSchema7
      | undefined;
    if (!strictParamSchema) {
      throw new Error(
        `Tool call request parameter ${parameterName} not found in strict tool`,
      );
    }

    // if strict-ness added 'anyOf' to the original param, then we can effectively leave it out of the request
    if (
      isOptional(strictParamSchema, originalParamSchema) &&
      parameterValue === null
    ) {
      return undefined;
    }

    // TODO: now recurse into parameterValue, dealing with required: [...]
    // in the original param to determine optional-ness
    return { parameterName, parameterValue } as const;
  });
}
function isOptional(strictParam: JSONSchema7, originalParam: JSONSchema7) {
  if (!strictParam.anyOf) {
    return false;
  }
  if (
    !strictParam.anyOf.find(
      (anyOption) => typeof anyOption === "object" && anyOption.type === "null",
    )
  ) {
    return false;
  }
  if (originalParam.anyOf) {
    // TODO: maybe deal with anyOf nesting
    return false;
  }

  // at this point we know that we definitely transformed a non-optional parameter into an optional one
  return true;
}

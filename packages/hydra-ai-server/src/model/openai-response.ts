import { ChatCompletionChoice } from "@libretto/token.js";
import { ToolCallRequest } from "@tambo-ai-cloud/core";

export type OpenAIResponse = Omit<ChatCompletionChoice, "finish_reason">; // OpenAI.Chat.Completions.ChatCompletion.Choice;

export function getOpenAIResponseMessage(response: OpenAIResponse) {
  return response.message?.content ?? "";
}

export function getOpenAIResponseToolCallId(response: OpenAIResponse) {
  return response.message.tool_calls?.[0]?.id;
}

export function getOpenAIResponseToolCallRequest(
  response: OpenAIResponse,
): ToolCallRequest | undefined {
  const toolCallRequest = response.message.tool_calls?.[0];
  if (!toolCallRequest) {
    return undefined;
  }

  const args = JSON.parse(toolCallRequest.function.arguments);
  const parameters = Object.entries(args).map(([key, value]) => ({
    parameterName: key,
    parameterValue: value,
  }));

  return {
    toolName: toolCallRequest.function.name,
    parameters,
  };
}

import {
  ChatCompletionContentPart,
  ThreadMessage,
  ToolCallRequest,
} from "@tambo-ai-cloud/core";
import OpenAI from "openai";

/**
 * Converts a tool call request to the OpenAI function_call format
 * @param toolCallRequest The tool call request from the component
 * @returns The formatted function call object or undefined if no request
 */
export function formatFunctionCall(
  toolCallRequest: ToolCallRequest,
  toolCallId: string,
): OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
export function formatFunctionCall(
  toolCallRequest: ToolCallRequest | undefined,
  toolCallId: string | undefined,
): OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] | undefined;
export function formatFunctionCall(
  toolCallRequest: ToolCallRequest | undefined,
  toolCallId: string | undefined,
): OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] | undefined {
  if (!toolCallRequest) {
    return undefined;
  }

  return [
    {
      id: toolCallId ?? "",
      type: "function",
      function: {
        name: toolCallRequest.toolName,
        arguments: JSON.stringify(
          Object.fromEntries(
            toolCallRequest.parameters.map((p) => [
              p.parameterName,
              p.parameterValue,
            ]),
          ),
        ),
      },
    },
  ];
}

export function generateAdditionalContext(message: ThreadMessage) {
  let nextContentContext = "";

  if (message.component && !message.actionType) {
    nextContentContext += `\n<Component>${JSON.stringify(message.component)}</Component>`;
  }
  if (
    Object.keys(message.componentState ?? {}).length > 0 &&
    !message.actionType
  ) {
    nextContentContext += `\n<ComponentState>${JSON.stringify(message.componentState)}</ComponentState>`;
  }

  if (message.additionalContext) {
    nextContentContext += `<System> The following is additional context provided by the system that you can use when responding to the user: ${message.additionalContext} </System>`;
  }

  if (nextContentContext) {
    const additionalContextMessage: ChatCompletionContentPart = {
      type: "text",
      text: nextContentContext,
    };
    return additionalContextMessage;
  }
}

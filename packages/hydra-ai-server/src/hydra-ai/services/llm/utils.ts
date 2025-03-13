import { ChatCompletionMessageParam } from "@libretto/token.js";
import {
  ChatCompletionContentPart,
  ChatCompletionContentPartText,
  MessageRole,
  OpenAIRole,
  ThreadMessage,
} from "@tambo-ai-cloud/core";

export function chatHistoryToParams(
  messageHistory: ThreadMessage[],
): ChatCompletionMessageParam[] {
  console.log("messageHistory", messageHistory);
  return messageHistory.map((message): ChatCompletionMessageParam => {
    let nextContentContext = "";

    if (message.component && !message.actionType) {
      nextContentContext += `\n<Component>${JSON.stringify(message.component)}</Component>`;
    }
    if (message.componentState && !message.actionType) {
      nextContentContext += `\n<ComponentState>${JSON.stringify(message.componentState)}</ComponentState>`;
    }

    if (message.additionalContext) {
      nextContentContext += `<System> The following is additional context provided by the system that you can use when responding to the user: ${message.additionalContext} </System>`;
    }

    const additionalContextMessage: ChatCompletionContentPartText = {
      type: "text",
      text: nextContentContext,
    };
    const role = getOpenAIRole(message, message.tool_call_id);
    return {
      role,
      content: [
        ...message.content,
        additionalContextMessage,
      ] as ChatCompletionContentPart[],
    } as ChatCompletionMessageParam;
  });
}

/**
 * Make sure to handle some edge cases:
 * - Tool messages without a tool call id are user messages
 * - Hydra messages are user messages
 */
function getOpenAIRole(
  message: ThreadMessage,
  toolCallId: string | undefined,
): OpenAIRole {
  if (message.role === MessageRole.Tool) {
    if (toolCallId) {
      return MessageRole.Tool;
    }
    return MessageRole.User;
  }
  if (message.role === MessageRole.Hydra) {
    return MessageRole.User;
  }
  return message.role;
}

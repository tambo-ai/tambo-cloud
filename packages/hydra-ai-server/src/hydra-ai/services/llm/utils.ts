import { ChatCompletionMessageParam } from "@libretto/token.js";
import {
  ChatCompletionContentPart,
  ChatCompletionContentPartText,
  MessageRole,
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
    return {
      role: message.role === MessageRole.Hydra ? "user" : message.role,
      content: [
        ...message.content,
        additionalContextMessage,
      ] as ChatCompletionContentPart[],
    };
  });
}

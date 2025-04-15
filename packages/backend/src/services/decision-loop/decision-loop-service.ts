import { objectTemplate } from "@libretto/openai";
import {
  ChatCompletionMessageParam,
  ThreadMessage,
} from "@tambo-ai-cloud/core";
import { AvailableComponent } from "../../model/component-metadata";
import { generateDecisionLoopPrompt } from "../../prompt/decision-loop-prompts";
import { threadMessagesToChatHistory } from "../../util/threadMessagesToChatHistory";
import { LLMClient } from "../llm/llm-client";

export async function runDecisionLoop(
  llmClient: LLMClient,
  messageHistory: ThreadMessage[],
  availableComponents: AvailableComponent[],
  stream: boolean,
) {
  console.log("availableComponents", availableComponents);
  console.log(stream);
  const { template: systemPrompt } = generateDecisionLoopPrompt();
  const chatHistory = threadMessagesToChatHistory(messageHistory);
  const promptMessages = objectTemplate<ChatCompletionMessageParam[]>([
    { role: "system", content: systemPrompt },
    { role: "chat_history" as "user", content: "{chat_history}" },
  ]);
  const response = await llmClient.complete({
    messages: promptMessages,
    promptTemplateName: "decision-loop",
    promptTemplateParams: {
      chat_history: chatHistory,
    },
  });
  console.log(response);
  return undefined;
}

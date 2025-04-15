import { objectTemplate } from "@libretto/openai";
import {
  ChatCompletionMessageParam,
  ThreadMessage,
} from "@tambo-ai-cloud/core";
import { AvailableComponent } from "../../model/component-metadata";
import { generateDecisionLoopPrompt } from "../../prompt/decision-loop-prompts";
import { threadMessagesToChatHistory } from "../../util/threadMessagesToChatHistory";
import { LLMClient } from "../llm/llm-client";
import {
  convertComponentsToUITools,
  convertMetadataToTools,
} from "../tool/tool-service";

export async function runDecisionLoop(
  llmClient: LLMClient,
  messageHistory: ThreadMessage[],
  availableComponents: AvailableComponent[],
  stream: boolean,
) {
  const componentTools = convertComponentsToUITools(availableComponents);
  const standardTools = convertMetadataToTools(
    availableComponents.flatMap((component) => component.contextTools),
  );
  const tools = [...componentTools, ...standardTools];

  const { template: systemPrompt } = generateDecisionLoopPrompt();
  const chatHistory = threadMessagesToChatHistory(messageHistory);
  const promptMessages = objectTemplate<ChatCompletionMessageParam[]>([
    { role: "system", content: systemPrompt },
    { role: "chat_history" as "user", content: "{chat_history}" },
  ]);
  const response = await llmClient.complete({
    messages: promptMessages,
    tools,
    promptTemplateName: "decision-loop",
    promptTemplateParams: {
      chat_history: chatHistory,
    },
  });

  console.log(stream);
  console.log(response);

  const toolCall = response.message?.tool_calls?.[0];
  if (toolCall) {
    const toolName = toolCall.function.name;
    const toolArgs = JSON.parse(toolCall.function.arguments);
    console.log(`Tool called: ${toolName}`);
    console.log(`Tool arguments: ${JSON.stringify(toolArgs)}`);
  }

  return undefined;
}

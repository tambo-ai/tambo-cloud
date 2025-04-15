import { objectTemplate } from "@libretto/openai";
import {
  ChatCompletionMessageParam,
  ThreadMessage,
} from "@tambo-ai-cloud/core";
import {
  AvailableComponent,
  ComponentPropsMetadata,
} from "../../model/component-metadata";
import { generateDecisionLoopPrompt } from "../../prompt/decision-loop-prompts";
import { threadMessagesToChatHistory } from "../../util/threadMessagesToChatHistory";
import { LLMClient } from "../llm/llm-client";

function transformComponentsToTools(components: AvailableComponent[]) {
  return components.map((component) => ({
    type: "function" as const,
    function: {
      name: `show_${component.name.toLowerCase().replace(/-/g, "_")}`,
      description: `Show the ${component.name} UI component the user. Here is a description of the component: ${component.description}`,
      parameters: {
        type: "object",
        properties: Object.entries(component.props).reduce<
          Record<string, { type: string; description: string }>
        >(
          (acc, [key, value]) => ({
            ...acc,
            [key]: {
              type: (value as ComponentPropsMetadata).type,
              description:
                (value as ComponentPropsMetadata).description ||
                `Parameter ${key} for ${component.name}`,
            },
          }),
          {},
        ),
        required: Object.keys(component.props).filter(
          (key) => (component.props[key] as ComponentPropsMetadata).isRequired,
        ),
      },
    },
  }));
}

export async function runDecisionLoop(
  llmClient: LLMClient,
  messageHistory: ThreadMessage[],
  availableComponents: AvailableComponent[],
  stream: boolean,
) {
  const componentTools = transformComponentsToTools(availableComponents);
  const { template: systemPrompt } = generateDecisionLoopPrompt();
  const chatHistory = threadMessagesToChatHistory(messageHistory);
  const promptMessages = objectTemplate<ChatCompletionMessageParam[]>([
    { role: "system", content: systemPrompt },
    { role: "chat_history" as "user", content: "{chat_history}" },
  ]);
  const response = await llmClient.complete({
    messages: promptMessages,
    tools: componentTools,
    promptTemplateName: "decision-loop",
    promptTemplateParams: {
      chat_history: chatHistory,
    },
  });

  console.log(stream);
  console.log(response);

  return undefined;
}

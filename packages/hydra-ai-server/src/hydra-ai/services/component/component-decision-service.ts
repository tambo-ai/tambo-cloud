import { ComponentDecision } from "@use-hydra-ai/core";
import { InputContext } from "../../model/input-context";
import { OpenAIResponse } from "../../model/openai-response";
import { LLMClient } from "../llm/llm-client";
import { chatHistoryToParams } from "../llm/utils";
import {
  generateAvailableComponentsPrompt,
  generateDecisionPrompt,
  generateNoComponentPrompt,
} from "../prompt/prompt-service";
import { hydrateComponent } from "./component-hydration-service";

// Public function
export async function decideComponent(
  llmClient: LLMClient,
  context: InputContext,
  threadId: string,
  stream?: boolean,
): Promise<ComponentDecision | AsyncIterableIterator<ComponentDecision>> {
  const decisionResponse = await llmClient.complete({
    messages: [
      { role: "system", content: generateDecisionPrompt() },
      {
        role: "user",
        content: `<availableComponents>
      ${generateAvailableComponentsPrompt(context.availableComponents)}
      </availableComponents>`,
      },
      ...chatHistoryToParams(context.messageHistory),
    ],
  });

  const shouldGenerate = decisionResponse.message.match(
    /<decision>(.*?)<\/decision>/,
  )?.[1];

  const componentName = decisionResponse.message.match(
    /<component>(.*?)<\/component>/,
  )?.[1];

  if (shouldGenerate === "false") {
    return handleNoComponentCase(
      llmClient,
      decisionResponse,
      context,
      threadId,
      stream,
    );
  } else if (shouldGenerate === "true" && componentName) {
    const component = context.availableComponents[componentName];
    if (!component) {
      throw new Error(`Component ${componentName} not found`);
    }
    return hydrateComponent(
      llmClient,
      context.messageHistory,
      component,
      undefined,
      context.availableComponents,
      threadId,
    );
  }

  throw new Error("Invalid decision");
}

// Private function
async function handleNoComponentCase(
  llmClient: LLMClient,
  decisionResponse: any,
  context: InputContext,
  threadId: string,
  stream?: boolean,
): Promise<ComponentDecision | AsyncIterableIterator<ComponentDecision>> {
  const reasoning = decisionResponse.message.match(
    /<reasoning>(.*?)<\/reasoning>/,
  )?.[1];

  if (stream) {
    const responseStream = await llmClient.complete({
      messages: [
        {
          role: "system",
          content: generateNoComponentPrompt(
            reasoning,
            context.availableComponents,
          ),
        },
        ...chatHistoryToParams(context.messageHistory),
      ],
      stream: true,
    });

    return handleNoComponentStream(responseStream, threadId);
  }

  const noComponentResponse = await llmClient.complete({
    messages: [
      {
        role: "system",
        content: generateNoComponentPrompt(
          reasoning,
          context.availableComponents,
        ),
      },
      ...chatHistoryToParams(context.messageHistory),
    ],
  });

  return {
    componentName: null,
    props: null,
    message: noComponentResponse.message,
    suggestedActions: [],
    threadId,
  };
}

async function* handleNoComponentStream(
  responseStream: AsyncIterableIterator<OpenAIResponse>,
  threadId: string,
): AsyncIterableIterator<ComponentDecision> {
  const accumulatedDecision: ComponentDecision = {
    componentName: null,
    props: null,
    message: "",
    suggestedActions: [],
    threadId,
  };

  for await (const chunk of responseStream) {
    accumulatedDecision.message += chunk.message;
    yield accumulatedDecision;
  }
}

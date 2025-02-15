import { ComponentDecision } from "@use-hydra-ai/core";
import { ChatMessage } from "../../model/chat-message";
import {
  AvailableComponent,
  AvailableComponents,
} from "../../model/component-metadata";
import { OpenAIResponse } from "../../model/openai-response";
import { LLMClient } from "../llm/llm-client";
import { chatHistoryToParams } from "../llm/utils";
import { parseAndValidate } from "../parser/response-parser-service";
import { generateComponentHydrationPrompt } from "../prompt/prompt-service";
import {
  schema as promptSchema,
  streamDecisionSchema,
} from "../prompt/schemas";
import { convertMetadataToTools } from "../tool/tool-service";

// Public function
export async function hydrateComponent(
  llmClient: LLMClient,
  messageHistory: ChatMessage[],
  chosenComponent: AvailableComponent,
  toolResponse: any | undefined,
  availableComponents: AvailableComponents | undefined,
  threadId: string,
  stream?: boolean,
): Promise<ComponentDecision | AsyncIterableIterator<ComponentDecision>> {
  //only define tools if we don't have a tool response
  const tools = toolResponse
    ? undefined
    : convertMetadataToTools(chosenComponent.contextTools);

  if (stream) {
    const responseStream = await llmClient.complete({
      messages: [
        {
          role: "system",
          content: generateComponentHydrationPrompt(
            toolResponse,
            availableComponents || { [chosenComponent.name]: chosenComponent },
          ),
        },
        ...chatHistoryToParams(messageHistory),
        {
          role: "user",
          content: `<componentName>${chosenComponent.name}</componentName>
        <componentDescription>${JSON.stringify(chosenComponent.description)}</componentDescription>
        <expectedProps>${JSON.stringify(chosenComponent.props)}</expectedProps>
        ${toolResponse ? `<toolResponse>${JSON.stringify(toolResponse)}</toolResponse>` : ""}`,
        },
      ],
      tools,
      jsonMode: true,
      stream: true,
    });

    return handleComponentHydrationStream(responseStream, threadId);
  }

  const generateComponentResponse = await llmClient.complete({
    messages: [
      {
        role: "system",
        content: generateComponentHydrationPrompt(
          toolResponse,
          availableComponents || { [chosenComponent.name]: chosenComponent },
        ),
      },
      ...chatHistoryToParams(messageHistory),
      {
        role: "user",
        content: `<componentName>${chosenComponent.name}</componentName>
        <componentDescription>${JSON.stringify(chosenComponent.description)}</componentDescription>
        <expectedProps>${JSON.stringify(chosenComponent.props)}</expectedProps>
        ${toolResponse ? `<toolResponse>${JSON.stringify(toolResponse)}</toolResponse>` : ""}`,
      },
    ],
    tools,
    jsonMode: true,
  });

  const componentDecision: ComponentDecision = {
    message: "Fetching additional data",
    componentName: chosenComponent.name,
    props: null,
    suggestedActions: [],
    toolCallRequest: generateComponentResponse.toolCallRequest,
    threadId,
  };

  if (!componentDecision.toolCallRequest) {
    const parsedData = await parseAndValidate(
      promptSchema,
      generateComponentResponse.message,
    );

    componentDecision.componentName = parsedData.componentName;
    componentDecision.props = parsedData.props;
    componentDecision.message = parsedData.message;
    componentDecision.suggestedActions = parsedData.suggestedActions || [];
  }

  return componentDecision;
}

async function* handleComponentHydrationStream(
  responseStream: AsyncIterableIterator<OpenAIResponse>,
  threadId: string,
): AsyncIterableIterator<ComponentDecision> {
  const accumulatedDecision: ComponentDecision = {
    componentName: null,
    props: null,
    message: "",
    suggestedActions: [],
    toolCallRequest: undefined,
    threadId,
  };

  for await (const chunk of responseStream) {
    try {
      // //TODO: handle 'fixing JSON' of decision object here. Currently fails until the full response is received.
      const parsedData = await parseAndValidate(
        streamDecisionSchema,
        chunk.message,
      );
      accumulatedDecision.componentName = parsedData.componentName || null;
      accumulatedDecision.props = parsedData.props;
      accumulatedDecision.message = parsedData.message || "";
      accumulatedDecision.suggestedActions = parsedData.suggestedActions || [];
      accumulatedDecision.toolCallRequest = chunk.toolCallRequest;
      yield accumulatedDecision;
    } catch (e) {
      console.error("Error parsing chunk", e);
    }
  }
}

import { objectTemplate } from "@libretto/openai";
import { ChatCompletionMessageParam } from "@libretto/token.js";
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
import {
  getAvailableComponentsPromptTemplate,
  getComponentHydrationPromptTemplate,
} from "../prompt/prompt-service";
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

  const chosenComponentDescription = JSON.stringify(
    chosenComponent.description,
  );
  const chosenComponentProps = JSON.stringify(chosenComponent.props);
  const toolResponseString = toolResponse ? JSON.stringify(toolResponse) : "";
  const { template, args: componentHydrationArgs } =
    getComponentHydrationPromptTemplate(
      toolResponse,
      availableComponents || { [chosenComponent.name]: chosenComponent },
    );
  const chatHistory = chatHistoryToParams(messageHistory);
  const {
    template: availableComponentsTemplate,
    args: availableComponentsArgs,
  } = getAvailableComponentsPromptTemplate(
    availableComponents || { [chosenComponent.name]: chosenComponent },
  );

  const completeOptions = {
    messages: objectTemplate([
      { role: "system", content: template },
      { role: "chat_history", content: "{chatHistory}" },
      {
        role: "user",
        content: `<componentName>{chosenComponentName}</componentName>
        <componentDescription>{chosenComponentDescription}</componentDescription>
        <expectedProps>{chosenComponentProps}</expectedProps>
        ${toolResponseString ? `<toolResponse>{toolResponseString}</toolResponse>` : ""}`,
      },
    ] as ChatCompletionMessageParam[]),
    promptTemplateName: toolResponseString
      ? "component-hydration-with-tool-response"
      : "component-hydration",
    promptTemplateParams: {
      chatHistory,
      chosenComponentName: chosenComponent.name,
      chosenComponentDescription,
      chosenComponentProps,
      toolResponseString,
      ...componentHydrationArgs,
      ...availableComponentsArgs,
    },
    tools,
    jsonMode: true,
  };

  if (stream) {
    const responseStream = await llmClient.complete({
      ...completeOptions,
      stream: true,
    });

    return handleComponentHydrationStream(responseStream, threadId);
  }

  const generateComponentResponse = await llmClient.complete(completeOptions);

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

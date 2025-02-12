import { ComponentDecision, SuggestedAction } from "@use-hydra-ai/core";
import { ChatMessage } from "../../model/chat-message";
import {
  AvailableComponent,
  AvailableComponents,
} from "../../model/component-metadata";
import { LLMClient } from "../llm/llm-client";
import { chatHistoryToParams } from "../llm/utils";
import { parseAndValidate } from "../parser/response-parser-service";
import { generateComponentHydrationPrompt } from "../prompt/prompt-service";
import { schema, schemaWithoutSuggestions } from "../prompt/schemas";
import { convertMetadataToTools } from "../tool/tool-service";

// Public function
export async function hydrateComponent(
  llmClient: LLMClient,
  messageHistory: ChatMessage[],
  chosenComponent: AvailableComponent,
  toolResponse: any | undefined,
  availableComponents: AvailableComponents | undefined,
  threadId: string,
  generateSuggestedActions: boolean = true,
): Promise<ComponentDecision> {
  //only define tools if we don't have a tool response
  const tools = toolResponse
    ? undefined
    : convertMetadataToTools(chosenComponent.contextTools);

  const generateComponentResponse = await llmClient.complete(
    [
      {
        role: "system",
        content: generateComponentHydrationPrompt(
          toolResponse,
          availableComponents || { [chosenComponent.name]: chosenComponent },
          generateSuggestedActions,
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
    true,
  );

  const initialSuggestedActions = generateSuggestedActions ? [] : undefined;
  const componentDecision: ComponentDecision = {
    message: "Fetching additional data",
    componentName: chosenComponent.name,
    props: null,
    suggestedActions: initialSuggestedActions as SuggestedAction[] | undefined,
    toolCallRequest: generateComponentResponse.toolCallRequest,
    threadId,
    generateSuggestedActions, // TODO: Remove this when we remove the deprecated SuggestedAction interface
  };

  if (!componentDecision.toolCallRequest) {
    // TODO: Remove this when we remove the deprecated SuggestedAction interface
    if (generateSuggestedActions) {
      const parsedData = await parseAndValidate(
        schema,
        generateComponentResponse.message,
      );
      componentDecision.suggestedActions =
        parsedData.suggestedActions || ([] as SuggestedAction[]);
      componentDecision.componentName = parsedData.componentName;
      componentDecision.props = parsedData.props;
      componentDecision.message = parsedData.message;
    } else {
      const parsedData = await parseAndValidate(
        schemaWithoutSuggestions,
        generateComponentResponse.message,
      );
      componentDecision.componentName = parsedData.componentName;
      componentDecision.props = parsedData.props;
      componentDecision.message = parsedData.message;
    }
  }

  return componentDecision;
}

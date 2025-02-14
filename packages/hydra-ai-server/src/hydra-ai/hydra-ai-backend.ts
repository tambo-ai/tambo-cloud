import { ComponentDecision } from "@use-hydra-ai/core";
import AIService from "./ai-service";
import { ChatMessage } from "./model/chat-message";
import {
  AvailableComponent,
  AvailableComponents,
  ComponentContextToolMetadata,
} from "./model/component-metadata";
import { ComponentPropsMetadata } from "./model/component-props-metadata";
import { InputContext } from "./model/input-context";
import { Provider } from "./model/providers";

export default class HydraBackend {
  private aiService: AIService;

  constructor(
    openAIKey: string,
    openAIModel = "gpt-4o",
    provider: Provider = "openai",
  ) {
    this.aiService = new AIService(openAIKey, openAIModel, provider);
  }

  public async registerComponent(
    name: string,
    description: string,
    propsDefinition?: ComponentPropsMetadata,
    contextToolDefinitions?: ComponentContextToolMetadata[],
  ): Promise<boolean> {
    // Component registration logic would go here
    // For now, always return true as if registration was successful
    return true;
  }

  public async generateComponent(
    messageHistory: ChatMessage[],
    availableComponents: AvailableComponents,
    threadId: string,
    stream: true,
  ): Promise<AsyncIterableIterator<ComponentDecision>>;
  public async generateComponent(
    messageHistory: ChatMessage[],
    availableComponents: AvailableComponents,
    threadId: string,
    stream?: false | undefined,
  ): Promise<ComponentDecision>;
  public async generateComponent(
    messageHistory: ChatMessage[],
    availableComponents: AvailableComponents,
    threadId: string,
    stream?: boolean,
  ): Promise<ComponentDecision | AsyncIterableIterator<ComponentDecision>> {
    const context: InputContext = {
      messageHistory,
      availableComponents,
      threadId: threadId,
    };

    return this.aiService.chooseComponent(context, threadId, stream);
  }

  public async hydrateComponentWithData(
    messageHistory: ChatMessage[],
    component: AvailableComponent,
    toolResponse: any,
    threadId: string,
  ): Promise<ComponentDecision> {
    return this.aiService.hydrateComponent(
      messageHistory,
      component,
      toolResponse,
      threadId,
    );
  }
}

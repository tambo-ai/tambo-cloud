import { ComponentDecision } from "@use-hydra-ai/core";
import { InputContext } from "./model/input-context";
import { Provider } from "./model/providers";
import { decideComponent } from "./services/component/component-decision-service";
import { hydrateComponent } from "./services/component/component-hydration-service";
import { TokenJSClient } from "./services/llm/token-js-client";

export default class AIService {
  private llmClient: TokenJSClient;

  constructor(
    openAiKey: string,
    model: string = "gpt-4o",
    provider: Provider = "openai",
  ) {
    this.llmClient = new TokenJSClient(openAiKey, model, provider);
  }

  async chooseComponent(
    context: InputContext,
    threadId: string,
    stream?: boolean,
  ): Promise<ComponentDecision | AsyncIterableIterator<ComponentDecision>> {
    return decideComponent(this.llmClient, context, threadId, stream);
  }

  async hydrateComponent(
    messageHistory: any[],
    component: any,
    toolResponse: any,
    threadId: string,
  ): Promise<ComponentDecision> {
    return hydrateComponent(
      this.llmClient,
      messageHistory,
      component,
      toolResponse,
      undefined,
      threadId,
    );
  }
}

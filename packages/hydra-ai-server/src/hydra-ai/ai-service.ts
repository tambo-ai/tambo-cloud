import { ComponentDecision } from "@use-hydra-ai/core";
import { InputContext } from "./model/input-context";
import { Provider } from "./model/providers";
import { ComponentDecisionService } from "./services/component/component-decision-service";
import { hydrateComponent } from "./services/component/component-hydration-service";
import { TokenJSClient } from "./services/llm/token-js-client";

export default class AIService {
  private llmClient: TokenJSClient;
  private decisionService: ComponentDecisionService;

  constructor(
    openAiKey: string,
    model: string = "gpt-4o",
    provider: Provider = "openai",
  ) {
    this.llmClient = new TokenJSClient(openAiKey, model, provider);
    this.decisionService = new ComponentDecisionService(this.llmClient);
  }

  async chooseComponent(
    context: InputContext,
    threadId: string,
  ): Promise<ComponentDecision> {
    return this.decisionService.decideComponent(context, threadId);
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

import { AbstractAgent, Message as AGUIMessage } from "@ag-ui/client";
import { MastraAgent } from "@ag-ui/mastra";
import { MastraClient } from "@mastra/client-js";
import {
  AgentProviderType,
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
} from "@tambo-ai-cloud/core";
import OpenAI from "openai";
import {
  AIProviderClient,
  CompleteParams,
  LLMResponse,
  StreamingCompleteParams,
} from "./ai-provider-client";

export class AgentClient implements AIProviderClient {
  private aguiAgent: AbstractAgent | undefined;
  chainId: string;

  private constructor(chainId: string) {
    this.chainId = chainId;
  }
  public static async create({
    agentProviderType,
    agentUrl,
    agentName,
    chainId,
  }: {
    agentProviderType: AgentProviderType;
    agentUrl: string;
    agentName: string;
    chainId: string;
  }) {
    const agentClient = new AgentClient(chainId);
    switch (agentProviderType) {
      case AgentProviderType.AGUI:
        break;
      case AgentProviderType.MASTRA: {
        const client = new MastraClient({ baseUrl: agentUrl });

        const agents = await MastraAgent.getRemoteAgents({
          mastraClient: client,
        });
        agentClient.aguiAgent = agents[agentName];
      }
    }
  }

  async complete(
    params: StreamingCompleteParams,
  ): Promise<AsyncIterableIterator<LLMResponse>>;
  async complete(params: CompleteParams): Promise<LLMResponse>;
  async complete(
    params: StreamingCompleteParams | CompleteParams,
  ): Promise<LLMResponse | AsyncIterableIterator<LLMResponse>> {
    if (params.stream) {
      return await this.streamingComplete(params);
    }
    return await this.complete(params);
  }
  async streamingComplete(
    params: StreamingCompleteParams,
  ): Promise<AsyncIterableIterator<LLMResponse>> {
    if (!this.aguiAgent) {
      throw new Error("Agent not initialized");
    }
    this.aguiAgent.addMessages(
      params.messages.map((m, msgIndex): AGUIMessage => {
        if (m.role === "function") {
          throw new Error("Function messages are not supported");
        }
        const toolCallId = getToolCallId(m);
        return {
          role: m.role,
          content: convertMessagesToString(m.content),
          // TODO: probably include message id in the incoming type
          id: `tambo-${m.role}-${msgIndex}`,
          // strange that this is required heree
          toolCallId,
        };
      }),
    );
    throw new Error("Method not implemented.");
  }
  async nonStreamingComplete(_params: CompleteParams): Promise<LLMResponse> {
    if (!this.aguiAgent) {
      throw new Error("Agent not initialized");
    }
    throw new Error("Method not implemented.");
  }
}

/** Hacky conversion of messages to string */
function convertMessagesToString(
  messages:
    | (
        | ChatCompletionContentPart
        | OpenAI.Chat.Completions.ChatCompletionContentPartRefusal
      )[]
    | null
    | undefined
    | string,
): string {
  if (!messages) {
    return "";
  }
  if (typeof messages === "string") {
    return messages;
  }
  return messages.map((m) => m).join("\n");
}

/** Hacky tool id retrieval - types seem to imply that toolCallId can't be undefined */
function getToolCallId(m: ChatCompletionMessageParam): string {
  if (m.role === "assistant") {
    // HACK: grab the first tool call id
    return m.tool_calls?.find((t) => t.id)?.id ?? "";
  }
  if (m.role === "tool") {
    return m.tool_call_id;
  }
  return "";
}

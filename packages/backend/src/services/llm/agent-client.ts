import {
  AbstractAgent,
  Message as AGUIMessage,
  EventType,
} from "@ag-ui/client";
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
import { runStreamingAgent } from "./async-adapters";

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
      return this.streamingComplete(params);
    }
    return await this.complete(params);
  }
  async *streamingComplete(
    params: StreamingCompleteParams,
  ): AsyncIterableIterator<LLMResponse> {
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

    const generator = runStreamingAgent(this.aguiAgent);
    for (;;) {
      const { done, value } = await generator.next();
      if (done) {
        const _result = value;
        // result is the final result of the agent run, but we might have actually streamed everything already?
        return;
      }
      const { event } = value;
      console.log(event);
      // here we need to yield the growing event to the caller
      switch (event.type) {
        case EventType.RUN_STARTED:
        case EventType.MESSAGES_SNAPSHOT:
        case EventType.RUN_ERROR:
        case EventType.RUN_FINISHED:
        case EventType.STATE_SNAPSHOT:
        case EventType.STATE_DELTA:
        case EventType.TOOL_CALL_START:
        case EventType.TOOL_CALL_ARGS:
        case EventType.TOOL_CALL_END:
        case EventType.TOOL_CALL_RESULT:
        case EventType.TEXT_MESSAGE_START:
        case EventType.TEXT_MESSAGE_CONTENT:
        case EventType.TEXT_MESSAGE_END:
        case EventType.STEP_STARTED:
        case EventType.STEP_FINISHED:
        case EventType.CUSTOM:
        case EventType.RAW:
        case EventType.TEXT_MESSAGE_CHUNK:
        case EventType.TOOL_CALL_CHUNK:
        case EventType.THINKING_START:
        case EventType.THINKING_END:
        case EventType.THINKING_TEXT_MESSAGE_CONTENT:
        case EventType.THINKING_TEXT_MESSAGE_END:
        case EventType.THINKING_TEXT_MESSAGE_START:
          yield {
            logprobs: null,
            index: 0,
            message: {} as OpenAI.Chat.Completions.ChatCompletionMessage,
          } satisfies LLMResponse;
          break;
        default: {
          invalidEvent(event.type);
        }
      }
    }
  }

  async nonStreamingComplete(_params: CompleteParams): Promise<LLMResponse> {
    if (!this.aguiAgent) {
      throw new Error("Agent not initialized");
    }
    throw new Error("Method not implemented.");
  }
}
function invalidEvent(eventType: never) {
  console.error(`Invalid event type: ${eventType}`);
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

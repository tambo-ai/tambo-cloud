import {
  AbstractAgent,
  Message as AGUIMessage,
  EventType,
  MessagesSnapshotEvent,
  RunFinishedEvent,
  TextMessageContentEvent,
  TextMessageStartEvent,
  ToolCallArgsEvent,
  ToolCallResultEvent,
  ToolCallStartEvent,
} from "@ag-ui/client";
import { Message, StateDeltaEvent, ToolCallEndEvent } from "@ag-ui/core";
import { CrewAIAgent } from "@ag-ui/crewai";
import { MastraAgent } from "@ag-ui/mastra";
import { MastraClient } from "@mastra/client-js";
import {
  AgentProviderType,
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
} from "@tambo-ai-cloud/core";
import OpenAI from "openai";
import { runStreamingAgent } from "./async-adapters";
import { CompleteParams, LLMResponse } from "./llm-client";

enum AgentResponseType {
  MESSAGE = "message",
  COMPLETE = "complete",
}
export interface AgentResponse {
  type: AgentResponseType;
  message: Message;
  complete?: true;
}

export class AgentClient {
  private aguiAgent: AbstractAgent | undefined;
  chainId: string;

  private constructor(chainId: string, aguiAgent: AbstractAgent) {
    this.chainId = chainId;
    this.aguiAgent = aguiAgent;
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
    switch (agentProviderType) {
      case AgentProviderType.MASTRA: {
        const client = new MastraClient({ baseUrl: agentUrl });

        const agents = await MastraAgent.getRemoteAgents({
          mastraClient: client,
        });
        if (!(agentName in agents)) {
          throw new Error(`Agent ${agentName} not found`);
        }
        const agent = agents[agentName];
        const agentClient = new AgentClient(chainId, agent);

        return agentClient;
      }
      case AgentProviderType.CREWAI: {
        const agent = new CrewAIAgent({
          url: agentUrl,
          agentId: agentName,
        });
        return new AgentClient(chainId, agent as unknown as AbstractAgent);
      }
      default: {
        throw new Error(
          `Unsupported agent provider type: ${agentProviderType}`,
        );
      }
    }
  }

  async *streamRunAgent(params: {
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
    tools: OpenAI.Chat.Completions.ChatCompletionTool[];
  }): AsyncIterableIterator<AgentResponse> {
    if (!this.aguiAgent) {
      throw new Error("Agent not initialized");
    }

    console.log("==== Setting messages", params.messages.length);
    const agentMessages = params.messages.map((m, msgIndex): AGUIMessage => {
      if (m.role === "function") {
        throw new Error("Function messages are not supported");
      }
      const toolCallId = getToolCallId(m);
      if (m.role === "tool") {
        return {
          role: m.role,
          content: convertMessagesToString(m.content),
          id: `tambo-${m.role}-${msgIndex}`,
          toolCallId: toolCallId,
        };
      }
      return {
        role: m.role,
        content: convertMessagesToString(m.content),
        // TODO: probably include message id in the incoming type
        id: `tambo-${m.role}-${msgIndex}`,
      };
    });
    console.log("==== Messages", JSON.stringify(agentMessages, null, 2));
    this.aguiAgent.setMessages(agentMessages);

    console.log("==== Running agent");
    const generator = runStreamingAgent(this.aguiAgent);
    let currentResponse: AgentResponse | undefined = undefined;
    let currentToolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall | null =
      null;
    for (;;) {
      // we are doing manual iteration of the generator so we can track the "done" state at the end
      // TODO: figure out if there's a better way to do this
      const { done, value } = await generator.next();
      console.log(
        "==== Generator next",
        done,
        `=== ${JSON.stringify(value).slice(0, 40)}... ===`,
      );
      if (done) {
        const _agentRunResult = value;
        // result is the final result of the agent run, but we might have actually streamed everything already?
        // TODO: figure out if there's a difference between this and the RUN_FINISHED event
        yield {
          type: AgentResponseType.COMPLETE,
          message: {
            id: "tambo-assistant-complete",
            content: "",
            role: "assistant",
          },
        };
        return;
      }
      const { event } = value;
      console.log(`\n=== ${event.type} ===`);
      // here we need to yield the growing event to the caller
      switch (event.type) {
        case EventType.MESSAGES_SNAPSHOT: {
          console.log("=> Emitting last message");
          // emit the last message
          const e = event as MessagesSnapshotEvent;
          const lastMessage = e.messages[e.messages.length - 1];
          switch (lastMessage.role) {
            case "assistant": {
              yield {
                type: AgentResponseType.MESSAGE,
                message: {
                  content: lastMessage.content,
                  role: lastMessage.role,
                  id: lastMessage.id,
                },
              };
              break;
            }
            case "tool": {
              yield {
                type: AgentResponseType.MESSAGE,
                message: lastMessage,
              };
              break;
            }
            case "developer":
            case "system":
            case "user": {
              yield {
                type: AgentResponseType.MESSAGE,
                message: lastMessage,
              };
              break;
            }
            default: {
              invalidEvent(lastMessage);
            }
          }
          break;
        }

        case EventType.RUN_STARTED: {
          // we don't support "runs" yet, but "started" may be a point to emit a message about the run
          break;
        }
        case EventType.RUN_ERROR: {
          // we don't support "runs" yet, but "error" may be a point to emit a message about the error
          break;
        }
        case EventType.RUN_FINISHED: {
          console.log("=> Emitting final message");
          // we don't support "runs" yet, but "finished" may be a point to emit the final response
          const e = event as RunFinishedEvent;
          console.log("==> final result", e.result);
          if (!currentResponse) {
            // throw new Error("No current response");
            console.log("===== Run finished, but no current response");
          } else {
            currentResponse.message = {
              ...currentResponse.message,
              content:
                typeof e.result === "string"
                  ? e.result
                  : JSON.stringify(e.result),
              role: "assistant",
            };
            yield currentResponse;
          }
          // all done, no more events to emit
          return;
        }
        case EventType.STATE_SNAPSHOT: {
          console.log("=> State snapshot");
          break;
        }
        case EventType.STATE_DELTA: {
          console.log("=> State delta");
          const e = event as StateDeltaEvent;
          console.log("   state delta: ", e.delta);
          break;
        }
        case EventType.TOOL_CALL_START: {
          console.log("=> Starting tool call");
          const e = event as ToolCallStartEvent;

          currentToolCall = {
            id: e.toolCallId,
            type: "function",
            function: {
              arguments: "",
              name: e.toolCallName,
            },
          };
          yield {
            type: AgentResponseType.MESSAGE,
            message: {
              role: "assistant",
              content: "",
              id: `message-${e.toolCallId}`,
              toolCalls: [currentToolCall],
            },
          };
          break;
        }
        case EventType.TOOL_CALL_CHUNK:
        case EventType.TOOL_CALL_ARGS: {
          console.log("=> Accumulating tool call args");
          const e = event as ToolCallArgsEvent;
          if (!currentToolCall) {
            throw new Error("No tool call found");
          }

          currentToolCall.function.arguments += e.delta;
          yield {
            type: AgentResponseType.MESSAGE,
            message: {
              role: "assistant",
              content: currentToolCall.function.arguments,
              // HACK: we need to generate a message id for the tool call
              // result, but maybe we'll actually emit this in the
              // TOOL_CALL_RESULT event?
              id: `message-${e.toolCallId}`,
              toolCalls: [currentToolCall],
            },
          };
          break;
        }
        case EventType.TOOL_CALL_END: {
          console.log("=> Tool call end");
          if (!currentToolCall) {
            throw new Error("No tool call found");
          }
          const e = event as ToolCallEndEvent;
          // TODO: would be nice to distinguish this message from the in-progress one emitted by TOOL_CALL_ARGS
          yield {
            type: AgentResponseType.MESSAGE,
            message: {
              role: "assistant",
              content: currentToolCall.function.arguments,
              // HACK: we need to generate a message id for the tool call
              // result, but maybe we'll actually emit this in the
              // TOOL_CALL_RESULT event?
              id: `message-${e.toolCallId}`,
              toolCalls: [currentToolCall],
            },
          };
          break;
        }
        case EventType.TOOL_CALL_RESULT: {
          const e = event as ToolCallResultEvent;
          console.log("=> Tool call result", `${e.content.slice(0, 10)}...`);
          // this is going to look a lot like the TOOL_CALL_END event, but with a different message id,
          // but the content is almost certainly the same
          yield {
            type: AgentResponseType.MESSAGE,
            message: {
              // TODO: this is a different message id from the one emitted by the TOOL_CALL_END event
              id: e.messageId,
              role: "tool",
              content: e.content,
              toolCallId: e.toolCallId,
            },
          };
          break;
        }
        case EventType.TEXT_MESSAGE_START: {
          console.log("=> Emitting text message update");
          const e = event as TextMessageStartEvent;
          currentResponse = {
            type: AgentResponseType.MESSAGE,
            message: {
              id: e.messageId,
              role: e.role,
              content: "",
            },
          };
          yield currentResponse;
          break;
        }
        case EventType.TEXT_MESSAGE_CONTENT:
        case EventType.TEXT_MESSAGE_CHUNK: {
          const e = event as TextMessageContentEvent;
          console.log("=> Text message content", e.delta);
          if (!currentResponse) {
            throw new Error("No current response");
          }

          const newResponse: AgentResponse = {
            ...currentResponse,
            message: {
              ...currentResponse.message,
              content: currentResponse.message.content + e.delta,
            },
          };
          currentResponse = newResponse;
          yield currentResponse;
          break;
        }
        case EventType.TEXT_MESSAGE_END: {
          // nothing to actually do here, the message should have been emitted already?
          console.log("=> Text message end");
          currentResponse = undefined;
          break;
        }
        case EventType.STEP_STARTED:
        case EventType.STEP_FINISHED: {
          // We don't really support "steps" yet
          break;
        }
        case EventType.CUSTOM:
        case EventType.RAW: {
          // this is kind of out-of-band events, not sure what to do with them yet.
          break;
        }
        case EventType.THINKING_START:
        case EventType.THINKING_END:
        case EventType.THINKING_TEXT_MESSAGE_CONTENT:
        case EventType.THINKING_TEXT_MESSAGE_END:
        case EventType.THINKING_TEXT_MESSAGE_START: {
          // we don't support thinking yet
          break;
        }
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
  return messages
    .filter((m) => m.type === "text")
    .map((m) => m.text)
    .join("\n");
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

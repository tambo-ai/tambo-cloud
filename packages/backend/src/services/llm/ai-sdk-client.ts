import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { mistral } from "@ai-sdk/mistral";
import { openai } from "@ai-sdk/openai";
import { formatTemplate } from "@libretto/openai/lib/src/template";
import { ChatCompletionMessageParam } from "@tambo-ai-cloud/core";
import {
  convertToCoreMessages,
  CoreAssistantMessage,
  CoreMessage,
  CoreToolMessage,
  generateText,
  jsonSchema,
  LanguageModel,
  streamText,
  tool,
  ToolCallPart,
  ToolContent,
  ToolResultPart,
  type GenerateTextResult,
  type StreamTextResult,
  type ToolSet,
} from "ai";
import type OpenAI from "openai";
import { llmProviderConfig } from "../../config/llm.config";
import { Provider } from "../../model/providers";
import {
  CompleteParams,
  LLMClient,
  LLMResponse,
  StreamingCompleteParams,
} from "./llm-client";
import { limitTokens } from "./token-limiter";

// Provider function type - these functions have different signatures but all return LanguageModel
type ProviderFunction = (...args: any[]) => LanguageModel;

// Provider instances mapping
const PROVIDER_INSTANCES: Record<string, ProviderFunction> = {
  openai: openai,
  anthropic: anthropic,
  mistral: mistral,
  google: google,
  groq: groq,
  "openai-compatible": openai, // Will be configured with custom baseURL
} as const;

// Provider configuration type
interface ProviderConfig {
  apiKey?: string;
  baseURL?: string;
  [key: string]: unknown;
}

// Model to provider mapping based on our config
function getProviderFromModel(
  model: string,
  provider: Provider,
): keyof typeof PROVIDER_INSTANCES {
  // For openai-compatible, always use openai instance
  if (provider === "openai-compatible") {
    return "openai-compatible";
  }

  // For other providers, map based on the provider directly
  switch (provider) {
    case "openai":
      return "openai";
    case "anthropic":
      return "anthropic";
    case "mistral":
      return "mistral";
    case "groq":
      return "groq";
    case "gemini":
      return "google";
    default:
      // Fallback to OpenAI for unknown providers
      return "openai";
  }
}

export class AISdkClient implements LLMClient {
  private model: string;
  private provider: Provider;
  private apiKey: string | undefined;
  private baseURL?: string;
  private maxInputTokens?: number | null;
  private chainId: string;

  constructor(
    apiKey: string | undefined,
    model: string,
    provider: Provider,
    chainId: string,
    baseURL?: string,
    maxInputTokens?: number | null,
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.provider = provider;
    this.chainId = chainId;
    this.baseURL = baseURL;
    this.maxInputTokens = maxInputTokens;
  }

  async complete(
    params: StreamingCompleteParams,
  ): Promise<AsyncIterableIterator<LLMResponse>>;
  async complete(params: CompleteParams): Promise<LLMResponse>;
  async complete(
    params: StreamingCompleteParams | CompleteParams,
  ): Promise<LLMResponse | AsyncIterableIterator<LLMResponse>> {
    const providerKey = getProviderFromModel(this.model, this.provider);
    const providerInstance = PROVIDER_INSTANCES[providerKey];

    // Get the model instance with proper configuration
    const modelInstance = this.getModelInstance(providerInstance, providerKey);

    // Format messages using the same template system as token.js client
    const nonStringParams = Object.entries(params.promptTemplateParams).filter(
      ([, value]) =>
        typeof value !== "string" &&
        !Array.isArray(value) &&
        typeof value !== "undefined",
    );
    if (nonStringParams.length > 0) {
      console.trace(
        "All prompt template params must be strings, came from....",
        nonStringParams,
      );
    }

    let messagesFormatted = tryFormatTemplate(
      params.messages,
      params.promptTemplateParams,
    );

    // Apply token limiting
    const modelTokenLimit =
      llmProviderConfig[this.provider].models?.[this.model]?.properties
        .inputTokenLimit;
    const effectiveTokenLimit = this.maxInputTokens ?? modelTokenLimit;
    messagesFormatted = limitTokens(messagesFormatted, effectiveTokenLimit);

    // Convert to AI SDK format
    console.log("messagesFormatted:", messagesFormatted);
    // const coreMessages = convertToCoreMessages(messagesFormatted);
    // console.log("coreMessages:", coreMessages);

    // Prepare tools
    const tools = params.tools ? this.convertTools(params.tools) : undefined;

    // Prepare response format
    const responseFormat = this.extractResponseFormat(params);

    const coreMessages = messagesFormatted.map(
      (message, index): CoreMessage =>
        convertOpenAIMessageToCoreMessage(
          message,
          messagesFormatted.slice(0, index),
        ),
    );
    console.log(
      "converted assistant message:",
      messagesFormatted.findLast((m) => m.role === "assistant"),
    );
    console.log(
      "assistant message:",
      coreMessages.findLast((m) => m.role === "assistant"),
    );
    const baseConfig = {
      model: modelInstance,
      messages: coreMessages,
      temperature: 0,
      tools,
      toolChoice: params.tool_choice
        ? this.convertToolChoice(params.tool_choice)
        : undefined,
      ...(responseFormat && { responseFormat }),
    };

    if (params.stream) {
      console.log("starting stream...");
      const result = streamText(baseConfig);
      return this.handleStreamingResponse(result);
    } else {
      const result = await generateText(baseConfig);
      return this.convertToLLMResponse(result);
    }
  }

  private getModelInstance(
    providerInstance: ProviderFunction,
    providerKey: string,
  ): LanguageModel {
    const config: ProviderConfig = {};

    if (this.apiKey) {
      config.apiKey = this.apiKey;
    }

    if (providerKey === "openai-compatible" && this.baseURL) {
      config.baseURL = this.baseURL;
    }

    return providerInstance(this.model, config);
  }

  private convertTools(tools: OpenAI.Chat.Completions.ChatCompletionTool[]) {
    const toolSet: ToolSet = {};

    tools.forEach((toolDef) => {
      // Create a simplified tool definition compatible with AI SDK
      // We'll use a simple z.any() for parameters since converting JSON Schema to Zod is complex
      const aiSdkTool = tool({
        type: "function",
        description: toolDef.function.description || "",
        parameters: jsonSchema(toolDef.function.parameters ?? {}),
      });

      toolSet[toolDef.function.name] = aiSdkTool;
    });

    return toolSet;
  }

  private convertToolChoice(
    toolChoice: OpenAI.Chat.Completions.ChatCompletionToolChoiceOption,
  ): "auto" | "none" | "required" | { type: "tool"; toolName: string } {
    if (typeof toolChoice === "string") {
      return toolChoice;
    }
    // toolChoice is an object with type "function"
    return {
      type: "tool" as const,
      toolName: toolChoice.function.name,
    };
  }

  private extractResponseFormat(
    params: StreamingCompleteParams | CompleteParams,
  ) {
    if (params.jsonMode) {
      return { type: "json" as const };
    }

    if (params.zodResponseFormat) {
      return {
        type: "object" as const,
        schema: params.zodResponseFormat,
      };
    }

    if (params.schemaResponseFormat) {
      return {
        type: "object" as const,
        schema: params.schemaResponseFormat,
      };
    }

    return undefined;
  }

  private async *handleStreamingResponse(
    result: StreamTextResult<Record<string, any>, undefined>,
  ): AsyncIterableIterator<LLMResponse> {
    let accumulatedMessage = "";
    const accumulatedToolCall: {
      name?: string;
      arguments?: string;
      id?: string;
    } = {};
    console.log("STREAMING got result:", result);
    for await (const delta of result.fullStream) {
      console.log("STREAMING got delta:", delta);
      switch (delta.type) {
        case "text-delta":
          accumulatedMessage += delta.textDelta;
          break;
        case "tool-call":
          // accumulatedToolCall = delta.toolCall;
          break;
        case "tool-call-delta":
          // accumulatedToolCall = delta.toolCall;
          break;
        case "error":
          console.error("error:", delta.error);
          throw delta.error;
          break;
      }

      // if (delta) {
      //   accumulatedMessage += delta;
      // }

      // Note: For streaming, tool calls should be handled via the fullStream
      // This is a simplified implementation - in practice you'd want to listen to fullStream
      // for tool-call events rather than accessing the promise-based toolCalls

      let toolCallRequest:
        | OpenAI.Chat.Completions.ChatCompletionMessageToolCall
        | undefined;
      if (accumulatedToolCall.name && accumulatedToolCall.arguments) {
        toolCallRequest = {
          function: {
            name: accumulatedToolCall.name,
            arguments: accumulatedToolCall.arguments,
          },
          id: accumulatedToolCall.id ?? "",
          type: "function",
        };
      }

      yield {
        message: {
          content: accumulatedMessage,
          role: "assistant",
          tool_calls: toolCallRequest ? [toolCallRequest] : undefined,
          refusal: null,
        },
        index: 0,
        logprobs: null,
      };
    }

    console.log("now checking for tool calls...");
    const toolCalls = await result.toolCalls;
    if (toolCalls.length) {
      console.log(
        `found ${toolCalls.length} tool calls!`,
        toolCalls[0].toolName,
        toolCalls[0].args,
      );
      yield {
        message: {
          content: accumulatedMessage,
          role: "assistant",
          tool_calls: toolCalls.map(
            (call): OpenAI.Chat.Completions.ChatCompletionMessageToolCall => ({
              function: {
                arguments: JSON.stringify(call.args),
                name: call.toolName,
              },
              id: call.toolCallId,
              type: "function",
            }),
          ),
          refusal: null,
        },
        index: 0,
        logprobs: null,
      };
    }
    console.log("done streaming");
  }

  private convertToLLMResponse(
    result: GenerateTextResult<Record<string, any>, undefined>,
  ): LLMResponse {
    const toolCalls = result.toolCalls.map((call) => ({
      function: {
        name: call.toolName,
        arguments: JSON.stringify(call.args),
      },
      id: call.toolCallId,
      type: "function" as const,
    }));

    return {
      message: {
        content: result.text,
        role: "assistant",
        tool_calls: toolCalls,
        refusal: null,
      },
      index: 0,
      logprobs: null,
    };
  }
}

/** We have to manually format this because objectTemplate doesn't seem to support chat_history */
function tryFormatTemplate(
  messages: ChatCompletionMessageParam[],
  promptTemplateParams: Record<string, unknown>,
): ChatCompletionMessageParam[] {
  try {
    return formatTemplate(messages as any, promptTemplateParams);
  } catch (_e) {
    return messages;
  }
}

function findToolMessage(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  toolCallId: string,
): OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam | undefined {
  return messages.findLast(
    (
      message,
    ): message is OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam => {
      if (message.role === "assistant") {
        return !!message.tool_calls?.some((call) => call.id === toolCallId);
      }
      return false;
    },
  );
}

/**
 * This is effectively the same thing as as singular version of
 * convertToCoreMessages, (which is supposedly deprecated anyway)
 * but for some reason that function doesn't deal with tool calls.
 */
function convertOpenAIMessageToCoreMessage(
  message: OpenAI.Chat.Completions.ChatCompletionMessageParam,
  previousMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
): CoreMessage {
  if (message.role === "developer" || message.role === "function") {
    throw new Error("Developer messages are not supported");
  }
  if (message.role === "tool") {
    const toolName =
      findToolMessage(previousMessages, message.tool_call_id)?.tool_calls?.[0]
        ?.function.name ?? "UNKNOWN_TOOL";
    console.log("resolved tool call", message.tool_call_id, " to", toolName);
    return {
      role: "tool",
      content:
        typeof message.content === "string"
          ? ([
              {
                result: message.content,
                toolCallId: message.tool_call_id,
                type: "tool-result",
                toolName: toolName,
              } satisfies ToolResultPart,
            ] satisfies ToolContent)
          : message.content.map(
              (part): ToolResultPart => ({
                // TODO: Figure out multi-tool results - is there one
                // content per tool call?
                type: "tool-result",
                result: part.text,
                toolCallId: message.tool_call_id,
                toolName: toolName,
              }),
            ),
    } satisfies CoreToolMessage;
  }
  if (message.role === "assistant" && message.tool_calls) {
    return {
      role: "assistant",
      content: message.tool_calls.map(
        (call): ToolCallPart => ({
          type: "tool-call",
          args: JSON.parse(call.function.arguments),
          toolCallId: call.id,
          toolName: call.function.name,
        }),
      ),
    } satisfies CoreAssistantMessage;
  }
  return convertToCoreMessages([message as any])[0];
}

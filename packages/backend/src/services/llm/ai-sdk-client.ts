import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { formatTemplate } from "@libretto/openai/lib/src/template";
import {
  ChatCompletionMessageParam,
  getToolDescription,
  getToolName,
  tryParseJson,
} from "@tambo-ai-cloud/core";
import {
  convertToCoreMessages,
  CoreAssistantMessage,
  CoreMessage,
  CoreToolMessage,
  generateText,
  jsonSchema,
  LanguageModel,
  streamText,
  Tool,
  tool,
  ToolCallPart,
  ToolChoice,
  ToolContent,
  ToolResultPart,
  Output,
  type GenerateTextResult,
  type StreamTextResult,
  type ToolSet,
} from "ai";
import type OpenAI from "openai";
import { z } from "zod";
import { createLangfuseTelemetryConfig } from "../../config/langfuse.config";
import type { JSONSchema7 } from "json-schema";
import type { LlmProviderConfigInfo } from "../../config/llm-config-types";
import { llmProviderConfig } from "../../config/llm.config";
import { Provider } from "../../model/providers";
import {
  CompleteParams,
  LLMClient,
  LLMResponse,
  StreamingCompleteParams,
} from "./llm-client";
import { limitTokens } from "./token-limiter";

type TextStreamResponse = StreamTextResult<ToolSet, unknown>;

// Common provider configuration interface
interface ProviderConfig {
  apiKey?: string;
  baseURL?: string;
  headers?: Record<string, string>;
  [key: string]: unknown;
}

// Type for a configured provider instance that can create language models
type ConfiguredProvider = (modelId: string) => LanguageModel;

// Provider factory function type - creates configured provider instances
type ProviderFactory = (config?: ProviderConfig) => ConfiguredProvider;

// Provider instances mapping - these are factory functions
const PROVIDER_FACTORIES: Record<string, ProviderFactory> = {
  openai: createOpenAI,
  anthropic: createAnthropic,
  mistral: createMistral,
  google: createGoogleGenerativeAI,
  groq: createGroq,
  "openai-compatible": createOpenAI, // Will be configured with custom baseURL
} as const;

// Model to provider mapping based on our config
function getProviderFromModel(
  model: string,
  provider: Provider,
): keyof typeof PROVIDER_FACTORIES {
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
  readonly chainId: string;
  readonly userId: string;

  constructor(
    apiKey: string | undefined,
    model: string,
    provider: Provider,
    chainId: string,
    userId: string,
    baseURL?: string,
    maxInputTokens?: number | null,
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.provider = provider;
    this.chainId = chainId;
    this.userId = userId;
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

    // Get the model instance with proper configuration
    const modelInstance = this.getModelInstance(providerKey);

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
    const providerCfg = (
      llmProviderConfig as Partial<Record<Provider, LlmProviderConfigInfo>>
    )[this.provider];

    const models = providerCfg?.models;
    const modelCfg = models ? models[this.model] : undefined;

    if (!modelCfg) {
      console.warn(
        `Unknown model "${this.model}" for provider "${this.provider}"`,
      );
    }

    const modelTokenLimit = modelCfg?.properties.inputTokenLimit;
    const effectiveTokenLimit = this.maxInputTokens ?? modelTokenLimit;
    messagesFormatted = limitTokens(messagesFormatted, effectiveTokenLimit);

    // Prepare tools
    const tools = params.tools ? this.convertTools(params.tools) : undefined;

    // Prepare response format
    const outputSpec = this.extractOutputSpec(params);

    // Convert to AI SDK format
    const coreMessages = messagesFormatted.map(
      (message, index): CoreMessage =>
        convertOpenAIMessageToCoreMessage(
          message,
          messagesFormatted.slice(0, index),
        ),
    );

    // Prepare experimental telemetry for Langfuse
    const experimentalTelemetry = createLangfuseTelemetryConfig({
      sessionId: params.chainId ?? this.chainId,
      provider: this.provider,
      model: this.model,
      functionId: `${this.provider}-${this.model}`,
    });

    // Default temperature to 0 unless overridden by config
    const temperature = modelCfg?.properties.temperature;

    const baseConfig = {
      model: modelInstance,
      messages: coreMessages,
      temperature: temperature ?? 0,
      tools,
      toolChoice: params.tool_choice
        ? this.convertToolChoice(params.tool_choice)
        : undefined,
      ...(outputSpec && { experimental_output: outputSpec }),
      ...(experimentalTelemetry && {
        experimental_telemetry: experimentalTelemetry,
      }),
    };

    if (params.stream) {
      const result = streamText<ToolSet, unknown, unknown>(baseConfig);
      return this.handleStreamingResponse(result);
    } else {
      const result = await generateText<ToolSet, unknown, unknown>(baseConfig);
      return this.convertToLLMResponse(result);
    }
  }

  private getModelInstance(providerKey: string): LanguageModel {
    const config: ProviderConfig = {};

    if (this.apiKey) {
      config.apiKey = this.apiKey;
    }

    if (providerKey === "openai-compatible" && this.baseURL) {
      config.baseURL = this.baseURL;
    }

    // Create the configured provider instance
    const providerFactory = PROVIDER_FACTORIES[providerKey];
    const configuredProvider = providerFactory(config);

    // Now call the configured provider with the model ID
    return configuredProvider(this.model);
  }

  private convertTools(tools: OpenAI.Chat.Completions.ChatCompletionTool[]) {
    const toolSet: ToolSet = {};

    tools.forEach((toolDef) => {
      const toolName = getToolName(toolDef);
      // Create a simplified tool definition compatible with AI SDK
      // We'll use a jsonSchema wrapper for parameters. Providers will receive JSON Schema.
      const inputSchema =
        toolDef.type === "function"
          ? jsonSchema(
              (toolDef.function.parameters ?? ({} as unknown)) as JSONSchema7,
            )
          : z.any();
      const aiSdkTool = tool({
        description: getToolDescription(toolDef) || "",
        parameters: inputSchema,
      });

      toolSet[toolName] = aiSdkTool;
    });

    return toolSet;
  }

  /**
   * Convert the tool choice to a format that the AI SDK can understand.
   * @param toolChoice - The tool choice to convert.
   * @returns The converted tool choice.
   */
  private convertToolChoice(
    toolChoice: OpenAI.Chat.Completions.ChatCompletionToolChoiceOption,
  ): ToolChoice<ToolSet> {
    if (typeof toolChoice === "string") {
      return toolChoice;
    }
    switch (toolChoice.type) {
      case "function":
        return {
          type: "tool" as const,
          toolName: toolChoice.function.name,
        };
      case "custom":
        return {
          type: "tool" as const,
          toolName: toolChoice.custom.name,
        };
      case "allowed_tools":
        return "auto";
      default:
        return toolChoice;
    }
  }

  private extractOutputSpec(
    params: StreamingCompleteParams | CompleteParams,
  ): Output.Output<unknown, unknown> | undefined {
    // AI SDK v5 uses experimental_output for structured outputs.
    if (params.jsonMode) {
      // No schema: ask for generic JSON. Providers get responseFormat: { type: 'json' }.
      return Output.object({ schema: z.any() }) as Output.Output<
        unknown,
        unknown
      >;
    }

    if (params.zodResponseFormat) {
      return Output.object({
        schema: params.zodResponseFormat,
      }) as Output.Output<unknown, unknown>;
    }

    if (params.schemaResponseFormat) {
      return Output.object({
        schema: jsonSchema(params.schemaResponseFormat as JSONSchema7),
      }) as Output.Output<unknown, unknown>;
    }

    return undefined;
  }

  private async *handleStreamingResponse(
    result: TextStreamResponse,
  ): AsyncIterableIterator<LLMResponse> {
    let accumulatedMessage = "";

    for await (const delta of result.fullStream) {
      switch (delta.type) {
        case "text-delta":
          accumulatedMessage += delta.textDelta;
          break;
        case "reasoning":
        case "reasoning-signature":
        case "redacted-reasoning":
        case "source":
        case "file":
        case "tool-call":
        case "tool-call-streaming-start":
        case "tool-call-delta":
        case "step-start":
        case "step-finish":
        case "finish":
          // non-text events ignored for now
          break;
        case "error":
          console.error("error:", delta.error);
          throw delta.error;
        default:
          warnUnknownMessageType(delta);
      }
      yield {
        message: {
          content: accumulatedMessage,
          role: "assistant",
          tool_calls: undefined,
          refusal: null,
        },
        index: 0,
        logprobs: null,
      };
    }
    const toolCalls = await result.toolCalls;
    if (toolCalls.length) {
      yield {
        message: {
          content: accumulatedMessage,
          role: "assistant",
          tool_calls: toolCalls.map(
            (call): OpenAI.Chat.Completions.ChatCompletionMessageToolCall => ({
              function: {
                arguments: JSON.stringify(call.args ?? {}),
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
  }

  private convertToLLMResponse(
    result: GenerateTextResult<Record<string, Tool>, unknown>,
  ): LLMResponse {
    const toolCalls = result.toolCalls.map((call) => ({
      function: {
        name: call.toolName,
        // AI SDK 5 core uses `args` for tool calls.
        arguments: JSON.stringify(call.args ?? {}),
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
    // @libretto/openai is JS-only; add a typed veneer for TS without `any`.
    type FormatFn = (
      o: unknown,
      parameters: Record<string, unknown>,
    ) => unknown;
    const fmt = formatTemplate as unknown as FormatFn;
    return fmt(messages, promptTemplateParams) as ChatCompletionMessageParam[];
  } catch (_e) {
    return messages;
  }
}

function findToolNameById(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  toolCallId: string,
): string | undefined {
  const toolNames = messages
    .map((message) => {
      if (message.role === "assistant" && message.tool_calls) {
        const toolCall = message.tool_calls.find(
          (call) => call.id === toolCallId,
        );
        return toolCall ? getToolName(toolCall) : undefined;
      }
    })
    .filter((name) => name !== undefined);
  return toolNames.length > 0 ? toolNames[0] : undefined;
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
    const toolName = findToolNameById(previousMessages, message.tool_call_id);
    if (!toolName) {
      throw new Error(
        `Unable to find previous message for tool call ${message.tool_call_id}`,
      );
    }
    return {
      role: "tool",
      content:
        typeof message.content === "string"
          ? ([
              {
                // AI SDK core expects `result` for tool outputs.
                result: message.content,
                toolCallId: message.tool_call_id,
                type: "tool-result",
                toolName: toolName,
              } satisfies ToolResultPart,
            ] satisfies ToolContent)
          : message.content.map(
              (part): ToolResultPart => ({
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
          // AI SDK core uses `args` for tool calls.
          args:
            call.type === "function"
              ? tryParseJson(call.function.arguments)
              : call.custom.input,
          toolCallId: call.id,
          toolName: getToolName(call),
        }),
      ),
    } satisfies CoreAssistantMessage;
  }
  // Fallback: delegate conversion for simple messages via UI message shape.
  const fallbackContent =
    typeof message.content === "string"
      ? message.content
      : Array.isArray(message.content)
        ? message.content.map(extractPartText).join(" ")
        : "";
  const uiMessage: Omit<import("ai").Message, "id"> = {
    role: message.role as "system" | "user" | "assistant" | "data",
    content: fallbackContent,
  };
  return convertToCoreMessages([uiMessage])[0];
}

function extractPartText(part: unknown): string {
  if (typeof part === "string") return part;
  if (
    typeof part === "object" &&
    part !== null &&
    "text" in (part as Record<string, unknown>) &&
    typeof (part as Record<string, unknown>).text === "string"
  ) {
    return (part as { text: string }).text;
  }
  return "";
}

function warnUnknownMessageType(message: unknown) {
  console.warn("Unknown message type:", message);
}

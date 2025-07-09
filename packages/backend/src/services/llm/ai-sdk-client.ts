import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { mistral } from "@ai-sdk/mistral";
import { openai } from "@ai-sdk/openai";
import { formatTemplate } from "@libretto/openai/lib/src/template";
import { ChatCompletionMessageParam } from "@tambo-ai-cloud/core";
import {
  convertToCoreMessages,
  generateText,
  LanguageModel,
  streamText,
  tool,
  type GenerateTextResult,
  type StreamTextResult,
  type ToolSet,
} from "ai";
import type OpenAI from "openai";
import { z } from "zod";
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
    const coreMessages = convertToCoreMessages(messagesFormatted);

    // Prepare tools
    const tools = params.tools ? this.convertTools(params.tools) : undefined;

    // Prepare response format
    const responseFormat = this.extractResponseFormat(params);

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
      const result = await streamText(baseConfig);
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
        description: toolDef.function.description || "",
        parameters: z.any().describe("Tool parameters"), // Simplified for now
        // No execute function since tools are handled externally
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

    for await (const delta of result.textStream) {
      if (delta) {
        accumulatedMessage += delta;
      }

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
) {
  try {
    return formatTemplate(messages as any, promptTemplateParams);
  } catch (_e) {
    return messages;
  }
}

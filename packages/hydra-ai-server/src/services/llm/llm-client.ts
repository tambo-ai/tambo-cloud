import { ChatCompletionChoice } from "@libretto/token.js";
import {
  ChatCompletionMessageParam,
  ToolCallRequest,
} from "@tambo-ai-cloud/core";
import OpenAI from "openai";
import { JSONSchema } from "openai/lib/jsonschema";
import { ZodObject } from "zod";

interface BaseResponseFormat {
  jsonMode?: boolean;
  zodResponseFormat?: ZodObject<any>;
  schemaResponseFormat?: JSONSchema;
}
interface JsonResponseFormat extends BaseResponseFormat {
  jsonMode: true;
}
interface ZodResponseFormat extends BaseResponseFormat {
  zodResponseFormat: ZodObject<any>;
}
interface SchemaResponseFormat extends BaseResponseFormat {
  schemaResponseFormat: JSONSchema;
}

type ResponseFormat =
  | {
      jsonMode?: never;
      zodResponseFormat?: never;
      schemaResponseFormat?: never;
    }
  | JsonResponseFormat
  | ZodResponseFormat
  | SchemaResponseFormat;

interface StreamingCompleteBaseParams {
  messages: ChatCompletionMessageParam[];
  stream: true;
  tools?: OpenAI.Chat.Completions.ChatCompletionTool[];
  tool_choice?: OpenAI.Chat.Completions.ChatCompletionToolChoiceOption;
  promptTemplateName: string;
  promptTemplateParams: Record<string, string | ChatCompletionMessageParam[]>;
}

export type StreamingCompleteParams = StreamingCompleteBaseParams &
  ResponseFormat;

interface CompleteBaseParams {
  messages: ChatCompletionMessageParam[];
  stream?: false | undefined;
  tools?: OpenAI.Chat.Completions.ChatCompletionTool[];
  tool_choice?: OpenAI.Chat.Completions.ChatCompletionToolChoiceOption;
  promptTemplateName: string;
  promptTemplateParams: Record<string, string | ChatCompletionMessageParam[]>;
}

export type CompleteParams = CompleteBaseParams & ResponseFormat;

export interface LLMClient {
  complete(
    params: StreamingCompleteParams,
  ): Promise<AsyncIterableIterator<LLMResponse>>;

  complete(params: CompleteParams): Promise<LLMResponse>;
}
export type LLMResponse = Omit<ChatCompletionChoice, "finish_reason">;

export function getLLMResponseMessage(response: LLMResponse) {
  return response.message?.content ?? "";
}

export function getLLMResponseToolCallId(response: LLMResponse) {
  return response.message.tool_calls?.[0]?.id;
}

export function getLLMResponseToolCallRequest(
  response: LLMResponse,
): ToolCallRequest | undefined {
  const toolCallRequest = response.message.tool_calls?.[0];
  if (!toolCallRequest) {
    return undefined;
  }

  const args = JSON.parse(toolCallRequest.function.arguments);
  const parameters = Object.entries(args).map(([key, value]) => ({
    parameterName: key,
    parameterValue: value,
  }));

  return {
    toolName: toolCallRequest.function.name,
    parameters,
  };
}

import {
  type ChatCompletionMessageParam,
  type ChatCompletionTool,
} from "@libretto/token.js";
import { JSONSchema } from "openai/lib/jsonschema";
import { ZodObject } from "zod";
import { OpenAIResponse } from "../../model/openai-response";

export interface StreamingCompleteParams {
  messages: ChatCompletionMessageParam[];
  stream: true;
  tools?: ChatCompletionTool[];
  promptTemplateName: string;
  promptTemplateParams: Record<string, string | ChatCompletionMessageParam[]>;
  jsonMode?: boolean;
  responseFormat?: ZodObject<any>;
  schemaResponseFormat?: JSONSchema;
}

export interface CompleteParams {
  messages: ChatCompletionMessageParam[];
  stream?: false | undefined;
  tools?: ChatCompletionTool[];
  promptTemplateName: string;
  promptTemplateParams: Record<string, string | ChatCompletionMessageParam[]>;
  jsonMode?: boolean;
  zodResponseFormat?: ZodObject<any>;
  schemaResponseFormat?: JSONSchema;
}

export interface LLMClient {
  complete(
    params: StreamingCompleteParams,
  ): Promise<AsyncIterableIterator<OpenAIResponse>>;

  complete(params: CompleteParams): Promise<OpenAIResponse>;
}

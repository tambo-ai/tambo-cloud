import {
  type ChatCompletionMessageParam,
  type ChatCompletionTool,
} from "token.js";
import { OpenAIResponse } from "../../model/openai-response";

export interface LLMClient {
  complete(params: {
    messages: ChatCompletionMessageParam[];
    stream: true;
    tools?: ChatCompletionTool[];
    jsonMode?: boolean;
  }): Promise<AsyncIterableIterator<OpenAIResponse>>;

  complete(params: {
    messages: ChatCompletionMessageParam[];
    stream?: false | undefined;
    tools?: ChatCompletionTool[];
    jsonMode?: boolean;
  }): Promise<OpenAIResponse>;
}

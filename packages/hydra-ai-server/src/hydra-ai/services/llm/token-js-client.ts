import { ToolCallRequest } from "@use-hydra-ai/core";
import { ChatCompletion } from "openai/resources/chat/completions";
import {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  StreamCompletionResponse,
  TokenJS,
} from "token.js";
import { OpenAIResponse } from "../../model/openai-response";
import { Provider } from "../../model/providers";
import { LLMClient } from "./llm-client";

export class TokenJSClient implements LLMClient {
  private client: TokenJS;

  constructor(
    private apiKey: string,
    private model: string,
    private provider: Provider,
  ) {
    this.client = new TokenJS({ apiKey });
  }

  async complete(params: {
    messages: ChatCompletionMessageParam[];
    stream: true;
    tools?: ChatCompletionTool[];
    jsonMode?: boolean;
  }): Promise<AsyncIterableIterator<OpenAIResponse>>;
  async complete(params: {
    messages: ChatCompletionMessageParam[];
    stream?: false | undefined;
    tools?: ChatCompletionTool[];
    jsonMode?: boolean;
  }): Promise<OpenAIResponse>;
  async complete(params: {
    messages: ChatCompletionMessageParam[];
    stream?: boolean;
    tools?: ChatCompletionTool[];
    jsonMode?: boolean;
  }): Promise<OpenAIResponse | AsyncIterableIterator<OpenAIResponse>> {
    const componentTools = params.tools?.length ? params.tools : undefined;

    if (params.stream) {
      const stream = await this.client.chat.completions.create({
        provider: this.provider,
        model: this.model,
        messages: params.messages,
        temperature: 0,
        response_format: params.jsonMode ? { type: "json_object" } : undefined,
        tools: componentTools,
        stream: true,
      });

      return this.handleStreamingResponse(stream);
    }

    const response = await this.client.chat.completions.create({
      provider: this.provider,
      model: this.model,
      messages: params.messages,
      temperature: 0,
      response_format: params.jsonMode ? { type: "json_object" } : undefined,
      tools: componentTools,
    });

    const openAIResponse: OpenAIResponse = {
      message: response.choices[0].message.content || "",
    };

    if (
      (response.choices[0].finish_reason === "function_call" ||
        response.choices[0].finish_reason === "tool_calls" ||
        response.choices[0].finish_reason === "stop") &&
      response.choices[0].message.tool_calls?.length
    ) {
      openAIResponse.toolCallRequest = this.toolCallRequestFromResponse(
        response as ChatCompletion,
      );
    }
    if (!openAIResponse.message && !openAIResponse.toolCallRequest) {
      console.error(
        "No message or tool call request found in response: ",
        response.choices[0],
      );
    }

    return openAIResponse;
  }

  private async *handleStreamingResponse(
    stream: StreamCompletionResponse,
  ): AsyncIterableIterator<OpenAIResponse> {
    let accumulatedMessage = "";
    const accumulatedToolCall: { name?: string; arguments?: string } = {};

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      const toolCall = chunk.choices[0]?.delta?.tool_calls?.[0]?.function;

      if (content) {
        accumulatedMessage += content;
      }

      if (toolCall) {
        if (toolCall.name) {
          accumulatedToolCall.name = toolCall.name;
        }
        if (toolCall.arguments) {
          accumulatedToolCall.arguments =
            (accumulatedToolCall.arguments || "") + toolCall.arguments;
        }
      }

      let toolCallRequest: ToolCallRequest | undefined;
      if (accumulatedToolCall.name && accumulatedToolCall.arguments) {
        try {
          const toolArgs = JSON.parse(accumulatedToolCall.arguments);
          toolCallRequest = {
            toolName: accumulatedToolCall.name,
            parameters: Object.entries(toolArgs).map(([key, value]) => ({
              parameterName: key,
              parameterValue: value,
            })),
          };
        } catch (e) {
          // Skip if JSON parsing fails (incomplete JSON)
        }
      }

      yield { message: accumulatedMessage, toolCallRequest };
    }
  }

  private toolCallRequestFromResponse(response: ChatCompletion) {
    const toolCall = response.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool calls found in response");
    }
    const toolArgs = JSON.parse(toolCall.function.arguments);

    return {
      toolName: toolCall.function.name,
      parameters: Object.entries(toolArgs).map(([key, value]) => ({
        parameterName: key,
        parameterValue: value,
      })),
    };
  }
}

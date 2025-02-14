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

  async complete(
    messages: ChatCompletionMessageParam[],
    stream: true,
    tools?: ChatCompletionTool[],
    jsonMode?: boolean,
  ): Promise<AsyncIterableIterator<OpenAIResponse>>;
  async complete(
    messages: ChatCompletionMessageParam[],
    stream?: false,
    tools?: ChatCompletionTool[],
    jsonMode?: boolean,
  ): Promise<OpenAIResponse>;
  async complete(
    messages: ChatCompletionMessageParam[],
    stream = false,
    tools?: ChatCompletionTool[],
    jsonMode = false,
  ): Promise<OpenAIResponse | AsyncIterableIterator<OpenAIResponse>> {
    const componentTools = tools?.length ? tools : undefined;

    if (stream) {
      const stream = await this.client.chat.completions.create({
        provider: this.provider,
        model: this.model,
        messages: messages,
        temperature: 0,
        response_format: jsonMode ? { type: "json_object" } : undefined,
        tools: componentTools,
        stream: true,
      });

      return this.handleStreamingResponse(stream);
    }

    const response = await this.client.chat.completions.create({
      provider: this.provider,
      model: this.model,
      messages: messages,
      temperature: 0,
      response_format: jsonMode ? { type: "json_object" } : undefined,
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
    //TODO: Handle tool calls
    let accumulatedMessage = "";
    let accumulatedToolCallRequest: ToolCallRequest | undefined;
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      const toolCalls = chunk.choices[0]?.delta?.tool_calls;

      if (content) {
        accumulatedMessage += content;
      }

      yield { message: accumulatedMessage };
    }
  }

  private toolCallRequestFromResponse(response: ChatCompletion) {
    if (!response.choices[0].message.tool_calls) {
      throw new Error("No tool calls found in response");
    }
    const toolArgs = JSON.parse(
      response.choices[0].message.tool_calls[0].function.arguments,
    );

    return {
      toolName: response.choices[0].message.tool_calls[0].function.name,
      parameters: Object.entries(toolArgs).map(([key, value]) => ({
        parameterName: key,
        parameterValue: value,
      })),
    };
  }
}

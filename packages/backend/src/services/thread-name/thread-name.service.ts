import { ThreadMessage } from "@tambo-ai-cloud/core";
import { ChatCompletionTool, FunctionParameters } from "openai/resources/index";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { threadMessagesToChatCompletionMessageParam } from "../../util/thread-message-conversion";
import { LLMClient, LLMResponse } from "../llm/llm-client";

const nameLengthLimit = 20;
export const threadNameTool: ChatCompletionTool = {
  type: "function",
  function: {
    name: "generate_thread_name",
    description:
      "Generate a name for the thread which summarizes the conversation and can be used to identify the thread.",
    strict: true,
    parameters: zodToJsonSchema(
      z.object({
        name: z.string().describe(`The name for the thread.
            It should be no more than ${nameLengthLimit} characters.
            Do not include any other text than the name, and do not include quotes.`),
      }),
    ) as FunctionParameters,
  },
};

export async function generateThreadName(
  llmClient: LLMClient,
  messages: ThreadMessage[],
) {
  const chatCompletionMessages =
    threadMessagesToChatCompletionMessageParam(messages);
  const response = await llmClient.complete({
    messages: chatCompletionMessages,
    promptTemplateName: "thread-name-generation",
    promptTemplateParams: {},
    tools: [threadNameTool],
    tool_choice: {
      type: "function",
      function: {
        name: "generate_thread_name",
      },
    },
    stream: false,
  });

  return await extractThreadName(response);
}

async function extractThreadName(response: LLMResponse) {
  const extractedName = response.message.tool_calls?.[0].function.arguments;
  if (!extractedName) {
    throw new Error("Thread name could not be extracted from response");
  }
  const parsedName = JSON.parse(extractedName);
  return parsedName.name;
}

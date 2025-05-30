import { objectTemplate } from "@libretto/openai";
import {
  ChatCompletionMessageParam,
  ThreadMessage,
} from "@tambo-ai-cloud/core";
import { threadMessagesToChatCompletionMessageParam } from "../../util/thread-message-conversion";
import { getLLMResponseMessage, LLMClient } from "../llm/llm-client";

const nameLengthLimit = 20;
const systemPrompt = `
You are a machine that generates a name for a thread.

The name should be a short, descriptive phrase that captures the essence of the thread.

the name should be no more than ${nameLengthLimit} characters
`;

const finalPrompt = `Please generate a name for the thread.`;

export async function generateThreadName(
  llmClient: LLMClient,
  messages: ThreadMessage[],
) {
  const chatCompletionMessages =
    threadMessagesToChatCompletionMessageParam(messages);
  const promptMessages = objectTemplate<ChatCompletionMessageParam[]>([
    { role: "system", content: systemPrompt },
    ...chatCompletionMessages,
    { role: "user", content: finalPrompt },
  ]);
  const response = await llmClient.complete({
    messages: promptMessages,
    promptTemplateName: "suggestion-generation",
    promptTemplateParams: {},
    tools: [],
    stream: false,
  });

  const extractedResponse = getLLMResponseMessage(response);
  console.log(extractedResponse);
  return "Test name";
}

import { LegacyComponentDecision, ThreadMessage } from "@tambo-ai-cloud/core";
import OpenAI from "openai";
import { threadMessagesToChatCompletionMessageParam } from "../../util/thread-message-conversion";
import { AgentClient } from "../llm/agent-client";

export async function* runAgentLoop(
  agentClient: AgentClient,
  messages: ThreadMessage[],
  strictTools: OpenAI.Chat.Completions.ChatCompletionTool[],
  //   customInstructions: string | undefined,
): AsyncIterableIterator<LegacyComponentDecision> {
  const chatCompletionMessages =
    threadMessagesToChatCompletionMessageParam(messages);
  // const systemPromptArgs = customInstructions
  //     ? { custom_instructions: customInstructions }
  //     : {};

  const stream = agentClient.streamRunAgent({
    messages: chatCompletionMessages,
    tools: strictTools,
    // promptTemplateName: "decision-loop",
    // promptTemplateParams: {
    //   chat_history: chatCompletionMessages,
    //   ...systemPromptArgs,
    // },
  });
  for await (const event of stream) {
    yield {
      id: event.message.id,
      message: event.message.content || "",
      componentName: null,
      props: null,
      componentState: null,
      reasoning: "",
      statusMessage: "",
      completionStatusMessage: "",
      toolCallRequest: undefined,
      toolCallId: undefined,
    };
  }
}

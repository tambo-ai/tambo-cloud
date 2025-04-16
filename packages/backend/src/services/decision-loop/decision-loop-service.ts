import { objectTemplate } from "@libretto/openai";
import {
  ChatCompletionMessageParam,
  LegacyComponentDecision,
  ThreadMessage,
} from "@tambo-ai-cloud/core";
import { AvailableComponent } from "../../model/component-metadata";
import { generateDecisionLoopPrompt } from "../../prompt/decision-loop-prompts";
import { SystemTools } from "../../systemTools";
import { extractMessageContent } from "../../util/response-parsing";
import { threadMessagesToChatHistory } from "../../util/threadMessagesToChatHistory";
import { getLLMResponseToolCallRequest, LLMClient } from "../llm/llm-client";
import {
  addParametersToTools,
  convertComponentsToUITools,
  convertMetadataToTools,
  standardToolParameters,
} from "../tool/tool-service";
export async function* runDecisionLoop(
  llmClient: LLMClient,
  messageHistory: ThreadMessage[],
  availableComponents: AvailableComponent[],
  stream: boolean,
  systemTools: SystemTools | undefined,
  uiToolNamePrefix: string = "show_",
): AsyncIterableIterator<LegacyComponentDecision> {
  const componentTools = convertComponentsToUITools(
    availableComponents,
    uiToolNamePrefix,
  );
  const contextTools = convertMetadataToTools(
    availableComponents.flatMap((component) => component.contextTools),
  );
  const tools = [...componentTools, ...contextTools];
  // Add standard parameters to all tools
  const toolsWithStandardParameters = addParametersToTools(
    tools,
    standardToolParameters,
  );

  const { template: systemPrompt } = generateDecisionLoopPrompt();
  const chatHistory = threadMessagesToChatHistory(messageHistory);
  const promptMessages = objectTemplate<ChatCompletionMessageParam[]>([
    { role: "system", content: systemPrompt },
    { role: "chat_history" as "user", content: "{chat_history}" },
  ]);
  const response = await llmClient.complete({
    messages: promptMessages,
    tools: [...toolsWithStandardParameters, ...(systemTools?.tools ?? [])],
    promptTemplateName: "decision-loop",
    promptTemplateParams: {
      chat_history: chatHistory,
    },
  });

  console.log("stream", stream);
  console.log(response);

  const toolCall = response.message?.tool_calls?.[0];
  if (toolCall) {
    console.log("toolCall", JSON.stringify(toolCall));
  }
  const isUITool =
    toolCall &&
    componentTools.some(
      (tool) => tool.function.name === toolCall.function.name,
    );
  const toolArgs = toolCall ? JSON.parse(toolCall.function.arguments) : {};

  const decision: LegacyComponentDecision = {
    reasoning: "",
    message: extractMessageContent(
      response.message?.content?.trim() || toolArgs.displayMessage || "",
      false,
    ),
    componentName: isUITool
      ? toolCall?.function.name.replace(uiToolNamePrefix, "")
      : "",
    props: isUITool ? toolArgs : null,
    componentState: null,
    toolCallRequest:
      !isUITool && toolCall
        ? getLLMResponseToolCallRequest(response)
        : undefined,
  };

  console.log("decision", decision);

  yield decision;
}

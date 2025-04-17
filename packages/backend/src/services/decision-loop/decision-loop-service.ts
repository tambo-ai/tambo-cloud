import { objectTemplate } from "@libretto/openai";
import {
  ChatCompletionMessageParam,
  LegacyComponentDecision,
  ThreadMessage,
  tryParseJsonObject,
} from "@tambo-ai-cloud/core";
import { parse } from "partial-json";
import { AvailableComponent } from "../../model/component-metadata";
import { generateDecisionLoopPrompt } from "../../prompt/decision-loop-prompts";
import { SystemTools } from "../../systemTools";
import { extractMessageContent } from "../../util/response-parsing";
import { threadMessagesToChatHistory } from "../../util/threadMessagesToChatHistory";
import {
  getLLMResponseMessage,
  getLLMResponseToolCallId,
  getLLMResponseToolCallRequest,
  LLMClient,
} from "../llm/llm-client";
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

  const responseStream = await llmClient.complete({
    messages: promptMessages,
    tools: [...toolsWithStandardParameters, ...(systemTools?.tools ?? [])],
    promptTemplateName: "decision-loop",
    promptTemplateParams: {
      chat_history: chatHistory,
    },
    stream: true,
  });

  const initialDecision: LegacyComponentDecision = {
    reasoning: "",
    message: "",
    componentName: "",
    props: null,
    componentState: null,
    toolCallRequest: undefined,
    toolCallId: undefined,
  };

  let accumulatedDecision = initialDecision;

  for await (const chunk of responseStream) {
    try {
      const message = getLLMResponseMessage(chunk) || "";
      const toolCall = chunk.message?.tool_calls?.[0];

      // Check if this is a UI tool call
      const isUITool =
        toolCall &&
        componentTools.some(
          (tool) => tool.function.name === toolCall.function.name,
        );

      let toolArgs = {};
      if (toolCall) {
        try {
          //partial parse tool params to allow streaming in-progress params
          toolArgs = parse(toolCall.function.arguments);
        } catch (_e) {
          // Ignore parse errors for incomplete JSON
        }
      }

      let hasCompleteToolCall = true;
      if (!isUITool && toolCall) {
        // If this is a non-UI tool call, make sure the params are complete
        const parsedToolCall = tryParseJsonObject(
          toolCall.function.arguments,
          false,
        );
        if (!parsedToolCall) {
          hasCompleteToolCall = false;
        }
      }

      const parsedChunk = {
        message: extractMessageContent(
          message?.length > 0
            ? message.trim()
            : (toolArgs as any).displayMessage || "",
          false,
        ), // use content if it exists, or displayMessage from the toolcall if it doesn't, since sometimes a toolcall request won't include content
        componentName: isUITool
          ? toolCall?.function.name.replace(uiToolNamePrefix, "")
          : "",
        props: isUITool ? toolArgs : null,
        toolCallRequest:
          !isUITool && toolCall && hasCompleteToolCall
            ? getLLMResponseToolCallRequest(chunk)
            : undefined,
        toolCallId: getLLMResponseToolCallId(chunk),
      };

      accumulatedDecision = {
        ...accumulatedDecision,
        ...parsedChunk,
      };

      yield accumulatedDecision;
    } catch (e) {
      console.error("Error parsing stream chunk:", e);
    }
  }
}

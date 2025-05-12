import { ThreadMessage, tryParseJsonObject } from "@tambo-ai-cloud/core";
import { AvailableComponent } from "../../model";
import { buildSuggestionPrompt } from "../../prompt/suggestion-generator";
import { LLMClient } from "../llm/llm-client";
import { suggestionsResponseTool } from "../tool/tool-service";
import {
  SuggestionDecision,
  SuggestionsResponseSchema,
} from "./suggestion.types";

// Public function
export async function generateSuggestions(
  llmClient: LLMClient,
  messageHistory: ThreadMessage[],
  availableComponents: AvailableComponent[],
  count: number,
  threadId: string,
  stream?: boolean,
): Promise<SuggestionDecision | AsyncIterableIterator<SuggestionDecision>> {
  const messages = buildSuggestionPrompt(
    availableComponents,
    messageHistory,
    count,
  );

  if (stream) {
    throw new Error("Streaming is not supported yet");
  }

  try {
    const response = await llmClient.complete({
      messages,
      promptTemplateName: "suggestion-generation",
      promptTemplateParams: {},
      tools: [suggestionsResponseTool],
      tool_choice: {
        type: "function",
        function: { name: "generate_suggestions" },
      },
    });

    // Handle tool call in the response
    const toolCall = response.message.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "generate_suggestions") {
      console.warn("No valid tool call received from LLM");
      return {
        suggestions: [],
        message: "No suggestions could be generated at this time.",
        threadId,
      };
    }

    // Parse the tool call arguments
    const args = tryParseJsonObject(toolCall.function.arguments, false);
    if (!args) {
      console.error("Failed to parse suggestion tool call arguments");
      return {
        suggestions: [],
        message: "Invalid suggestion format received.",
        threadId,
      };
    }

    // Validate against our schema
    const parsed = SuggestionsResponseSchema.safeParse(args);
    if (!parsed.success) {
      console.error("Failed to validate suggestions:", parsed.error);
      return {
        suggestions: [],
        message: "Invalid suggestion format received.",
        threadId,
      };
    }

    return {
      suggestions: parsed.data.suggestions,
      message: parsed.data.reflection,
      threadId,
    };
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return {
      suggestions: [],
      message: "Failed to process suggestions.",
      threadId,
    };
  }
}

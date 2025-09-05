import {
  FunctionParameters,
  getToolName,
  ThreadMessage,
  tryParseJsonObject,
} from "@tambo-ai-cloud/core";
import OpenAI from "openai";
import zodToJsonSchema from "zod-to-json-schema";
import { AvailableComponent } from "../../model";
import { buildSuggestionPrompt } from "../../prompt/suggestion-generator";
import { AIProviderClient } from "../llm/ai-provider-client";
import {
  SuggestionDecision,
  SuggestionsResponseSchema,
} from "./suggestion.types";

// Tool for Suggestion Generation
export const suggestionsResponseTool: OpenAI.Chat.Completions.ChatCompletionTool =
  {
    type: "function",
    function: {
      name: "generate_suggestions",
      description:
        "Generate suggestions for the user based on the available components and context.",
      strict: true,
      parameters: zodToJsonSchema(
        SuggestionsResponseSchema,
      ) as FunctionParameters,
    },
  };

// Public function
export async function generateSuggestions(
  aiClient: AIProviderClient,
  messages: ThreadMessage[],
  availableComponents: AvailableComponent[],
  count: number,
  threadId: string,
  stream?: boolean,
): Promise<SuggestionDecision | AsyncIterableIterator<SuggestionDecision>> {
  const suggestionMessages = buildSuggestionPrompt(
    availableComponents,
    messages,
    count,
  );

  if (stream) {
    throw new Error("Streaming is not supported yet");
  }

  try {
    const response = await aiClient.complete({
      messages:
        suggestionMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      promptTemplateName: "suggestion-generation",
      promptTemplateParams: {},
      tools: [suggestionsResponseTool],
      tool_choice: {
        type: "function",
        function: { name: "generate_suggestions" },
      },
      // Make sure that the suggestions are not mixed up with other chains
      chainId: `${aiClient.chainId}-suggestions`,
    });

    // Handle tool call in the response
    const toolCall = response.message.tool_calls?.[0];
    if (
      toolCall?.type !== "function" ||
      getToolName(toolCall) !== "generate_suggestions"
    ) {
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

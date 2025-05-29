import { ThreadMessage, ToolCallRequest } from "@tambo-ai-cloud/core";

/**
 * The maximum number of identical tool calls we will make. This is to prevent
 * infinite loops.
 */
const MAX_IDENTICAL_TOOL_CALLS = 3;

/**
 * The maximum total number of tool calls we will make. This is to prevent
 * infinite loops.
 */
const MAX_TOTAL_TOOL_CALLS = 10;

/**
 * Creates a unique signature for a tool call request for tracking purposes.
 * Excludes the tool_call_id as it's not part of the actual tool call logic.
 */
function createToolCallSignature(toolCallRequest: ToolCallRequest): string {
  const sortedParams = toolCallRequest.parameters
    .map(({ parameterName, parameterValue }) => ({
      parameterName,
      parameterValue,
    }))
    .sort((a, b) => a.parameterName.localeCompare(b.parameterName));

  // TODO: deal with order of keys if data within the parameters themselves are objects
  return JSON.stringify({
    toolName: toolCallRequest.toolName,
    parameters: sortedParams,
  });
}

/**
 * Validates tool call limits to prevent infinite loops.
 * @param finalThreadMessage - The final thread message that will be added to the thread
 * @param messages - All messages in the thread (usually from the db)
 * @param currentToolCounts - Dictionary mapping tool call signatures to their counts, within the current request
 * @param newToolCallRequest - The new tool call request to validate
 * @returns An error message if limits are exceeded, undefined if valid
 */
export function validateToolCallLimits(
  finalThreadMessage: ThreadMessage,
  messages: ThreadMessage[],
  currentToolCounts: Record<string, number>,
  newToolCallRequest: ToolCallRequest,
): string | undefined {
  // Handle cases where tool calls are happening across requests - like we're
  // bouncing to the browser to make tool calls multiple times in a row
  if (isIdenticalToolLoop(finalThreadMessage, messages)) {
    return `I've detected that I'm making the same tool call repeatedly (${newToolCallRequest.toolName}). This suggests I'm stuck in a loop. Please try a different approach or contact support if this persists.`;
  }

  const totalCalls = Object.values(currentToolCounts).reduce(
    (sum, count) => sum + count,
    0,
  );

  if (totalCalls >= MAX_TOTAL_TOOL_CALLS) {
    return `I've reached the maximum number of tool calls (${MAX_TOTAL_TOOL_CALLS}). This usually indicates I'm stuck in a loop. Please try a different approach or contact support if this persists.`;
  }

  const signature = createToolCallSignature(newToolCallRequest);
  const currentCount = currentToolCounts[signature] || 0;

  if (currentCount >= MAX_IDENTICAL_TOOL_CALLS) {
    return `I've detected that I'm making the same tool call repeatedly (${newToolCallRequest.toolName}). This suggests I'm stuck in a loop. Please try a different approach or contact support if this persists.`;
  }

  return undefined;
}

/**
 * Updates the tool call counts with a new tool call request.
 * @param toolCallCounts - Current tool call counts
 * @param toolCallRequest - The tool call request to add
 * @returns Updated tool call counts
 */
export function updateToolCallCounts(
  toolCallCounts: Record<string, number>,
  toolCallRequest: ToolCallRequest,
): Record<string, number> {
  const signature = createToolCallSignature(toolCallRequest);
  return {
    ...toolCallCounts,
    [signature]: (toolCallCounts[signature] || 0) + 1,
  };
}

/**
 * Check if we are in an identical tool loop.
 * @param responseToCaller - The response message to the caller.
 * @param previousMessages - The messages in the thread.
 * @returns True if we are in an identical tool loop.
 */
function isIdenticalToolLoop(
  responseToCaller: ThreadMessage,
  previousMessages: ThreadMessage[],
): boolean {
  // Only check for loops if there's a tool call request
  if (!responseToCaller.toolCallRequest?.toolName) {
    return false;
  }
  let identicalToolCallCount = 0;

  const responseToCallerSignature = createToolCallSignature(
    responseToCaller.toolCallRequest,
  );
  // Loop backwards through messages
  for (let i = previousMessages.length - 2; i >= 0; i--) {
    const message = previousMessages[i];

    // If we hit a message without a tool call, we can stop checking
    if (!message.tool_call_id || !message.toolCallRequest) {
      return false;
    }
    const messageSignature = createToolCallSignature(message.toolCallRequest);

    if (
      message.role === "assistant" &&
      messageSignature === responseToCallerSignature
    ) {
      identicalToolCallCount++;
      if (identicalToolCallCount >= MAX_IDENTICAL_TOOL_CALLS - 1) {
        return true;
      }
    }
  }
  return false;
}

"use client";

import {
  formatToolParameters,
  formatToolResponseContent,
} from "@/components/observability/utils";
import { Card } from "@/components/ui/card";
import { markdownComponents } from "@/components/ui/tambo/markdown-components";
import { getSafeContent } from "@/lib/thread-hooks";
import { api } from "@/trpc/react";
import { type TamboThreadMessage } from "@tambo-ai/react";
import { Streamdown } from "streamdown";
import { z } from "zod";

/**
 * Self-contained component that fetches and displays recent messages from a thread.
 */

interface ThreadMessagesInlineProps {
  projectId: string;
  threadId: string;
  maxMessages?: number;
}

export const ThreadMessagesInlineSchema = z.object({
  projectId: z
    .string()
    .describe(
      "The ID of the project to fetch thread messages for. This must be a valid project ID (UUID format), NOT a project name.",
    ),
  threadId: z
    .string()
    .describe(
      "The ID of the thread to display messages from. Use fetchProjectThreads to get thread IDs.",
    ),
  maxMessages: z
    .number()
    .optional()
    .default(3)
    .describe(
      "Maximum number of recent messages to display (default: 3, max: 10)",
    ),
});

export function ThreadMessagesInline({
  projectId,
  threadId,
  maxMessages = 3,
}: ThreadMessagesInlineProps) {
  // Validate inputs before attempting to fetch
  const isValidThreadId =
    threadId &&
    threadId.length > 5 &&
    threadId.includes(".") &&
    !threadId.endsWith(".");
  const isValidProjectId = projectId && projectId.length > 5;

  // Show loading state for invalid inputs (assistant may still be fetching IDs)
  if (!isValidProjectId || !isValidThreadId) {
    return (
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <div>
            <p className="text-sm font-medium text-blue-700">
              Preparing to load messages...
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Waiting for valid {!isValidProjectId && "project ID"}
              {!isValidProjectId && !isValidThreadId && " and "}
              {!isValidThreadId && "thread ID"}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Fetch thread data
  const {
    data: thread,
    isLoading,
    isError,
    error,
  } = api.thread.getThread.useQuery(
    {
      projectId,
      threadId,
      includeInternal: false,
    },
    {
      enabled: isValidProjectId && isValidThreadId,
      retry: false,
      staleTime: 0,
      refetchOnWindowFocus: false,
    },
  );

  if (isLoading) {
    return (
      <Card className="p-4">
        <p className="text-sm text-gray-600">Loading messages...</p>
      </Card>
    );
  }

  if (isError || !thread) {
    return (
      <Card className="p-4 border-red-200 bg-red-50">
        <p className="text-sm font-medium text-red-700 mb-1">
          Failed to load thread
        </p>
        <p className="text-xs text-red-600">
          {error?.message || "Thread not found"}
        </p>
        <div className="text-xs text-gray-600 mt-2">
          <p>Thread ID: {threadId}</p>
          <p>Project ID: {projectId}</p>
        </div>
      </Card>
    );
  }

  const messages = thread.messages || [];
  const displayMessages = messages.slice(-Math.min(maxMessages, 10));
  const hasMoreMessages = messages.length > displayMessages.length;

  // Helper to find tool response for a tool call
  const findToolResponse = (toolCallId: string | undefined) => {
    if (!toolCallId) return null;
    return messages.find(
      (msg) => msg.role === "tool" && msg.toolCallId === toolCallId,
    );
  };

  return (
    <div className="space-y-4">
      {/* Thread Header */}
      <Card className="p-4 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg mb-1 text-gray-900">
              {thread.name || "Unnamed Thread"}
            </h3>
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <span className="font-medium text-blue-600">
                  {messages.length}
                </span>
                message{messages.length !== 1 ? "s" : ""}
              </span>
              <span className="text-gray-400">•</span>
              <span className="font-mono text-gray-500">
                {threadId.slice(0, 12)}...
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Messages Container - Scrollable */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-[500px] overflow-y-auto scroll-smooth shadow-inner">
        {/* Message count indicator */}
        {hasMoreMessages && (
          <div className="mb-4 text-center">
            <span className="inline-block px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-full shadow-sm">
              Showing last {displayMessages.length} of {messages.length}{" "}
              messages
            </span>
          </div>
        )}

        <div className="space-y-3">
          {displayMessages
            .filter((message) => message.role !== "tool")
            .map((message) => {
              const isUser = message.role === "user";
              const safeContent = getSafeContent(
                message.content as TamboThreadMessage["content"],
              );
              let contentText =
                typeof safeContent === "string" ? safeContent : "No content";

              // Truncate very long messages to prevent rendering issues
              const MAX_LENGTH = 1000;
              const isTruncated = contentText.length > MAX_LENGTH;
              if (isTruncated) {
                contentText = contentText.slice(0, MAX_LENGTH);
              }

              // Tool call information
              const toolCallRequest = message.toolCallRequest;
              const toolResponse = message.toolCallId
                ? findToolResponse(message.toolCallId)
                : null;

              return (
                <Card
                  key={message.id}
                  className={`p-4 transition-all duration-200 hover:shadow-md ${
                    isUser
                      ? "bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-300 shadow-sm"
                      : "bg-white border-gray-200 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        {isUser ? "User" : "Assistant"}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 font-mono">
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="text-sm leading-relaxed text-gray-800">
                    <Streamdown components={markdownComponents}>
                      {contentText}
                    </Streamdown>
                    {isTruncated && (
                      <div className="mt-3 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500 italic flex items-center gap-1">
                          <span>
                            Message truncated, showing first {MAX_LENGTH}{" "}
                            characters
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Tool Call Details */}
                  {toolCallRequest && (
                    <div className="mt-4 space-y-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-2 py-1 bg-blue-100 border border-blue-300 rounded-md">
                          <span className="text-xs font-semibold text-blue-700">
                            Tool Call
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {toolCallRequest.toolName}
                        </span>
                      </div>

                      {/* Arguments */}
                      {toolCallRequest.parameters &&
                        toolCallRequest.parameters.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-semibold text-gray-700">
                                Arguments
                              </span>
                            </div>
                            <pre className="text-xs font-mono text-gray-700 overflow-auto max-h-40 bg-white p-2 rounded border border-gray-200">
                              {formatToolParameters(toolCallRequest.parameters)}
                            </pre>
                          </div>
                        )}

                      {/* Response */}
                      {toolResponse && (
                        <div
                          className={`rounded-lg p-3 border ${
                            toolResponse.error
                              ? "bg-red-50 border-red-300"
                              : "bg-green-50 border-green-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`text-xs font-semibold ${
                                toolResponse.error
                                  ? "text-red-700"
                                  : "text-green-700"
                              }`}
                            >
                              {toolResponse.error ? "Error" : "Response"}
                            </span>
                          </div>
                          <pre
                            className={`text-xs font-mono overflow-auto max-h-40 p-2 rounded border ${
                              toolResponse.error
                                ? "bg-white text-red-800 border-red-200"
                                : "bg-white text-green-800 border-green-200"
                            }`}
                          >
                            {formatToolResponseContent(toolResponse.content)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {message.componentDecision?.componentName && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="inline-flex items-center gap-2 px-2 py-1 bg-purple-100 border border-purple-300 rounded-md">
                        <span className="text-xs font-semibold text-purple-700">
                          Component
                        </span>
                        <span className="text-xs text-purple-600">
                          {message.componentDecision.componentName}
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
        </div>
      </div>
    </div>
  );
}

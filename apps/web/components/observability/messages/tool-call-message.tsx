import { cn } from "@/lib/utils";
import { type RouterOutputs } from "@/trpc/react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Copy,
  Settings,
  XCircle,
} from "lucide-react";
import { memo, useState } from "react";
import { formatTime } from "../utils";

type ThreadType = RouterOutputs["thread"]["getThread"];
type MessageType = ThreadType["messages"][0];

interface ToolCallMessageProps {
  message: MessageType;
  toolResponse?: MessageType;
  isHighlighted?: boolean;
  copiedId: string | null;
  onCopyId: (id: string) => void;
}

export const ToolCallMessage = memo(
  ({
    message,
    toolResponse,
    isHighlighted = false,
    copiedId,
    onCopyId,
  }: ToolCallMessageProps) => {
    const [showArguments, setShowArguments] = useState(false);
    const [showResponse, setShowResponse] = useState(false);

    const toolName = message.toolCallRequest?.toolName || "Unknown Tool";
    const parameters = message.toolCallRequest?.parameters || [];

    // Check for errors
    const hasToolCallError = message.error;
    const hasToolResponseError =
      toolResponse?.actionType === "tool_response" && toolResponse?.error;
    const hasAnyError = hasToolCallError || hasToolResponseError;

    const formatAllParameters = () => {
      if (parameters.length === 0) return "{}";

      const paramObj: Record<string, any> = {};
      parameters.forEach(
        (param: { parameterName: string; parameterValue: string }) => {
          try {
            // Try to parse the parameter value if it's a string
            if (typeof param.parameterValue === "string") {
              try {
                paramObj[param.parameterName] = JSON.parse(
                  param.parameterValue,
                );
              } catch {
                paramObj[param.parameterName] = param.parameterValue;
              }
            } else {
              paramObj[param.parameterName] = param.parameterValue;
            }
          } catch {
            paramObj[param.parameterName] = param.parameterValue;
          }
        },
      );

      return JSON.stringify(paramObj, null, 2);
    };

    const formatResponseContent = (content: any) => {
      try {
        // If content is already a string, try to parse it first
        if (typeof content === "string") {
          try {
            const parsed = JSON.parse(content);
            return JSON.stringify(parsed, null, 2);
          } catch {
            // If it's not valid JSON, return as is
            return content;
          }
        }
        // If it's already an object, stringify it
        return JSON.stringify(content, null, 2);
      } catch {
        return String(content);
      }
    };

    return (
      <>
        {/* Top metadata bar */}
        <motion.div
          className="flex items-center gap-3 mb-3 px-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{formatTime(message.createdAt)}</span>
          </div>
        </motion.div>

        {/* Tool Call Message bubble */}
        <motion.div
          className="relative max-w-[85%] min-w-[200px] transition-all duration-300 group-hover:shadow-lg rounded-2xl"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div
            className={cn(
              "rounded-2xl p-5 shadow-sm border backdrop-blur-sm",
              "bg-muted/20 text-foreground text-sm border-border",
              isHighlighted && "ring-2 ring-muted-foreground/50 ring-inset",
              hasAnyError && "border-red-200 bg-red-50/50",
            )}
          >
            <div className="flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-center gap-2">
                {hasAnyError ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <Settings className="h-4 w-4 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    "text-sm font-semibold",
                    hasAnyError && "text-red-700",
                  )}
                >
                  Tool Call: {toolName}
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <span
                    className="text-xs text-muted-foreground font-mono bg-muted/50 rounded-md px-2 py-1 flex items-center gap-1 cursor-pointer"
                    onClick={() => onCopyId(message.toolCallId || "")}
                  >
                    {message.toolCallId}
                    {copiedId === message.toolCallId ? (
                      <Check className="h-3 w-3 ml-1 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3 ml-1 opacity-50" />
                    )}
                  </span>
                </div>
              </div>

              {/* View Arguments Dropdown */}
              <div className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowArguments(!showArguments)}
                  className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium text-sm">View Arguments</span>
                  <div className="flex items-center gap-2">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyId(`args-${message.id}`);
                      }}
                      className="h-6 w-6 p-0 flex items-center justify-center cursor-pointer hover:bg-muted rounded-sm transition-colors"
                    >
                      {copiedId === `args-${message.id}` ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        showArguments && "rotate-180",
                      )}
                    />
                  </div>
                </button>

                <motion.div
                  initial={false}
                  animate={{
                    height: showArguments ? "auto" : 0,
                    opacity: showArguments ? 1 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-background">
                    <pre className="text-xs font-mono text-muted-foreground overflow-auto">
                      <code>{formatAllParameters()}</code>
                    </pre>
                  </div>
                </motion.div>
              </div>

              {/* View Response Dropdown */}
              {toolResponse && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowResponse(!showResponse)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors",
                      hasToolResponseError && "bg-red-50 border-red-200",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">View Response</span>
                      {hasToolResponseError && (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          onCopyId(`response-${toolResponse.id}`);
                        }}
                        className="h-6 w-6 p-0 flex items-center justify-center cursor-pointer hover:bg-muted rounded-sm transition-colors"
                      >
                        {copiedId === `response-${toolResponse.id}` ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          showResponse && "rotate-180",
                        )}
                      />
                    </div>
                  </button>

                  <motion.div
                    initial={false}
                    animate={{
                      height: showResponse ? "auto" : 0,
                      opacity: showResponse ? 1 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-background max-h-96 overflow-auto">
                      {/* Error Display for Tool Response */}
                      {hasToolResponseError && (
                        <motion.div
                          className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className="flex items-center gap-2 text-red-700">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">
                              Tool Response Error
                            </span>
                          </div>
                          <p className="text-red-600 text-sm mt-1">
                            {toolResponse.error}
                          </p>
                        </motion.div>
                      )}

                      <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-words overflow-auto">
                        <code>
                          {formatResponseContent(toolResponse.content)}
                        </code>
                      </pre>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Bottom metadata */}
        <motion.div
          className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground px-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <span
            className="font-medium flex items-center gap-1 cursor-pointer bg-muted/50 rounded-md px-2 py-1"
            onClick={() => onCopyId(message.id)}
          >
            {message.id}
            {copiedId === message.id ? (
              <Check className="h-3 w-3 ml-1 text-green-500" />
            ) : (
              <Copy className="h-3 w-3 ml-1 opacity-50" />
            )}
          </span>
        </motion.div>
      </>
    );
  },
);

ToolCallMessage.displayName = "ToolCallMessage";

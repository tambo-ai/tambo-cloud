import { createMarkdownComponents } from "@/components/ui/tambo/markdownComponents";
import { getSafeContent } from "@/lib/thread-hooks";
import { cn } from "@/lib/utils";
import { type RouterOutputs } from "@/trpc/react";
import { motion } from "framer-motion";
import { AlertCircle, Check, Copy } from "lucide-react";
import { isValidElement, memo, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { formatTime } from "../utils";
import { SuggestedActions, ToolCallCode } from "./message-badges";

type ThreadType = RouterOutputs["thread"]["getThread"];
type MessageType = ThreadType["messages"][0];

interface MessageContentProps {
  message: MessageType;
  isUserMessage: boolean;
  isHighlighted?: boolean;
}

interface MessageContentComponentProps extends MessageContentProps {
  copiedId: string | null;
  onCopyId: (id: string) => void;
}

export const MessageContent = memo(
  ({
    message,
    isUserMessage,
    isHighlighted = false,
    copiedId,
    onCopyId,
  }: MessageContentComponentProps) => {
    const isToolResponseError =
      message.actionType === "tool_response" && message.error;
    const safeContent = getSafeContent(message.content as ReactNode);

    return (
      <>
        {/* Top metadata bar */}
        <motion.div
          className={cn(
            "flex items-center gap-3 mb-3 px-1",
            isUserMessage ? "flex-row-reverse" : "flex-row",
          )}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{formatTime(message.createdAt)}</span>
          </div>
        </motion.div>

        {/* Message bubble */}
        <motion.div
          className={cn(
            "relative max-w-[85%] min-w-[200px] transition-all duration-300 group-hover:shadow-lg",
          )}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div
            className={cn(
              "rounded-2xl p-5 shadow-sm border backdrop-blur-sm",
              "bg-transparent text-foreground text-sm border-border rounded-md",
              isHighlighted && "ring-2 ring-muted-foreground/50 ring-inset",
            )}
          >
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground/50">
                {message.role}
              </span>
              {/* Main content */}
              <div className="text-foreground">
                {message.actionType === "tool_response" ? (
                  <motion.pre
                    className={cn(
                      "max-h-[400px] max-w-full overflow-auto rounded-lg p-4 text-xs font-mono border",
                      "bg-muted/50 border-border text-muted-foreground",
                    )}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {JSON.stringify(message.content, null, 2)}
                  </motion.pre>
                ) : typeof safeContent === "string" && safeContent ? (
                  <ReactMarkdown components={createMarkdownComponents()}>
                    {safeContent}
                  </ReactMarkdown>
                ) : isValidElement(safeContent) ? (
                  safeContent
                ) : (
                  <span>No content</span>
                )}
              </div>

              {/* Component decision */}
              {message.componentDecision?.componentName && (
                <motion.div
                  className={cn(
                    "text-xs p-3 rounded-lg border font-mono",
                    "bg-muted/50 border-border text-muted-foreground",
                  )}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <code>
                    &lt;{message.componentDecision.componentName}
                    {message.componentDecision.props &&
                      ` ${Object.keys(message.componentDecision.props)
                        .map((key) => `${key}={...}`)
                        .join(" ")}`}{" "}
                    /&gt;
                  </code>
                </motion.div>
              )}

              {/* Tool call code */}
              {message.toolCallRequest && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <ToolCallCode
                    toolName={message.toolCallRequest.toolName}
                    parameters={message.toolCallRequest.parameters}
                  />
                </motion.div>
              )}

              {/* Suggested actions */}
              {!!message.suggestedActions.length && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <SuggestedActions actions={message.suggestedActions} />
                </motion.div>
              )}

              {isToolResponseError && (
                <motion.div
                  className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Tool Error</span>
                  </div>
                  <p className="text-red-600 text-sm mt-1">{message.error}</p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Bottom metadata */}
        <motion.div
          className={cn(
            "flex items-center gap-2 mt-2 text-[11px] text-muted-foreground px-1",
            isUserMessage ? "flex-row-reverse" : "flex-row",
          )}
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
MessageContent.displayName = "MessageContent";

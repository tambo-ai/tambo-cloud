import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Bot,
  Check,
  Clock,
  Copy,
  Hash,
  Settings,
  User,
} from "lucide-react";
import { memo } from "react";
import { formatDate, formatTime } from "../utils";
import {
  ActionBadge,
  SuggestedActions,
  ToolCallBadge,
  ToolCallCode,
} from "./message-badges";
import { type RouterOutputs } from "@/trpc/react";

const getRoleIcon = (role: string) => {
  switch (role) {
    case "user":
      return <User className="h-3.5 w-3.5" />;
    case "assistant":
      return <Bot className="h-3.5 w-3.5" />;
    default:
      return <Settings className="h-3.5 w-3.5" />;
  }
};

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
  onToolCallHover: (id: string | null) => void;
}

export const MessageContent = memo(
  ({
    message,
    isUserMessage,
    isHighlighted = false,
    copiedId,
    onCopyId,
    onToolCallHover,
  }: MessageContentComponentProps) => {
    const isToolResponseError =
      message.actionType === "tool_response" && message.error;

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
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border",
              "bg-muted/50 text-muted-foreground border-border",
            )}
          >
            {getRoleIcon(message.role)}
            <span className="capitalize font-semibold">{message.role}</span>
            {message.actionType && <ActionBadge type={message.actionType} />}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md">
              <Clock className="h-3 w-3" />
              <span className="font-mono">{formatTime(message.createdAt)}</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs hover:bg-muted/80 transition-colors"
              onClick={() => onCopyId(message.id)}
            >
              <Hash className="h-3 w-3 mr-1" />
              <span className="font-mono">
                {copiedId === message.id ? "Copied!" : message.id.slice(-8)}
              </span>
              {copiedId === message.id ? (
                <Check className="h-3 w-3 ml-1 text-green-500" />
              ) : (
                <Copy className="h-3 w-3 ml-1 opacity-50" />
              )}
            </Button>

            {message.toolCallId && (
              <ToolCallBadge
                id={message.toolCallId}
                onHover={onToolCallHover}
              />
            )}
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
              "bg-transparent text-foreground border-border rounded-md",
              isHighlighted && "ring-2 ring-muted-foreground/50 ring-inset",
            )}
          >
            <div className="flex flex-col gap-4">
              {/* Main content */}
              <div
                className={cn(
                  "whitespace-pre-wrap text-sm leading-relaxed",
                  "text-foreground",
                )}
              >
                {typeof message.content === "object" ? (
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
                ) : (
                  <span>{message.content}</span>
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
          <span className="font-medium">{formatDate(message.createdAt)}</span>
          <span className="w-1 h-1 bg-muted-foreground/50 rounded-full" />
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 text-[11px] hover:bg-muted/50 rounded-md transition-colors font-mono"
            onClick={() => onCopyId(message.id)}
          >
            {copiedId === message.id ? (
              <span className="text-green-600 flex items-center gap-1">
                <Check className="h-3 w-3" />
                Copied!
              </span>
            ) : (
              <span className="hover:text-foreground transition-colors">
                ID: {message.id}
              </span>
            )}
          </Button>
        </motion.div>
      </>
    );
  },
);
MessageContent.displayName = "MessageContent";

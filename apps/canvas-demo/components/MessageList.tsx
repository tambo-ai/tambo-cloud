import { Message } from "@/components/Message";
import type { ChatMessageProps } from "@/types/chat";
import { useRef, useEffect } from "react";
import { MessageLoading } from "@/components/MessageLoading";
import { EmptyState } from "@/components/EmptyState";
import { useChatStore } from "@/store/chatStore";
import { useActiveTab } from "@/contexts/ActiveTabContext";
import { cn } from "@/lib/utils";

export function MessageList({
  messages,
  isLoading,
}: {
  messages: ChatMessageProps[];
  isLoading?: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const setInput = useChatStore((state) => state.setInput);
  const { activeTab, setActiveTab } = useActiveTab();

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (containerRef.current) {
      const { scrollHeight, clientHeight } = containerRef.current;
      containerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isLoading]);

  useEffect(() => {
    scrollToBottom("instant");
  }, []);

  if (messages.length === 0 && !isLoading && activeTab === "chat") {
    return (
      <div className="h-full bg-background/50 backdrop-blur-sm">
        <EmptyState
          onAction={(action) => {
            setActiveTab("canvas");
            switch (action) {
              case "indicators":
                setInput("Show me the latest economic indicators");
                break;
              case "monetary":
                setInput("What is the current Federal Funds Rate?");
                break;
              case "banking":
                setInput("Show me bank lending rates over time");
                break;
              case "historical":
                setInput("Compare GDP growth across different decades");
                break;
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/30 transition-colors"
      >
        <div className="space-y-2 p-4">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={cn(
                "transition-all duration-200 ease-in-out",
                index === messages.length - 1 && "animate-fade-in"
              )}
            >
              <Message {...message} />
            </div>
          ))}
          {isLoading && (
            <div className="animate-fade-in">
              <MessageLoading />
            </div>
          )}
        </div>
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}

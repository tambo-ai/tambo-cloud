import { MessageList } from "@/components/MessageList";
import { ChatInput } from "@/components/ChatInput";
import { ChatSuggestions } from "@/components/ChatSuggestions";
import { useChatStore } from "@/store/chatStore";

export function Chat() {
  const messages = useChatStore((state) => state.messages);
  const isLoading = useChatStore((state) => state.isLoading);

  return (
    <div className="flex flex-col h-full bg-muted/50 relative">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-5 pointer-events-none" />
      <div className="flex-1 min-h-0 border-b relative">
        <MessageList messages={messages} isLoading={isLoading} />
      </div>
      <div className="flex-none bg-background p-4 border-t border-border/50 shadow-sm">
        <ChatSuggestions />
        <div className="mt-2">
          <ChatInput />
        </div>
      </div>
    </div>
  );
}

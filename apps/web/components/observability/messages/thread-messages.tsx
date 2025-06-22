import { getSafeContent } from "@/lib/thread-hooks";
import { cn } from "@/lib/utils";
import { type RouterOutputs } from "@/trpc/react";
import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, useCallback, useMemo, useState } from "react";
import { MessageContent } from "./message-content";

type ThreadType = RouterOutputs["thread"]["getThread"];
type MessageType = ThreadType["messages"][0];

interface ThreadMessagesProps {
  thread: ThreadType;
  searchQuery?: string;
  messageRefs?: React.MutableRefObject<Record<string, HTMLDivElement>>;
  highlightedMessageId?: string | null;
}

export function ThreadMessages({
  thread,
  searchQuery,
  messageRefs,
  highlightedMessageId,
}: Readonly<ThreadMessagesProps>) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = useCallback((id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const filteredMessages = useMemo(() => {
    const messages = thread.messages || [];
    let filtered = messages;

    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((msg: MessageType) => {
        const safeContent = getSafeContent(msg.content as ReactNode);
        const textContent = typeof safeContent === "string" ? safeContent : "";
        return textContent.toLowerCase().includes(query);
      });
    }

    return filtered;
  }, [thread.messages, searchQuery]);

  return (
    <div className="space-y-6 pb-4 px-2">
      <AnimatePresence initial={false}>
        {filteredMessages.map((message) => {
          const isUserMessage = message.role === "user";
          const isHighlighted = highlightedMessageId === message.id;

          return (
            <motion.div
              key={message.id}
              ref={(el) => {
                if (el && messageRefs) messageRefs.current[message.id] = el;
              }}
              initial={{ height: 0, opacity: 0, y: 20 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -20 }}
              transition={{
                duration: 0.3,
                ease: [0.4, 0.0, 0.2, 1],
                layout: { duration: 0.2 },
              }}
              className={cn(
                "group flex flex-col relative transition-all duration-300",
                isUserMessage ? "items-end" : "items-start",
                highlightedMessageId && "opacity-40 scale-[0.98]",
              )}
            >
              <MessageContent
                message={message}
                isUserMessage={isUserMessage}
                isHighlighted={isHighlighted}
                copiedId={copiedId}
                onCopyId={handleCopyId}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

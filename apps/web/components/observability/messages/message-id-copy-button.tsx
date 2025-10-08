import { useClipboard } from "@/hooks/use-clipboard";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";

interface MessageIdCopyButtonProps {
  messageId: string;
  isUserMessage?: boolean;
  className?: string;
}

export function MessageIdCopyButton({
  messageId,
  isUserMessage = false,
  className,
}: MessageIdCopyButtonProps) {
  const [copied, copy] = useClipboard(messageId);

  return (
    <motion.div
      className={cn(
        "flex items-center gap-2 mt-2 text-[10px] sm:text-[11px] text-foreground px-1",
        isUserMessage ? "flex-row-reverse" : "flex-row",
        className,
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
    >
      <span
        className="font-medium flex items-center gap-1 cursor-pointer bg-muted/50 rounded-md px-1.5 sm:px-2 py-0.5 sm:py-1"
        onClick={async () => await copy()}
      >
        <span className="max-w-[100px] sm:max-w-none truncate">
          {messageId}
        </span>
        {copied ? (
          <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 ml-1 text-green-500" />
        ) : (
          <Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3 ml-1 opacity-50" />
        )}
      </span>
    </motion.div>
  );
}

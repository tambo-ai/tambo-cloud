import { useCallback, useEffect, useState, memo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CornerUpLeft } from "lucide-react";
import { Spinner } from "./Spinner";
import { useChatStore } from "@/store/chatStore";
import { cn } from "@/lib/utils";
import { posthog } from "@/app/providers";
import {
  getTimeSinceLastMessage,
  getCompositionDuration,
  startCompositionTracking,
  resetCompositionTracking,
  recordMessageSent,
  recordMessageError,
  getSessionMetrics,
} from "@/lib/analytics";

const ANIMATION_DURATION = 1000; // ms
const COMPOSITION_TIMEOUT = 30000; // 30 seconds

const SubmitButton = memo(({ isLoading }: { isLoading: boolean }) => (
  <Button
    type="submit"
    size="icon"
    variant="ghost"
    disabled={isLoading}
    className="absolute right-2 top-1/2 -translate-y-1/2"
    aria-label={isLoading ? "Sending message..." : "Send message"}
  >
    {isLoading ? <Spinner /> : <CornerUpLeft className="h-4 w-4" />}
  </Button>
));
SubmitButton.displayName = "SubmitButton";

export function ChatInput() {
  const input = useChatStore((state) => state.input);
  const setInput = useChatStore((state) => state.setInput);
  const submitMessage = useChatStore((state) => state.submitMessage);
  const isLoading = useChatStore((state) => state.isLoading);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const startTime = performance.now();
      const submittedInput = input.trim();

      if (!submittedInput || isLoading) return;

      posthog.capture("message_submitted", {
        message_length: submittedInput.length,
        is_command: submittedInput.startsWith("/"),
        input_method: "text",
        has_chart_reference: submittedInput.toLowerCase().includes("chart"),
        time_since_last_message: getTimeSinceLastMessage(),
        composition_duration_ms: getCompositionDuration(),
      });

      submitMessage(submittedInput)
        .then(() => {
          const duration = performance.now() - startTime;
          recordMessageSent(duration);
          resetCompositionTracking();

          posthog.capture("message_sent_success", {
            message_length: submittedInput.length,
            response_time_ms: duration,
            ...getSessionMetrics(),
          });
        })
        .catch((error: unknown) => {
          recordMessageError();
          posthog.capture("message_send_error", {
            message_length: submittedInput.length,
            error: error instanceof Error ? error.message : "Unknown error",
            failed_after_ms: performance.now() - startTime,
            ...getSessionMetrics(),
          });
          console.error("Failed to submit message:", error);
        });
    },
    [input, isLoading, submitMessage]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInput(newValue);

      // Track when user starts typing after a pause
      if (!input && newValue) {
        startCompositionTracking();
        posthog.capture("message_composition_started", {
          time_since_last_message: getTimeSinceLastMessage(),
        });
      }
    },
    [input, setInput]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !isLoading) {
        posthog.capture("message_submitted_keyboard", {
          composition_duration_ms: getCompositionDuration(),
        });
        e.currentTarget.form?.requestSubmit();
      }
    },
    [isLoading]
  );

  // Track message composition abandonment
  useEffect(() => {
    let compositionTimeout: NodeJS.Timeout;

    if (input) {
      compositionTimeout = setTimeout(() => {
        posthog.capture("message_composition_abandoned", {
          partial_message_length: input.length,
          composition_duration_ms: getCompositionDuration(),
        });
      }, COMPOSITION_TIMEOUT);
    }

    return () => clearTimeout(compositionTimeout);
  }, [input]);

  // Track session metrics on unmount
  useEffect(() => {
    return () => {
      posthog.capture("chat_session_ended", getSessionMetrics());
    };
  }, []);

  // Handle input animation
  useEffect(() => {
    if (!input) return;

    setIsAnimating(true);
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, ANIMATION_DURATION);

    return () => clearTimeout(timer);
  }, [input]);

  return (
    <div className="p-4 border-t">
      <form
        onSubmit={handleSubmit}
        className="relative"
        data-testid="chat-input-form"
      >
        <Input
          autoFocus
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={isLoading}
          className={cn(
            "pr-10 transition-all duration-300",
            isAnimating && "animate-highlight",
            input && "bg-transparent"
          )}
          aria-label="Chat input"
          data-testid="chat-input"
        />
        <SubmitButton isLoading={isLoading} />
      </form>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { useTambo, useTamboThreadInput } from "@tambo-ai/react";
import { useCallback, useEffect, useMemo, useState } from "react";

export const TamboEmailButton = () => {
  const { setValue } = useTamboThreadInput();
  const { thread } = useTambo();
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isManuallyHidden, setIsManuallyHidden] = useState(false);

  // Compute whether button should be hidden
  const shouldHideButton = useMemo(() => {
    const hasMessages = thread?.messages && thread.messages.length > 0;
    return hasMessages || isInputFocused || isManuallyHidden;
  }, [thread?.messages, isInputFocused, isManuallyHidden]);

  // Listen for input focus/blur events
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches('textarea[data-slot="message-input-textarea"]')) {
        setIsInputFocused(true);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches('textarea[data-slot="message-input-textarea"]')) {
        setIsInputFocused(false);
      }
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  const handleInteraction = useCallback(() => {
    setValue("Help me send an email to the founders.");
    setIsManuallyHidden(true);
  }, [setValue]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Command+E (Mac) or Ctrl+E (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "e") {
        e.preventDefault();
        handleInteraction();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleInteraction]);

  if (shouldHideButton) {
    return null;
  }

  return (
    <div className="z-10" data-tambo-email-button>
      <div className="pointer-events-auto">
        <Button
          size="lg"
          variant="outline"
          onClick={handleInteraction}
          className="px-8 py-6 text-sm animate-pulse hover:animate-none hover:from-primary/90 hover:to-primary/70 transition-all duration-600 shadow-lg hover:shadow-xl"
        >
          Try Sending Us an Email
          <span className="ml-2 text-xs opacity-75">(⌘+E)</span>
        </Button>
      </div>
    </div>
  );
};

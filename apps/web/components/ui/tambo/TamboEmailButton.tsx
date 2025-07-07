import { Button } from "@/components/ui/button";
import { useTamboThreadInput } from "@tambo-ai/react";
import { useCallback, useEffect, useState } from "react";

export const TamboEmailButton = () => {
  const { setValue } = useTamboThreadInput();

  const [hasPressedButton, setHasPressedButton] = useState(false);
  const [hasInputFocused, setHasInputFocused] = useState(false);

  const handleInteraction = useCallback(() => {
    setValue("Help me send an email to the founders.");
    setHasPressedButton(true);
  }, [setValue]);

  /**
   * The chip is considered “hidden” once the user interacts by either:
   *  • pressing the chip button
   *  • focusing the message textarea for the first time
   *
   * We compute this value early so that effects below can reference it.
   */
  const isHidden = hasPressedButton || hasInputFocused;

  /**
   * ⌘/Ctrl + E keyboard shortcut
   */
  useEffect(() => {
    // Shortcut should only work while the chip is visible.
    if (isHidden) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "e") {
        e.preventDefault();
        handleInteraction();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleInteraction, isHidden]);

  /**
   * Hide chip once the message textarea is focused for the first time.
   */
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLTextAreaElement &&
        target.dataset.slot === "message-input-textarea"
      ) {
        setHasInputFocused(true);
        // Remove the listener immediately; we only care about the first focus.
        window.removeEventListener("focusin", handleFocusIn, true);
      }
    };

    window.addEventListener("focusin", handleFocusIn, true);
    return () => window.removeEventListener("focusin", handleFocusIn, true);
  }, []);

  if (isHidden) return null;

  return (
    <div data-testid="prefill-chip" className="z-10">
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

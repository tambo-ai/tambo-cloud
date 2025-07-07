import { Button } from "@/components/ui/button";
import { useTamboThreadInput } from "@tambo-ai/react";
import { useCallback, useEffect, useState } from "react";

export const TamboEmailButton = () => {
  const { setValue } = useTamboThreadInput();

  // Track if the button itself was clicked
  const [hasPressedButton, setHasPressedButton] = useState(false);
  // Track if the message textarea received focus at least once
  const [hasInputFocused, setHasInputFocused] = useState(false);

  // When either flag is true, the chip must disappear permanently
  const isHidden = hasPressedButton || hasInputFocused;

  const handleInteraction = useCallback(() => {
    setValue("Help me send an email to the founders.");
    setHasPressedButton(true);
  }, [setValue]);

  /**
   * Global ⌘/Ctrl+E shortcut
   * – active ONLY while the chip is visible.
   */
  useEffect(() => {
    if (isHidden) return; // Shortcut disabled once chip is gone

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
   * Detect the first focus on the Tambo message textarea.
   * Uses the capturing phase so it fires before focus handlers inside the component tree.
   */
  useEffect(() => {
    if (hasInputFocused) return; // Listener no longer needed

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLTextAreaElement &&
        target.dataset.slot === "message-input-textarea"
      ) {
        setHasInputFocused(true);
      }
    };

    // Capture to ensure we catch the event early regardless of bubbling
    window.addEventListener("focusin", handleFocusIn, true);
    return () =>
      window.removeEventListener("focusin", handleFocusIn, true);
  }, [hasInputFocused]);

  // Render nothing once hidden
  if (isHidden) return null;

  return (
    <div className="z-10">
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

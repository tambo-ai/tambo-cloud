import { Button } from "@/components/ui/button";
import { useTamboThreadInput } from "@tambo-ai/react";
import { useCallback, useEffect, useState } from "react";

export const TamboEmailButton = () => {
  const { setValue } = useTamboThreadInput();
  const [hasPressedButton, setHasPressedButton] = useState(false);

  const handleInteraction = useCallback(() => {
    setValue("Help me send an email to the founders.");
    setHasPressedButton(true);
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

  if (hasPressedButton) return null;

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

import { Button } from "@/components/ui/button";
import { useTamboThreadInput } from "@tambo-ai/react";
import { useState } from "react";

export const TamboEmailButton = () => {
  const { setValue } = useTamboThreadInput();
  const [hasPressedButton, setHasPressedButton] = useState(false);
  if (hasPressedButton) return null;

  return (
    <div className="z-10">
      <div className="pointer-events-auto">
        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            setValue("Help me send an email to the founders.");
            setHasPressedButton(true);
          }}
          className="px-8 py-6 text-sm animate-pulse hover:animate-none hover:from-primary/90 hover:to-primary/70 transition-all duration-600 shadow-lg hover:shadow-xl"
        >
          Try Sending Us an Email
          <span className="ml-2 text-xs opacity-75">(⌘+E)</span>
        </Button>
      </div>
    </div>
  );
};

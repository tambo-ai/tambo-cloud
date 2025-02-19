import { Button } from "@/components/ui/button";
import { useHydraSuggestions } from "@hydra-ai/react";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";
import type { Suggestion } from "@hydra-ai/client/resources/beta/threads/suggestions";

interface MessageSuggestionsProps {}

export function MessageSuggestions({}: MessageSuggestionsProps) {
  const {
    suggestions,
    isLoading,
    isAccepting,
    error,
    accept,
    selectedSuggestionId,
  } = useHydraSuggestions({ maxSuggestions: 3 });

  const handleAccept = useCallback(
    async (suggestion: Suggestion) => {
      try {
        await accept(suggestion, false); // True is auto-submit
      } catch (error) {
        console.error("Error accepting suggestion:", error);
      }
    },
    [accept],
  );

  if (suggestions.length === 0 && !isLoading) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            Loading suggestions...
          </p>
        ) : (
          suggestions.map((suggestion) => {
            const isSelected = selectedSuggestionId === suggestion.id;
            return (
              <Button
                key={suggestion.id}
                variant={isSelected ? "default" : "secondary"}
                size="sm"
                onClick={() => handleAccept(suggestion)}
                disabled={isAccepting}
                className={cn(
                  isSelected && "ring-2 ring-primary ring-offset-2",
                  "transition-all",
                )}
                title={suggestion.detailedSuggestion}
              >
                {suggestion.title}
              </Button>
            );
          })
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}

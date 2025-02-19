import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHydraSuggestions, type Suggestion } from "@hydra-ai/react";
import { Check, Loader2 } from "lucide-react";

interface SuggestedActionsProps {
  maxSuggestions?: number;
}

export function SuggestedActions({
  maxSuggestions = 3,
}: SuggestedActionsProps) {
  const {
    suggestions,
    isLoading,
    isAccepting,
    error,
    accept,
    selectedSuggestionId,
  } = useHydraSuggestions({
    maxSuggestions,
  });

  if (error) {
    return (
      <div className="text-sm text-red-500 mt-2">
        Failed to load suggestions: {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading suggestions...
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {suggestions.map((suggestion: Suggestion) => {
        const isSelected = suggestion.id === selectedSuggestionId;
        return (
          <Button
            key={suggestion.id}
            variant={isSelected ? "default" : "secondary"}
            size="sm"
            onClick={() => accept(suggestion)}
            disabled={isAccepting}
            title={suggestion.detailedSuggestion}
            className={cn(
              "flex items-center gap-2",
              isSelected && "bg-primary text-primary-foreground",
            )}
          >
            <>
              {isSelected ? <Check className="h-3 w-3" /> : null}
              {suggestion.title}
            </>
          </Button>
        );
      })}
    </div>
  );
}

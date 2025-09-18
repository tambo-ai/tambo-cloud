import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PARAMETER_SUGGESTIONS } from "./types";
import { Plus } from "lucide-react";

/**
 * ParameterSuggestions Component
 *
 * Displays clickable parameter suggestions for a specific LLM provider.
 * Each suggestion appears as a button that users can click to quickly add
 * common LLM parameters to their configuration.
 */
interface ParameterSuggestionsProps {
  providerName: string;
  suggestions: typeof PARAMETER_SUGGESTIONS;
  onApply: (suggestion: { key: string; type: string }) => void;
}

export function ParameterSuggestions({
  providerName,
  suggestions,
  onApply,
}: ParameterSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="mb-4">
      <Label className="text-xs text-muted-foreground mb-2 block">
        Common parameters for {providerName}:
      </Label>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <Button
            key={s.key}
            variant="outline"
            size="sm"
            onClick={() => onApply(s)}
            className="text-xs"
            title={s.description}
          >
            <Plus className="h-3 w-3 mr-1" />
            {s.key}
          </Button>
        ))}
      </div>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ActionBadgeProps {
  type: string;
}

export function ActionBadge({ type }: ActionBadgeProps) {
  return (
    <Badge variant="secondary" className="font-normal">
      {type}
    </Badge>
  );
}

interface ToolCallBadgeProps {
  id: string;
  onHover?: (id: string | null) => void;
}

export function ToolCallBadge({ id, onHover }: ToolCallBadgeProps) {
  return (
    <Badge
      variant="outline"
      className="font-mono text-xs cursor-help inline-flex items-center"
      onMouseEnter={() => onHover?.(id)}
      onMouseLeave={() => onHover?.(null)}
      title={id}
    >
      <span className="max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap block">
        {id}
      </span>
    </Badge>
  );
}

interface ToolCallCodeProps {
  toolName: string;
  parameters: Array<{ parameterName: string; parameterValue: any }>;
}

export function ToolCallCode({ toolName, parameters }: ToolCallCodeProps) {
  const [expanded, setExpanded] = useState(false);

  const formatValue = (value: any) => {
    if (typeof value === "string" && value.length > 50 && !expanded) {
      return `"${value.slice(0, 50)}..."`;
    }
    return JSON.stringify(value, null, expanded ? 2 : 0);
  };

  return (
    <div className="font-mono text-sm bg-muted/50 p-3 rounded-md">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">{toolName}</span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>
      <div className={cn("transition-all", expanded ? "space-y-1" : "")}>
        {parameters.map((param, i) => (
          <div key={i} className={expanded ? "ml-4" : "inline"}>
            {expanded && (
              <span className="text-muted-foreground">
                {param.parameterName}:{" "}
              </span>
            )}
            <span>{formatValue(param.parameterValue)}</span>
            {!expanded && i < parameters.length - 1 && ", "}
          </div>
        ))}
      </div>
    </div>
  );
}

interface SuggestedActionsProps {
  actions: Array<{ title: string }>;
}

export function SuggestedActions({ actions }: SuggestedActionsProps) {
  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">
        Suggested Actions
      </h4>
      <div className="flex flex-wrap gap-2">
        {actions.map((action, i) => (
          <Badge
            key={i}
            variant="secondary"
            className="cursor-pointer hover:bg-secondary/80"
          >
            {action.title}
          </Badge>
        ))}
      </div>
    </div>
  );
}

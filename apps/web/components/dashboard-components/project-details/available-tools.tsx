import { api } from "@/trpc/react";

interface AvailableToolsProps {
  project: { id: string; name: string };
}

export function AvailableTools({ project }: AvailableToolsProps) {
  const { data: tools, isLoading } = api.tools.list.useQuery();

  if (isLoading) {
    return <div className="animate-pulse h-8 bg-muted rounded" />;
  }

  if (!tools?.length) {
    return (
      <div className="text-sm text-muted-foreground">
        No tools available for this project
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Available Tools</h3>
      <div className="space-y-1">
        {tools.map((tool, index) => (
          <div
            key={index}
            className="text-sm p-2 bg-muted/50 rounded-md flex items-center justify-between"
          >
            <span>{tool.function.name}</span>
            <span className="text-xs text-muted-foreground">
              {tool.function.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

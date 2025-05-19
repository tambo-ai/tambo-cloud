import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/trpc/react";
import { MCPToolSpec } from "@tambo-ai-cloud/core";
import { Loader2 } from "lucide-react";

interface McpServerToolsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  serverId: string;
}

export function McpServerToolsDialog({
  open,
  onOpenChange,
  projectId,
  serverId,
}: McpServerToolsDialogProps) {
  const {
    data: tools,
    isLoading,
    error,
  } = api.tools.inspectMcpServer.useQuery(
    {
      projectId,
      serverId,
    },
    {
      enabled: open,
    },
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Available Tools</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error.message}
            </div>
          ) : tools?.length === 0 ? (
            <div className="text-sm text-muted-foreground p-3">
              No tools available
            </div>
          ) : (
            <div className="space-y-4">
              {tools?.map((tool) => <ToolCard key={tool.name} tool={tool} />)}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function ToolCard({ tool }: { tool: MCPToolSpec }) {
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <h3 className="font-medium">{tool.name}</h3>
      {tool.description && (
        <p className="text-sm text-muted-foreground">{tool.description}</p>
      )}
      {tool.inputSchema?.properties && (
        <div className="mt-2">
          <h4 className="text-sm font-medium mb-1">Parameters:</h4>
          <div className="space-y-1">
            {Object.entries(tool.inputSchema.properties).map(
              ([name, schema]) => (
                <div key={name} className="text-sm">
                  <span className="font-mono">{name}</span>
                  {schema.description && (
                    <span className="text-muted-foreground ml-2">
                      - {schema.description}
                    </span>
                  )}
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

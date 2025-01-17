import { cn } from "@/lib/utils";
import type { ChatMessageProps } from "@/types/chat";
import { CanvasComponent } from "@/components/CanvasComponent";
import { useCanvasStore } from "@/store/canvasStore";
import { Button } from "@/components/ui/button";
import { useMemo, useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function Message({ role, content, graph }: ChatMessageProps) {
  const isUser = role === "user";
  const [isAdding, setIsAdding] = useState(false);
  const components = useCanvasStore((state) => state.components);
  const addComponent = useCanvasStore((state) => state.addComponent);

  const isAdded = useMemo(
    () => Boolean(graph?.id && components.some((c) => c.id === graph.id)),
    [components, graph?.id]
  );

  const handleAdd = useCallback(() => {
    if (!graph?.id || isAdded) return;
    setIsAdding(true);
    try {
      addComponent(graph);
    } catch (error) {
      console.error("Failed to add component:", error);
    } finally {
      setIsAdding(false);
    }
  }, [graph, isAdded, addComponent]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      void handleAdd();
    }
  };

  if (!graph) {
    return (
      <Card className={cn("mb-4", isUser ? "bg-muted/50" : "bg-background")}>
        <CardContent className="p-4">
          <p className="text-sm text-foreground">{content}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full gap-4 p-4",
        isUser ? "bg-muted/50" : "bg-background"
      )}
      role="article"
      aria-label={`${role} message`}
    >
      <div className="flex-1 space-y-4 overflow-hidden">
        <p className="text-sm text-foreground">{content}</p>
        <Card
          className={cn(
            "border bg-background",
            isUser ? "bg-muted/50" : "bg-background"
          )}
        >
          <CardContent className="p-4">
            <CanvasComponent {...graph} />
            <Button
              onClick={() => void handleAdd()}
              onKeyDown={handleKeyDown}
              size="sm"
              variant="outline"
              className="mt-4 w-full"
              disabled={isAdded || isAdding}
              aria-label={isAdded ? "Already added to canvas" : "Add to canvas"}
            >
              {isAdding
                ? "Adding..."
                : isAdded
                  ? "Added to Canvas"
                  : "Add to Canvas"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

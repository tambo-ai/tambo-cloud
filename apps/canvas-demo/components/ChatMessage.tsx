import type { ChatMessageProps } from "@/types/chat";
import { useCanvasStore } from "@/store/canvasStore";
import { memo, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChatVisualization } from "./visualization/ChatVisualization";

export const ChatMessage = memo(function ChatMessage({
  role,
  content,
  graph,
}: ChatMessageProps) {
  const components = useCanvasStore((state) => state.components);
  const addComponent = useCanvasStore((state) => state.addComponent);

  const isExistingComponent = useMemo(
    () => (graph ? components.some((c) => c.id === graph.id) : false),
    [components, graph]
  );

  const handleAddOrUpdate = useCallback(() => {
    if (!graph) return;
    addComponent(graph);
  }, [graph, addComponent]);

  return (
    <div
      className={cn(
        "mb-4",
        role === "user" ? "bg-muted/50" : "bg-primary/5",
        !graph && "rounded-lg border shadow-sm"
      )}
    >
      <div className="p-4">
        {graph && (
          <ChatVisualization
            {...graph}
            onAddToCanvas={handleAddOrUpdate}
            isExisting={isExistingComponent}
          />
        )}
        {content && (
          <div
            className={cn(
              "text-foreground/90 text-sm leading-relaxed",
              graph && "mt-4 pt-4 border-t border-border/50"
            )}
          >
            {content}
          </div>
        )}
      </div>
    </div>
  );
});

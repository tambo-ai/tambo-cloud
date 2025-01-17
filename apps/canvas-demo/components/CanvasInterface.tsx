"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Canvas } from "@/components/Canvas";
import { Chat } from "@/components/Chat";
import { Dashboard } from "@/components/Dashboard";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useActiveTab } from "@/contexts/ActiveTabContext";
import { CanvasComponent } from "./CanvasComponent";
import type { CanvasComponentType } from "@/components/Canvas";
import { useCanvasStore } from "@/store/canvasStore";

interface DragData {
  source: "chat" | "canvas";
  messageId?: string;
  sortable?: {
    containerId: string;
    index: number;
    items: string[];
  };
}

interface CanvasInterfaceProps {
  activeTab: string;
}

export function CanvasInterface({ activeTab }: CanvasInterfaceProps) {
  const { chatMessages } = useActiveTab();
  const [activeId, setActiveId] = useState<string | null>(null);
  const {
    components: canvasComponents,
    addComponent,
    reorderComponents,
  } = useCanvasStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    if (active.id !== over.id) {
      const dragData = active.data.current as DragData;
      const overData = over.data.current as DragData;
      const isFromChat = dragData?.source === "chat";
      const isToCanvas = overData?.sortable?.containerId === "canvas";

      if (isFromChat && isToCanvas) {
        const draggedMessage = chatMessages.find(
          (m) => m.graph && m.graph.id === active.id
        );
        const graph = draggedMessage?.graph;
        if (graph && graph.id && graph.title && graph.fredParams) {
          addComponent(graph);
        }
      } else {
        // Handle reordering within canvas
        const oldIndex = canvasComponents.findIndex(
          (item: CanvasComponentType) => item.id === active.id
        );
        const newIndex = canvasComponents.findIndex(
          (item: CanvasComponentType) => item.id === over.id
        );
        reorderComponents(oldIndex, newIndex);
      }
    }
  };

  const activeItem = activeId
    ? canvasComponents.find((item) => item.id === activeId) ||
      chatMessages.find((m) => m.graph && m.graph.id === activeId)?.graph
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full w-full overflow-hidden">
        {activeTab === "canvas" ? (
          <ResizablePanelGroup direction="horizontal" className="w-full">
            <ResizablePanel defaultSize={33} minSize={20}>
              <div className="h-full overflow-hidden">
                <Chat />
              </div>
            </ResizablePanel>
            <ResizableHandle>
              <div className="flex h-full items-center justify-center">
                <div className="h-full w-px bg-border/50 group-hover:bg-border/80 transition-colors" />
              </div>
            </ResizableHandle>
            <ResizablePanel defaultSize={67} minSize={30}>
              <div className="h-full overflow-hidden">
                <Canvas />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : activeTab === "chat" ? (
          <div className="h-full w-full overflow-hidden">
            <Chat />
          </div>
        ) : (
          <div className="h-full w-full overflow-hidden">
            <Dashboard canvasComponents={canvasComponents} />
          </div>
        )}
      </div>
      <DragOverlay>
        {activeItem ? (
          <div className="opacity-80">
            <CanvasComponent
              id={activeItem.id}
              title={activeItem.title}
              description={activeItem.description}
              fredParams={activeItem.fredParams}
              inputs={activeItem.inputs}
              height={activeItem.height}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

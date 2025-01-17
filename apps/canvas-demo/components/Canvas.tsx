import { CanvasComponent } from "@/components/CanvasComponent";
import type { InputConfig, FrequencyType, UnitsType } from "@/lib/schema";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import { useCanvas } from "@/hooks/useCanvas";
import { useCallback, useEffect } from "react";
import { EmptyState } from "@/components/EmptyState";
import { useChatStore } from "@/store/chatStore";
import { useActiveTab } from "@/contexts/ActiveTabContext";
import posthog from "posthog-js";

export interface CanvasComponentType {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly fredParams: {
    series_id: string | string[];
    frequency: FrequencyType;
    units: UnitsType;
    multiSeries: boolean;
    dualAxis: boolean;
  };
  readonly height: number;
  inputs: InputConfig[];
}

interface ComponentListProps {
  components: CanvasComponentType[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const ANIMATION_CONFIG = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2, ease: "easeOut" },
} as const;

function ComponentList({
  components,
  selectedId,
  onSelect,
}: ComponentListProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, id: string) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        posthog?.capture("canvas_component_selected_keyboard", {
          component_id: id,
        });
        onSelect(id);
      }
    },
    [onSelect]
  );

  const setInput = useChatStore((state) => state.setInput);
  const { setActiveTab } = useActiveTab();

  if (components.length === 0) {
    return (
      <EmptyState
        onAction={(action) => {
          setActiveTab("canvas");
          switch (action) {
            case "indicators":
              setInput("Show me the latest economic indicators");
              break;
            case "monetary":
              setInput("What is the current Federal Funds Rate?");
              break;
            case "banking":
              setInput("Show me bank lending rates over time");
              break;
            case "historical":
              setInput("Compare GDP growth across different decades");
              break;
          }
        }}
      />
    );
  }

  return (
    <AnimatePresence mode="popLayout">
      {components.map((component) => (
        <motion.div
          key={component.id}
          {...ANIMATION_CONFIG}
          className={`
            ${selectedId === component.id ? "ring-2 ring-primary" : ""}
            rounded-lg focus-visible:ring-2 focus-visible:ring-primary
          `}
          onClick={() => onSelect(component.id)}
          onKeyDown={(e) => handleKeyDown(e, component.id)}
          role="option"
          tabIndex={0}
          aria-selected={selectedId === component.id}
        >
          <CanvasComponent {...component} />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

export function Canvas() {
  const { components, selectedId, selectComponent } = useCanvas();
  const { activeTab } = useActiveTab();

  const { setNodeRef } = useDroppable({
    id: "canvas-droppable",
  });

  useEffect(() => {
    if (components.length > 0) {
      posthog?.capture("canvas_components_loaded", {
        component_count: components.length,
        canvas_id: activeTab,
      });
    }
  }, [components.length, activeTab]);

  const handleSelect = useCallback(
    (id: string) => {
      posthog?.capture("canvas_component_selected", {
        component_id: id,
        canvas_id: activeTab,
      });
      selectComponent(id);
    },
    [selectComponent, activeTab]
  );

  return (
    <div className="h-full flex flex-col">
      <div
        className="flex-1 p-6 overflow-y-auto"
        ref={setNodeRef}
        role="region"
        aria-label="Canvas Components"
      >
        <SortableContext
          items={components.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4" role="listbox">
            <ComponentList
              components={components}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

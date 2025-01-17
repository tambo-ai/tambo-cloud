import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CanvasComponentType } from "@/components/Canvas";
import { toast } from "sonner";

/**
 * @todo Implement proper update functionality
 * - Handle nested property updates
 * - Add validation for updated fields
 * - Consider using immer for complex updates
 */

interface CanvasState {
  components: CanvasComponentType[];
  selectedId: string | null;
  isEditing: boolean;
  activeCanvasId: string | null;
  canvasStates: Record<
    string,
    {
      components: CanvasComponentType[];
      selectedId: string | null;
    }
  >;

  // Actions
  addComponent: (component: CanvasComponentType) => void;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, updates: Partial<CanvasComponentType>) => void;
  clearCanvas: () => void;
  setSelectedId: (id: string | null) => void;
  setIsEditing: (isEditing: boolean) => void;
  reorderComponents: (startIndex: number, endIndex: number) => void;
  setActiveCanvas: (canvasId: string) => void;
  saveCanvasState: () => void;
  loadCanvasState: (canvasId: string) => void;
  initializeCanvas: () => void;
}

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      components: [],
      selectedId: null,
      isEditing: false,
      activeCanvasId: null,
      canvasStates: {},

      addComponent: (component) => {
        try {
          const state = get();
          if (state.components.some((c) => c.id === component.id)) {
            toast.info("Component already exists");
            return;
          }

          const cleanComponent = JSON.parse(
            JSON.stringify(component)
          ) as CanvasComponentType;

          set((state) => ({
            components: [...state.components, cleanComponent],
            selectedId: component.id,
          }));

          // Auto-save the canvas state
          get().saveCanvasState();

          console.log("Adding component:", cleanComponent);
          toast.success("Component added to canvas");
        } catch (error) {
          console.error("Failed to add component:", error);
          toast.error("Failed to add component");
        }
      },

      removeComponent: (id) => {
        if (!id) return;
        set((state) => {
          const newState = {
            components: state.components.filter((c) => c.id !== id),
            selectedId: state.selectedId === id ? null : state.selectedId,
          };
          return newState;
        });
        // Auto-save after removal
        get().saveCanvasState();
        toast.success("Component removed from canvas");
      },

      updateComponent: (id, updates) => {
        if (!id) return;
        const state = get();
        const component = state.components.find((c) => c.id === id);
        if (!component) {
          toast.error("Component not found");
          return;
        }
        try {
          set((state) => ({
            components: state.components.map((c) =>
              c.id === id ? { ...c, ...updates } : c
            ),
          }));
          // Auto-save after update
          get().saveCanvasState();
          toast.success("Component updated on canvas");
        } catch (error) {
          console.error("Failed to update component:", error);
          toast.error("Failed to update component");
        }
      },

      clearCanvas: () => {
        set({ components: [], selectedId: null });
        toast.success("Canvas cleared");
      },

      setSelectedId: (id) => set({ selectedId: id }),

      setIsEditing: (isEditing) => set({ isEditing }),

      reorderComponents: (startIndex: number, endIndex: number) => {
        if (startIndex < 0 || endIndex < 0) return;
        set((state) => {
          if (
            startIndex >= state.components.length ||
            endIndex >= state.components.length
          ) {
            return state;
          }
          const result = Array.from(state.components);
          const [removed] = result.splice(startIndex, 1);
          result.splice(endIndex, 0, removed);
          const newState = { components: result };
          return newState;
        });
        // Auto-save after reorder
        get().saveCanvasState();
      },

      setActiveCanvas: (canvasId) => {
        set({ activeCanvasId: canvasId });
        get().loadCanvasState(canvasId);
      },

      saveCanvasState: () => {
        const state = get();
        if (!state.activeCanvasId) return;
        const canvasId = state.activeCanvasId;

        set((state) => ({
          canvasStates: {
            ...state.canvasStates,
            [canvasId]: {
              components: state.components,
              selectedId: state.selectedId,
            },
          },
        }));
      },

      loadCanvasState: (canvasId) => {
        const state = get();
        const savedState = state.canvasStates[canvasId];

        if (savedState) {
          set({
            components: savedState.components,
            selectedId: savedState.selectedId,
          });
        } else {
          set({
            components: [],
            selectedId: null,
          });
        }
      },

      initializeCanvas: () => {
        const state = get();
        const canvasStates = Object.keys(state.canvasStates);

        if (canvasStates.length === 0) {
          // Create default canvas if none exist
          const defaultId = crypto.randomUUID();
          set(() => ({
            canvasStates: {
              [defaultId]: {
                components: [],
                selectedId: null,
              },
            },
            activeCanvasId: defaultId,
          }));
          get().loadCanvasState(defaultId);
          return;
        }

        // Load the last canvas if one exists
        const lastCanvasId = canvasStates[canvasStates.length - 1];
        if (lastCanvasId) {
          set({ activeCanvasId: lastCanvasId });
          get().loadCanvasState(lastCanvasId);
        }
      },
    }),
    {
      name: "canvas-storage",
      partialize: (state) => ({
        canvasStates: state.canvasStates,
        // Don't persist ephemeral states
      }),
    }
  )
);

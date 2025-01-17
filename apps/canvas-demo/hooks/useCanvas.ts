import { useCallback } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { useChatStore } from "@/store/chatStore";
import { Canvas } from "@/types/canvas";
import { createCanvas, saveCanvasesToStorage } from "@/utils/canvas";

export function useCanvas() {
  const {
    clearCanvas,
    setActiveCanvas: setActiveCanvasStore,
    components,
    selectedId,
    setSelectedId,
  } = useCanvasStore();

  const { clearMessages, setActiveCanvas: setActiveChatCanvas } =
    useChatStore();

  const switchCanvas = useCallback(
    (canvasId: string) => {
      clearCanvas();
      clearMessages();
      setActiveCanvasStore(canvasId);
      setActiveChatCanvas(canvasId);
    },
    [clearCanvas, clearMessages, setActiveCanvasStore, setActiveChatCanvas]
  );

  const createNewCanvas = useCallback(
    (name: string, canvases: Canvas[]) => {
      const newCanvas = createCanvas(name);
      const updatedCanvases = [...canvases, newCanvas];
      saveCanvasesToStorage(updatedCanvases);
      switchCanvas(newCanvas.id);
      return { newCanvas, updatedCanvases };
    },
    [switchCanvas]
  );

  const selectComponent = useCallback(
    (id: string) => {
      setSelectedId(id);
    },
    [setSelectedId]
  );

  return {
    components,
    selectedId,
    switchCanvas,
    createNewCanvas,
    selectComponent,
    clearCanvas,
    clearMessages,
  };
}

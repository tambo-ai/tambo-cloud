import { nanoid } from "nanoid";
import { Canvas, STORAGE_KEYS } from "@/types/canvas";

export function createCanvas(name: string): Canvas {
  return {
    id: nanoid(),
    name: name.trim(),
    createdAt: new Date(),
  };
}

export function loadCanvasesFromStorage(): Canvas[] {
  const savedCanvases = localStorage.getItem(STORAGE_KEYS.CANVASES);
  if (!savedCanvases) return [];

  try {
    const parsedCanvases = JSON.parse(savedCanvases);
    return parsedCanvases.map(
      (canvas: { id: string; name: string; createdAt: string }) => ({
        ...canvas,
        createdAt: new Date(canvas.createdAt),
      })
    );
  } catch (error) {
    console.error("Error loading canvases:", error);
    return [];
  }
}

export function saveCanvasesToStorage(canvases: Canvas[]) {
  localStorage.setItem(STORAGE_KEYS.CANVASES, JSON.stringify(canvases));
}

export function filterAndSortCanvases(
  canvases: Canvas[],
  searchQuery: string
): Canvas[] {
  return canvases
    .filter((canvas) => {
      if (!searchQuery) return true;
      return canvas.name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      if (searchQuery) {
        const aStartsWithQuery = a.name
          .toLowerCase()
          .startsWith(searchQuery.toLowerCase());
        const bStartsWithQuery = b.name
          .toLowerCase()
          .startsWith(searchQuery.toLowerCase());
        if (aStartsWithQuery !== bStartsWithQuery) {
          return aStartsWithQuery ? -1 : 1;
        }
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
}

export function resetAllCanvasState() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  saveCanvasesToStorage([]);
}

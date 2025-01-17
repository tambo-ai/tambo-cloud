export interface Canvas {
  id: string;
  name: string;
  createdAt: Date;
}

export interface CanvasStorage {
  canvases: Canvas[];
  activeCanvasId: string | null;
}

export const STORAGE_KEYS = {
  CANVASES: "user-canvases",
  CANVAS_TIP: "has-shown-canvas-tip",
  CANVAS_STORAGE: "canvas-storage",
  CHAT_STORAGE: "chat-storage",
} as const;

export const DEFAULT_CANVAS_NAME = "Default Canvas";

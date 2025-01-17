import type { CanvasComponentType } from "@/components/Canvas";

export interface ChatMessageProps {
  id: string;
  role: "user" | "ai";
  content: string;
  graph?: CanvasComponentType;
}

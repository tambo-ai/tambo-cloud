import { Canvas } from "./Canvas";
import type { CanvasComponentType } from "@/components/Canvas";

interface DashboardProps {
  canvasComponents: CanvasComponentType[];
}

export function Dashboard({ canvasComponents }: DashboardProps) {
  return (
    <div className="w-full h-full overflow-hidden">
      <Canvas canvasComponents={canvasComponents} />
    </div>
  );
}

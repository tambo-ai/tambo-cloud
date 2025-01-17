import { Button } from "@/components/ui/button";
import { DataWrapper } from "@/components/DataWrapper";
import type { FrequencyType, UnitsType, InputConfig } from "@/lib/schema";

interface ChatVisualizationProps {
  onAddToCanvas: () => void;
  isExisting: boolean;
  id: string;
  title: string;
  description: string;
  fredParams: {
    series_id: string | string[];
    frequency: FrequencyType;
    units: UnitsType;
    multiSeries: boolean;
    dualAxis: boolean;
    observation_start?: string;
    observation_end?: string;
  };
  height: number;
  inputs: InputConfig[];
}

export function ChatVisualization({
  onAddToCanvas,
  isExisting,
  title,
  description,
  fredParams,
  height,
  inputs,
}: ChatVisualizationProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground leading-snug">
            {description}
          </p>
        )}
      </div>
      <div className="border rounded-lg">
        <DataWrapper
          initialParams={fredParams}
          inputs={inputs}
          height={height}
          showControls={true}
          hideContainer={true}
        />
      </div>
      <Button onClick={onAddToCanvas} size="sm" className="w-full">
        {isExisting ? "Update on Canvas" : "Add to Canvas"}
      </Button>
    </div>
  );
}

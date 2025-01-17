import { useRef, useEffect } from "react";
import posthog from "posthog-js";
import { BaseVisualization, VisualizationProps } from "./BaseVisualization";
import { DataWrapper } from "@/components/DataWrapper";
import type { FrequencyType, UnitsType, InputConfig } from "@/lib/schema";
import { cn } from "@/lib/utils";

interface VisualizationData {
  fredParams: {
    series_id: string | string[];
    frequency: FrequencyType;
    units: UnitsType;
    multiSeries: boolean;
    dualAxis: boolean;
    observation_start?: string;
    observation_end?: string;
  };
  inputs: InputConfig[];
}

export interface CanvasVisualizationProps extends VisualizationProps {
  id: string;
  title: string;
  description?: string;
  height: number;
  onRemove?: () => void;
  onConfigChange?: (
    paramName: string,
    oldValue: unknown,
    newValue: unknown
  ) => void;
}

export function CanvasVisualization({
  id,
  title,
  description,
  data,
  metadata,
  onDataChange,
  onMetadataChange,
  height,
  onRemove,
  onConfigChange,
}: CanvasVisualizationProps) {
  const renderStartTime = useRef<number>(Date.now());
  const interactionCount = useRef<number>(0);

  useEffect(() => {
    const startTime = renderStartTime.current;
    const interactions = interactionCount.current;

    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;

      posthog?.capture("visualization_closed", {
        component_id: id,
        duration_ms: duration,
        interaction_count: interactions,
      });
    };
  }, [id]);

  const handleDataChange = (newData: Record<string, unknown>) => {
    interactionCount.current += 1;
    onDataChange(newData);
    onConfigChange?.("data", data, newData);
  };

  const handleMetadataChange = (newMetadata: Record<string, unknown>) => {
    interactionCount.current += 1;
    onMetadataChange(newMetadata);
    onConfigChange?.("metadata", metadata, newMetadata);
  };

  const visualizationData = data as unknown as VisualizationData;

  return (
    <BaseVisualization
      data={data}
      metadata={metadata}
      onDataChange={handleDataChange}
      onMetadataChange={handleMetadataChange}
    >
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center px-4 mb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground leading-snug">
                {description}
              </p>
            )}
          </div>
          {onRemove && (
            <button
              onClick={onRemove}
              className={cn(
                "rounded-full w-6 h-6 flex items-center justify-center",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-muted transition-colors"
              )}
              aria-label="Remove visualization"
            >
              ×
            </button>
          )}
        </div>
        <div className="flex-1 min-h-0">
          <DataWrapper
            initialParams={visualizationData.fredParams}
            inputs={visualizationData.inputs}
            height={height}
            showControls={true}
            onParamChange={onConfigChange}
            hideContainer={true}
          />
        </div>
      </div>
    </BaseVisualization>
  );
}

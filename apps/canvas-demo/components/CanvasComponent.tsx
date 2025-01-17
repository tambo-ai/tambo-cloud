import type { CanvasComponentProps } from "@/lib/schema";
import { memo, useCallback, useMemo } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { CanvasVisualization } from "./visualization/CanvasVisualization";
import posthog from "posthog-js";

export const CanvasComponent = memo(function CanvasComponent(
  props: CanvasComponentProps
) {
  const removeComponent = useCanvasStore((state) => state.removeComponent);

  const handleRemove = useCallback(() => {
    posthog?.capture("chart_removed", {
      component_id: props.id,
      title: props.title,
      series_id: props.fredParams.series_id,
    });
    removeComponent(props.id);
  }, [props.id, props.title, props.fredParams.series_id, removeComponent]);

  const handleConfigChange = useCallback(
    (paramName: string, oldValue: unknown, newValue: unknown) => {
      posthog?.capture("chart_config_changed", {
        component_id: props.id,
        changed_param: paramName,
        old_value: oldValue,
        new_value: newValue,
      });
    },
    [props.id]
  );

  // Create visualization data and metadata
  const visualizationData = useMemo(
    () => ({
      fredParams: props.fredParams,
      inputs: props.inputs,
    }),
    [props.fredParams, props.inputs]
  );

  const visualizationMetadata = useMemo(
    () => ({
      id: props.id,
      title: props.title,
      description: props.description,
    }),
    [props.id, props.title, props.description]
  );

  const handleDataChange = useCallback((data: Record<string, unknown>) => {
    console.warn("Data changed:", data);
  }, []);

  const handleMetadataChange = useCallback(
    (metadata: Record<string, unknown>) => {
      console.warn("Metadata changed:", metadata);
    },
    []
  );

  return (
    <div className="p-4 sm:p-6 bg-card rounded-lg border shadow-sm">
      <CanvasVisualization
        {...props}
        data={visualizationData}
        metadata={visualizationMetadata}
        onDataChange={handleDataChange}
        onMetadataChange={handleMetadataChange}
        onRemove={handleRemove}
        onConfigChange={handleConfigChange}
      />
    </div>
  );
});

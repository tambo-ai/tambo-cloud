import { ReactNode } from "react";

export interface VisualizationProps {
  data: Record<string, unknown>;
  metadata: Record<string, unknown>;
  onDataChange: (data: Record<string, unknown>) => void;
  onMetadataChange: (metadata: Record<string, unknown>) => void;
}

export interface BaseVisualizationProps extends VisualizationProps {
  children?: ReactNode;
}

export function BaseVisualization({
  children,
  data,
  metadata,
  onDataChange,
  onMetadataChange,
}: BaseVisualizationProps) {
  // We're intentionally not using these props in this component,
  // but they're required for the type system and for consistency
  void data;
  void metadata;
  void onDataChange;
  void onMetadataChange;

  return <div className="flex flex-col h-full w-full">{children}</div>;
}

export function withVisualization<P extends VisualizationProps>(
  WrappedComponent: React.ComponentType<P>,
  defaultData: Record<string, unknown>,
  defaultMetadata: Record<string, unknown>
) {
  return function WithVisualizationComponent(
    props: Omit<P, keyof VisualizationProps>
  ) {
    const handleDataChange = (data: Record<string, unknown>) => {
      console.warn("Data changed:", data);
    };

    const handleMetadataChange = (metadata: Record<string, unknown>) => {
      console.warn("Metadata changed:", metadata);
    };

    return (
      <BaseVisualization
        data={defaultData}
        metadata={defaultMetadata}
        onDataChange={handleDataChange}
        onMetadataChange={handleMetadataChange}
      >
        <WrappedComponent
          {...(props as P)}
          data={defaultData}
          metadata={defaultMetadata}
          onDataChange={handleDataChange}
          onMetadataChange={handleMetadataChange}
        />
      </BaseVisualization>
    );
  };
}

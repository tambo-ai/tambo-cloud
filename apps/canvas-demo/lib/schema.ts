import { z } from "zod";
import type { FredSeriesData } from "@/lib/fred";

// Base schemas for UI components
export const InputOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const MultiSelectorOptionSchema = InputOptionSchema;

// Base FRED types - single source of truth
export const FREQUENCY_VALUES = ["d", "w", "bw", "m", "q", "sa", "a"] as const;
export type FrequencyType = (typeof FREQUENCY_VALUES)[number];

export const UNITS_VALUES = [
  "lin",
  "chg",
  "ch1",
  "pch",
  "pc1",
  "pca",
  "cch",
  "log",
] as const;
export type UnitsType = (typeof UNITS_VALUES)[number];

// Input config schemas
export const InputConfigSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("multi-select"),
    label: z.string(),
    key: z.literal("series_id"),
    placeholder: z.string().optional(),
    defaultOptions: z.array(MultiSelectorOptionSchema).min(1),
    options: z.array(MultiSelectorOptionSchema).min(5),
  }),
  z.object({
    type: z.literal("select"),
    label: z.string(),
    key: z.enum(["frequency", "units"]),
  }),
  z.object({
    type: z.literal("date"),
    label: z.string(),
    key: z.enum(["observation_start", "observation_end"]),
  }),
]);

// FRED parameter schemas
export const FrequencyEnum = z.enum(FREQUENCY_VALUES);
export const UnitsEnum = z.enum(UNITS_VALUES);

export const FredParamsSchema = z.object({
  series_id: z.union([z.string(), z.array(z.string())]),
  frequency: FrequencyEnum,
  units: UnitsEnum,
});
export const ExtendedFredParamsSchema = FredParamsSchema.extend({
  multiSeries: z.boolean().default(false),
  dualAxis: z.boolean().default(false),
  observation_start: z
    .string()
    .default(
      new Date(new Date().setFullYear(new Date().getFullYear() - 10))
        .toISOString()
        .split("T")[0]
    )
    .optional(),
  observation_end: z
    .string()
    .default(new Date().toISOString().split("T")[0])
    .optional(),
});

// Chart schemas
export const LineConfigSchema = z.object({
  dataKey: z.string(),
  stroke: z.string(),
  yAxisId: z.string().optional(),
});

export const ChartDataPointSchema = z
  .object({
    timestamp: z.string(),
  })
  .catchall(z.union([z.string(), z.number()]));

export const LineChartPropsSchema = z.object({
  data: z.array(ChartDataPointSchema),
  xAxisDataKey: z.string(),
  lines: z.array(LineConfigSchema),
  height: z.number(),
  dualAxis: z.boolean().optional(),
});

// Metadata schemas
export const SeriesMetadataSchema = z.object({
  title: z.string(),
  observationRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
  frequency: z.string(),
  units: z.string(),
  seasonal_adjustment: z.string(),
});

// Available options schema
export const AvailableOptionsSchema = z.object({
  frequencies: z
    .array(
      z.object({
        value: FrequencyEnum,
        label: z.string(),
      })
    )
    .min(1),
  units: z
    .array(
      z.object({
        value: UnitsEnum,
        label: z.string(),
      })
    )
    .min(1),
  dateRange: z.object({
    min: z.string(),
    max: z.string(),
  }),
});

// Component props schemas
export const DataWrapperPropsSchema = z
  .object({
    initialParams: ExtendedFredParamsSchema,
    inputs: z.array(InputConfigSchema).optional(),
    showControls: z.boolean().optional(),
    height: z.number().optional(),
  })
  .required();

export const CanvasComponentPropsSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    fredParams: ExtendedFredParamsSchema,
    height: z.number(),
    inputs: z.array(InputConfigSchema).min(1),
  })
  .required();

// DataWrapper state and action types
export interface DataWrapperState {
  metadata: Record<string, SeriesMetadata>;
  data: Record<string, FredSeriesData> | null;
  availableOptions: AvailableOptions;
  loading: boolean;
  error: string | null;
  isDirty: boolean;
  isOpen: boolean;
  params: ExtendedFredParams;
}

export type DataWrapperAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_DIRTY"; payload: boolean }
  | { type: "SET_DATA"; payload: Record<string, FredSeriesData> }
  | { type: "SET_METADATA"; payload: Record<string, SeriesMetadata> }
  | { type: "SET_OPTIONS"; payload: AvailableOptions }
  | { type: "UPDATE_PARAMS"; payload: Partial<ExtendedFredParams> }
  | { type: "SET_OPEN"; payload: boolean };

// Export types
export type InputOption = z.infer<typeof InputOptionSchema>;
export type InputConfig = z.infer<typeof InputConfigSchema>;
export type FredParams = z.infer<typeof FredParamsSchema>;
export type ExtendedFredParams = z.infer<typeof ExtendedFredParamsSchema>;
export type LineConfig = z.infer<typeof LineConfigSchema>;
export type ChartDataPoint = z.infer<typeof ChartDataPointSchema>;
export type LineChartProps = z.infer<typeof LineChartPropsSchema>;
export type DataWrapperProps = z.infer<typeof DataWrapperPropsSchema>;
export type CanvasComponentProps = z.infer<typeof CanvasComponentPropsSchema>;
export type SeriesMetadata = z.infer<typeof SeriesMetadataSchema>;
export type AvailableOptions = z.infer<typeof AvailableOptionsSchema>;

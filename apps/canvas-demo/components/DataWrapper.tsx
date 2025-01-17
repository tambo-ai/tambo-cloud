"use client";

import { useEffect, useCallback, useReducer, useMemo } from "react";
import { fetchFredData, FREQUENCY_MAPPINGS, UNITS_MAPPINGS } from "@/lib/fred";
import type {
  InputConfig,
  InputOption,
  UnitsType,
  FrequencyType,
  AvailableOptions,
  DataWrapperState,
  DataWrapperAction,
} from "@/lib/schema";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LineChart } from "@/components/LineChart";
import { Loader2, ChevronRight } from "lucide-react";
import { DateRangePickerWithPresets } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";
import { MultipleSelector } from "@/components/ui/multi-selector";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { defaultTimeHorizons } from "@/utils/timeHorizons";
import { useMetadataCache } from "@/lib/hooks/useMetadataCache";
import {
  transformSeriesData,
  createLineConfigs,
} from "@/lib/utils/dataTransforms";

interface DataWrapperProps {
  initialParams: {
    series_id: string | string[];
    frequency: FrequencyType;
    units: UnitsType;
    multiSeries: boolean;
    dualAxis: boolean;
    observation_start?: string;
    observation_end?: string;
  };
  inputs: InputConfig[];
  showControls?: boolean;
  height: number;
  hideContainer?: boolean;
  onParamChange?: (
    paramName: string,
    oldValue: unknown,
    newValue: unknown
  ) => void;
}

const dataWrapperReducer = (
  state: DataWrapperState,
  action: DataWrapperAction
): DataWrapperState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_DIRTY":
      return { ...state, isDirty: action.payload };
    case "SET_DATA":
      return { ...state, data: action.payload };
    case "SET_METADATA":
      return { ...state, metadata: action.payload };
    case "SET_OPTIONS":
      return { ...state, availableOptions: action.payload };
    case "UPDATE_PARAMS":
      return {
        ...state,
        params: { ...state.params, ...action.payload },
        isDirty: true,
      };
    case "SET_OPEN":
      return { ...state, isOpen: action.payload };
    default:
      return state;
  }
};

export function DataWrapper({
  initialParams,
  inputs = [],
  showControls = true,
  height = 300,
  hideContainer = false,
  onParamChange,
}: DataWrapperProps & { hideContainer?: boolean }) {
  if (!initialParams) {
    throw new Error("initialParams is required");
  }

  // Set date range to past year by default
  const defaultDateRange = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setFullYear(from.getFullYear() - 1);
    return {
      from,
      to,
      observation_start: from.toISOString().split("T")[0],
      observation_end: to.toISOString().split("T")[0],
    };
  }, []);

  // Default available options
  const defaultOptions = useMemo(
    (): AvailableOptions => ({
      frequencies: [],
      units: Object.entries(UNITS_MAPPINGS).map(([value, label]) => ({
        value: value as UnitsType,
        label,
      })),
      dateRange: {
        min: "1900-01-01",
        max: new Date().toISOString().split("T")[0],
      },
    }),
    []
  );

  // Initialize state with reducer
  const [state, dispatch] = useReducer(dataWrapperReducer, {
    metadata: {},
    data: null,
    availableOptions: defaultOptions,
    loading: false,
    error: null,
    isDirty: false,
    isOpen: false,
    params: {
      ...initialParams,
      observation_start:
        initialParams.observation_start || defaultDateRange.observation_start,
      observation_end:
        initialParams.observation_end || defaultDateRange.observation_end,
    },
  });

  const {
    metadata,
    data,
    availableOptions,
    loading,
    error,
    isDirty,
    params,
    isOpen,
  } = state;

  // Get series IDs
  const seriesIds = useMemo(
    () =>
      Array.isArray(params.series_id) ? params.series_id : [params.series_id],
    [params.series_id]
  );

  // Use metadata cache hook
  const { fetchMetadata } = useMetadataCache();

  // Transform data for chart
  const chartData = useMemo(
    () => (data ? transformSeriesData(data) : []),
    [data]
  );

  // Create line configurations
  const lines = useMemo(
    () => (data ? createLineConfigs(Object.keys(data), params.dualAxis) : []),
    [data, params.dualAxis]
  );

  // Handle data fetching
  const handleFetch = useCallback(async () => {
    if (!seriesIds[0]) return;

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });
      dispatch({ type: "SET_DIRTY", payload: false });

      const now = new Date();
      const validEndDate =
        params.observation_end && new Date(params.observation_end) <= now
          ? params.observation_end
          : undefined;

      // Fetch data for all series
      const results = await Promise.all(
        seriesIds.map((id) =>
          fetchFredData({
            series_id: id,
            frequency: params.frequency,
            units: params.units,
            observation_start: params.observation_start,
            observation_end: validEndDate,
          })
        )
      ).then((seriesData) =>
        seriesData.reduce(
          (acc, data, index) => ({
            ...acc,
            [seriesIds[index]]: data,
          }),
          {}
        )
      );

      dispatch({ type: "SET_DATA", payload: results });
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        payload: err instanceof Error ? err.message : "Failed to fetch data",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [params, seriesIds]);

  // Update metadata and available options
  useEffect(() => {
    const updateMetadata = async () => {
      try {
        const {
          metadata: newMetadata,
          frequencies,
          dateRanges,
        } = await fetchMetadata(seriesIds);

        dispatch({ type: "SET_METADATA", payload: newMetadata });

        // Calculate available frequencies
        const availableFrequencies = Array.from(
          Object.values(frequencies).reduce((acc, freqs) => {
            freqs.forEach((f) => acc.add(f));
            return acc;
          }, new Set<FrequencyType>())
        ).map((f) => ({
          value: f,
          label: `${FREQUENCY_MAPPINGS[f]} (${f})`,
        }));

        // Calculate date range
        const newDateRange = {
          min: dateRanges.reduce(
            (acc, curr) => (acc > curr.start ? acc : curr.start),
            dateRanges[0].start
          ),
          max: dateRanges.reduce(
            (acc, curr) => (acc < curr.end ? acc : curr.end),
            dateRanges[0].end
          ),
        };

        dispatch({
          type: "SET_OPTIONS",
          payload: {
            frequencies: availableFrequencies,
            dateRange: newDateRange,
            units: defaultOptions.units,
          },
        });
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload:
            error instanceof Error ? error.message : "Failed to fetch metadata",
        });
      }
    };

    void updateMetadata();
  }, [fetchMetadata, seriesIds, defaultOptions.units]);

  // Fetch data when needed
  useEffect(() => {
    if (!isDirty) {
      void handleFetch();
    }
  }, [handleFetch, isDirty]);

  // Update params with tracking
  const updateParams = useCallback(
    (key: string, oldValue: unknown, newValue: unknown) => {
      dispatch({
        type: "UPDATE_PARAMS",
        payload: { [key]: newValue },
      });
      onParamChange?.(key, oldValue, newValue);
    },
    [dispatch, onParamChange]
  );

  // Handle fetch button click
  const handleFetchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    void handleFetch();
  };

  const dateRange = useMemo(
    () => ({
      from: params.observation_start
        ? new Date(params.observation_start)
        : undefined,
      to: params.observation_end ? new Date(params.observation_end) : undefined,
    }),
    [params.observation_start, params.observation_end]
  );

  const onDateRangeChange = useCallback(
    (range: DateRange) => {
      if (range.from && range.to) {
        const oldStart = params.observation_start;
        const oldEnd = params.observation_end;
        const newStart = range.from.toISOString().split("T")[0];
        const newEnd = range.to.toISOString().split("T")[0];

        updateParams("observation_start", oldStart, newStart);
        updateParams("observation_end", oldEnd, newEnd);
      }
    },
    [params.observation_start, params.observation_end, updateParams]
  );

  // Render input based on type
  const renderInput = useCallback(
    (input: InputConfig) => {
      const value = params[input.key as keyof typeof params];

      switch (input.type) {
        case "date":
          return (
            <div key={input.key} className="flex flex-col space-y-2">
              <Label className="text-sm font-medium">{input.label}</Label>
              <DateRangePickerWithPresets
                dateRange={{
                  from: params.observation_start
                    ? new Date(params.observation_start)
                    : undefined,
                  to: params.observation_end
                    ? new Date(params.observation_end)
                    : undefined,
                }}
                onDateRangeChange={onDateRangeChange}
                presets={defaultTimeHorizons}
              />
            </div>
          );

        case "select":
          if (input.key !== "frequency" && input.key !== "units") return null;

          const options =
            input.key === "frequency"
              ? availableOptions.frequencies
              : availableOptions.units;

          return (
            <div key={input.key} className="flex flex-col space-y-2">
              <Label className="text-sm font-medium">{input.label}</Label>
              <Select
                value={value as string}
                onValueChange={(val) => {
                  const oldValue = params[input.key];
                  updateParams(input.key, oldValue, val);
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="text-sm"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );

        case "multi-select":
          if (input.key !== "series_id") return null;
          const seriesValue = value as string | string[];
          const currentOptions = Array.isArray(seriesValue)
            ? seriesValue.map((v) => ({
                value: v,
                label: metadata[v]?.title || v,
              }))
            : seriesValue
              ? [
                  {
                    value: seriesValue,
                    label: metadata[seriesValue]?.title || seriesValue,
                  },
                ]
              : [];

          // Combine current options with default options, removing duplicates
          const allOptions = [
            ...(input.defaultOptions || []),
            ...(input.options || []),
          ].filter(
            (option, index, self) =>
              index === self.findIndex((o) => o.value === option.value)
          );

          return (
            <div key={input.key} className="flex flex-col space-y-2">
              <Label className="text-sm font-medium">{input.label}</Label>
              <MultipleSelector
                defaultOptions={allOptions}
                options={allOptions}
                value={currentOptions}
                onChange={(selectedOptions: InputOption[]) => {
                  const oldValue = params[input.key];
                  const newValue = selectedOptions.map((opt) => opt.value);
                  const finalValue =
                    newValue.length === 1 ? newValue[0] : newValue;
                  updateParams(input.key, oldValue, finalValue);
                }}
                placeholder={input.placeholder}
                emptyIndicator={
                  <p className="text-center text-sm leading-10 text-muted-foreground">
                    No results found.
                  </p>
                }
              />
            </div>
          );

        default:
          return null;
      }
    },
    [metadata, params, availableOptions, updateParams]
  );

  return (
    <div className={cn("space-y-3", hideContainer ? "px-4" : "-mx-1")}>
      {showControls && (
        <Collapsible
          open={isOpen}
          onOpenChange={(open) => dispatch({ type: "SET_OPEN", payload: open })}
          className={cn("rounded-lg border", !hideContainer && "bg-card")}
        >
          <div className="p-4 space-y-6">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 hover:bg-transparent hover:underline flex items-center"
                >
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-200",
                      isOpen && "rotate-90"
                    )}
                  />
                  <span className="ml-2">Update Visualization Data</span>
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-6">
              <div className="space-y-6">
                <div>
                  <DateRangePickerWithPresets
                    dateRange={{
                      from: dateRange.from,
                      to: dateRange.to,
                    }}
                    onDateRangeChange={onDateRangeChange}
                    presets={defaultTimeHorizons}
                  />
                </div>
                <div className="space-y-4">{inputs.map(renderInput)}</div>
                <Button
                  onClick={handleFetchClick}
                  disabled={loading || !isDirty}
                  className="w-full h-8 flex items-center justify-center gap-2 text-sm"
                  variant={isDirty ? "default" : "secondary"}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Updating Graph...
                    </>
                  ) : (
                    "Update Graph"
                  )}
                </Button>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      {error && (
        <div className="p-1.5 sm:p-2 bg-red-50 text-red-600 rounded-md text-xs sm:text-sm border border-red-200">
          {error}
        </div>
      )}

      {data && (
        <div>
          <div style={{ height: `${height}px`, width: "100%" }}>
            <LineChart
              data={chartData}
              xAxisDataKey="timestamp"
              lines={lines}
              height={height}
              dualAxis={params.dualAxis}
            />
          </div>
        </div>
      )}
    </div>
  );
}

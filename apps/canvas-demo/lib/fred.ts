import { z } from "zod";
import {
  FrequencyType,
  UnitsType,
  FrequencyEnum,
  UnitsEnum,
} from "@/lib/schema";

// FRED API response schemas
export const fredSeriesSchema = z.object({
  realtime_start: z.string(),
  realtime_end: z.string(),
  observation_start: z.string(),
  observation_end: z.string(),
  units: z.string(),
  output_type: z.number(),
  order_by: z.string(),
  sort_order: z.string(),
  count: z.number(),
  offset: z.number(),
  limit: z.number(),
  observations: z.array(
    z.object({
      realtime_start: z.string(),
      realtime_end: z.string(),
      date: z.string(),
      value: z.string(),
    })
  ),
});

export const fredSearchResultSchema = z.object({
  id: z.string(),
  realtime_start: z.string(),
  realtime_end: z.string(),
  title: z.string(),
  observation_start: z.string(),
  observation_end: z.string(),
  frequency: z.string(),
  frequency_short: z.string(),
  units: z.string(),
  units_short: z.string(),
  seasonal_adjustment: z.string(),
  seasonal_adjustment_short: z.string(),
  last_updated: z.string(),
  popularity: z.number(),
  notes: z.string().optional(),
});

// FRED API parameter schema
export const fredParamsSchema = z.object({
  series_id: z.string(),
  observation_start: z.string().optional(),
  observation_end: z.string().optional(),
  units: UnitsEnum.optional(),
  frequency: FrequencyEnum.optional(),
  aggregation_method: z.enum(["avg", "sum", "eop"]).optional(),
  output_type: z.enum(["1", "2", "3", "4"]).optional(),
  vintage_dates: z.string().optional(),
});

// Types
export type FredSeriesData = z.infer<typeof fredSeriesSchema>;
export type FredSearchResult = z.infer<typeof fredSearchResultSchema>;
export type FredParams = z.infer<typeof fredParamsSchema>;

// API value mappings
export const FREQUENCY_MAPPINGS: Record<FrequencyType, string> = {
  d: "Daily",
  w: "Weekly",
  bw: "Biweekly",
  m: "Monthly",
  q: "Quarterly",
  sa: "Semiannual",
  a: "Annual",
} as const;

export const REVERSE_FREQUENCY_MAPPINGS: Record<string, FrequencyType> =
  Object.entries(FREQUENCY_MAPPINGS).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [value]: key as FrequencyType,
    }),
    {} as Record<string, FrequencyType>
  );

export const UNITS_MAPPINGS: Record<UnitsType, string> = {
  lin: "Levels",
  chg: "Change",
  ch1: "Change from Year Ago",
  pch: "Percent Change",
  pc1: "Percent Change from Year Ago",
  pca: "Compounded Annual Rate of Change",
  cch: "Continuously Compounded Rate of Change",
  log: "Natural Log",
} as const;

// Helper functions
export function apiFrequencyToParam(apiFreq: string): FrequencyType {
  const paramValue = REVERSE_FREQUENCY_MAPPINGS[apiFreq];
  if (!paramValue) {
    return "m"; // Default to monthly if unknown
  }
  return paramValue;
}

export function paramFrequencyToDisplay(param: FrequencyType): string {
  const displayValue = FREQUENCY_MAPPINGS[param];
  if (!displayValue) {
    throw new Error(`Unknown frequency param: ${param}`);
  }
  return displayValue;
}

// API functions
export async function fetchFredData(
  params: FredParams
): Promise<FredSeriesData> {
  const url = new URL("/api/fred/series/observations", window.location.origin);
  const paramsWithJson = { ...params, file_type: "json" };

  Object.entries(paramsWithJson).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, value.toString());
    }
  });

  const response = await fetch(url.toString());

  if (!response.ok) {
    let errorMessage = `Failed to fetch FRED data: ${response.statusText}`;
    try {
      const errorData = (await response.json()) as unknown;
      const parsedError = errorResponseSchema.safeParse(errorData);
      if (parsedError.success && parsedError.data.error) {
        errorMessage = parsedError.data.error;
      }
    } catch {
      // Use default error message if JSON parsing fails
    }
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as unknown;
  const result = fredSeriesSchema.safeParse(data);

  if (!result.success) {
    throw new Error(`Invalid FRED data format: ${result.error.message}`);
  }

  return result.data;
}

// Search functions
export const searchParamsSchema = z.object({
  searchText: z.union([z.string(), z.array(z.string())]),
});

export async function searchFredSeries(
  searchText: z.infer<typeof searchParamsSchema>["searchText"]
): Promise<FredSearchResult[]> {
  const params = searchParamsSchema.parse({ searchText });
  const url = new URL("/api/fred/series/search", window.location.origin);

  const searchTerm = Array.isArray(params.searchText)
    ? params.searchText.join(" ")
    : params.searchText;

  url.searchParams.append("search_type", "full_text");
  url.searchParams.append("limit", "10");
  url.searchParams.append("order_by", "popularity");
  url.searchParams.append("sort_order", "desc");
  url.searchParams.append("search_text", searchTerm);
  url.searchParams.append("file_type", "json");

  const response = await fetch(url.toString());

  if (!response.ok) {
    let errorMessage = `Failed to search FRED series: ${response.statusText}`;
    try {
      const errorData = (await response.json()) as unknown;
      const parsedError = errorResponseSchema.safeParse(errorData);
      if (parsedError.success && parsedError.data.error) {
        errorMessage = parsedError.data.error;
      }
    } catch {
      // Use default error message if JSON parsing fails
    }
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as unknown;

  // Define schema for the search response
  const searchResponseSchema = z.object({
    seriess: z.array(fredSearchResultSchema),
  });

  const result = searchResponseSchema.safeParse(data);

  if (!result.success) {
    throw new Error(
      `Invalid FRED search response format: ${result.error.message}`
    );
  }

  return result.data.seriess;
}

// Series info schema and function
export const fredSeriesInfoSchema = z.object({
  id: z.string(),
  realtime_start: z.string(),
  realtime_end: z.string(),
  title: z.string(),
  observation_start: z.string(),
  observation_end: z.string(),
  frequency: z.string(),
  frequency_short: z.string(),
  units: z.string(),
  units_short: z.string(),
  seasonal_adjustment: z.string(),
  seasonal_adjustment_short: z.string(),
  last_updated: z.string(),
  popularity: z.number(),
  group_popularity: z.number().optional(),
  notes: z.string().optional(),
});

export type FredSeriesInfo = z.infer<typeof fredSeriesInfoSchema>;

export async function fetchFredSeriesInfo(
  seriesId: string
): Promise<FredSeriesInfo> {
  const url = new URL("/api/fred/series/search", window.location.origin);
  url.searchParams.append("search_text", seriesId);
  url.searchParams.append("search_type", "series_id");
  url.searchParams.append("file_type", "json");

  const response = await fetch(url.toString());

  if (!response.ok) {
    let errorMessage = `Failed to fetch series info: ${response.statusText}`;
    try {
      const errorData = (await response.json()) as unknown;
      const parsedError = errorResponseSchema.safeParse(errorData);
      if (parsedError.success && parsedError.data.error) {
        errorMessage = parsedError.data.error;
      }
    } catch {
      // Use default error message if JSON parsing fails
    }
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as unknown;

  // Define schema for the series info response
  const seriesInfoResponseSchema = z.object({
    seriess: z.array(fredSeriesInfoSchema).min(1),
  });

  const result = seriesInfoResponseSchema.safeParse(data);

  if (!result.success) {
    throw new Error(`Invalid FRED series info format: ${result.error.message}`);
  }

  return result.data.seriess[0];
}

// Add error response type
const errorResponseSchema = z.object({
  error: z.string().optional(),
});

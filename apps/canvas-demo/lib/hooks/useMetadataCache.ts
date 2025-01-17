import { useRef, useCallback } from "react";
import { fetchFredSeriesInfo, apiFrequencyToParam } from "@/lib/fred";
import type { SeriesMetadata } from "@/lib/schema";
import type { FrequencyType } from "@/lib/schema";

type MetadataCache = Record<string, SeriesMetadata>;
type SeriesFrequencies = Record<string, Set<FrequencyType>>;

export function useMetadataCache() {
  const cache = useRef<MetadataCache>({});

  const fetchMetadata = useCallback(async (seriesIds: string[]) => {
    const metadataResults: MetadataCache = {};
    const seriesFrequencies: SeriesFrequencies = {};
    const dateRanges: { start: string; end: string }[] = [];

    await Promise.all(
      seriesIds.map(async (id) => {
        // Use cached metadata if available
        if (cache.current[id]) {
          const cached = cache.current[id];
          metadataResults[id] = cached;
          const freqParam = apiFrequencyToParam(cached.frequency);
          if (freqParam) {
            seriesFrequencies[id] = new Set([freqParam as FrequencyType]);
          }
          dateRanges.push(cached.observationRange);
          return;
        }

        // Fetch new metadata
        const info = await fetchFredSeriesInfo(id);
        const metadata: SeriesMetadata = {
          title: info.title,
          observationRange: {
            start: info.observation_start,
            end: info.observation_end,
          },
          frequency: info.frequency,
          units: info.units,
          seasonal_adjustment: info.seasonal_adjustment,
        };

        metadataResults[id] = metadata;
        cache.current[id] = metadata;

        const freqParam = apiFrequencyToParam(info.frequency);
        if (freqParam) {
          seriesFrequencies[id] = new Set([freqParam as FrequencyType]);
        }
        dateRanges.push({
          start: info.observation_start,
          end: info.observation_end,
        });
      })
    );

    return {
      metadata: metadataResults,
      frequencies: seriesFrequencies,
      dateRanges,
    };
  }, []);

  const clearCache = useCallback(() => {
    cache.current = {};
  }, []);

  return {
    fetchMetadata,
    clearCache,
    getCachedMetadata: (id: string) => cache.current[id],
  };
}

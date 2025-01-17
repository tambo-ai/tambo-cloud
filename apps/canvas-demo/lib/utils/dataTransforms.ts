import type { FredSeriesData } from "@/lib/fred";
import type { ChartDataPoint, LineConfig } from "@/lib/schema";

type Observation = {
  date: string;
  value: string;
};

export const transformSeriesData = (
  data: Record<string, FredSeriesData>
): ChartDataPoint[] => {
  // Convert series data to chart points
  const chartPoints = Object.entries(data).flatMap(([seriesId, seriesData]) =>
    seriesData.observations.map((obs: Observation) => ({
      timestamp: obs.date,
      [seriesId]: parseFloat(obs.value) || 0,
    }))
  );

  // Merge points with same timestamp
  const mergedPoints = chartPoints.reduce<ChartDataPoint[]>((acc, curr) => {
    const existing = acc.find((item) => item.timestamp === curr.timestamp);
    if (existing) {
      return acc.map((item) =>
        item.timestamp === curr.timestamp ? { ...item, ...curr } : item
      );
    }
    return [...acc, curr as ChartDataPoint];
  }, []);

  // Sort by timestamp
  return mergedPoints.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
};

export const createLineConfigs = (
  seriesIds: string[],
  dualAxis: boolean
): LineConfig[] => {
  return seriesIds.map((seriesId, index) => ({
    dataKey: seriesId,
    stroke: index === 0 ? "#8884d8" : "#82ca9d",
    yAxisId: dualAxis && index === 1 ? "right" : "left",
  }));
};

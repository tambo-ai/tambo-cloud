import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { LineChartProps } from "@/lib/schema";

export function LineChart({
  data,
  xAxisDataKey,
  lines,
  height,
  dualAxis,
}: LineChartProps) {
  const formatDate = (value: string | number | Date) => {
    const date = new Date(value);
    return date.toLocaleDateString(undefined, {
      year: "2-digit",
      month: "short",
    });
  };

  const formatFullDate = (value: string | number | Date) => {
    const date = new Date(value);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey={xAxisDataKey}
          tick={{ fontSize: 12 }}
          tickFormatter={formatDate}
        />
        <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
        {dualAxis && (
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
        )}
        <Tooltip labelFormatter={formatFullDate} />
        <Legend />
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.stroke}
            yAxisId={line.yAxisId}
            dot={false}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

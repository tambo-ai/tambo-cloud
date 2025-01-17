import {
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ScatterChartProps {
  data: Array<{ [key: string]: number | string }>;
  xAxisDataKey: string;
  yAxisDataKey: string;
  name: string;
  fill?: string;
  height?: number;
}

export function ScatterChart({
  data,
  xAxisDataKey,
  yAxisDataKey,
  name,
  fill = "#8884d8",
  height = 300,
}: ScatterChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsScatterChart
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      >
        <CartesianGrid />
        <XAxis type="number" dataKey={xAxisDataKey} name={xAxisDataKey} />
        <YAxis type="number" dataKey={yAxisDataKey} name={yAxisDataKey} />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
        <Legend />
        <Scatter name={name} data={data} fill={fill} />
      </RechartsScatterChart>
    </ResponsiveContainer>
  );
}

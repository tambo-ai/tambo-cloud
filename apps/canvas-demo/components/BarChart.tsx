import {
  Bar,
  BarChart as RechartsBarChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface BarChartProps {
  data: Array<{ [key: string]: string | number }>;
  xAxisDataKey: string;
  bars: Array<{ dataKey: string; fill: string }>;
  height?: number;
}

export function BarChart({
  data,
  xAxisDataKey,
  bars,
  height = 300,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisDataKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {bars.map((bar, index) => (
          <Bar key={index} dataKey={bar.dataKey} fill={bar.fill} />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

import {
  ResponsiveContainer,
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface AreaChartProps {
  data: Array<{ [key: string]: string | number }>;
  xAxisDataKey: string;
  areaDataKey: string;
  color: string;
  height?: number;
}

export function AreaChart({
  data,
  xAxisDataKey,
  areaDataKey,
  color,
  height = 300,
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisDataKey} />
        <YAxis />
        <Tooltip />
        <Area
          type="monotone"
          dataKey={areaDataKey}
          stroke={color}
          fill={color}
          fillOpacity={0.3}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}

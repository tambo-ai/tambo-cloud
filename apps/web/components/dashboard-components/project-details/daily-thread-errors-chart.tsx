"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { api } from "@/trpc/react";
import { motion } from "framer-motion";
import { Line, LineChart, XAxis, YAxis } from "recharts";

interface DailyThreadErrorsChartProps {
  projectId: string;
}

const chartConfig = {
  errors: {
    label: "Thread Errors",
    color: "hsl(var(--chart-6))",
  },
};

const formatDate = (
  dateString: string,
  format: "chart" | "tooltip" | "header",
): string => {
  const date = new Date(dateString);

  switch (format) {
    case "chart":
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    case "tooltip":
      return date.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    case "header":
      return date.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
    default:
      return dateString;
  }
};

export function DailyThreadErrorsChart({
  projectId,
}: DailyThreadErrorsChartProps) {
  const { data: dailyErrors, isLoading } =
    api.project.getProjectDailyThreadErrors.useQuery(
      { projectId, days: 30 },
      {
        enabled: !!projectId,
      },
    );

  if (isLoading) {
    return (
      <Card className="border border-none bg-transparent overflow-hidden shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Thread Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!dailyErrors?.length) {
    return (
      <Card className="border border-none bg-transparent overflow-hidden shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Thread Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No error data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Process chart data: generate 30-day timeline with error counts
  const errorsMap = new Map(
    dailyErrors.map((item) => [item.date, item.errors]),
  );
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dateString = date.toISOString().split("T")[0];
    return {
      date: dateString,
      errors: errorsMap.get(dateString) || 0,
      formattedDate: formatDate(dateString, "chart"),
    };
  });

  // Show only first and last dates on x-axis
  const tickFormatter = (value: string, index: number) =>
    index === 0 || index === chartData.length - 1 ? value : "";

  // Format the label for the tooltip
  const labelFormatter = (label: string) => {
    const item = chartData.find((d) => d.formattedDate === label);
    return item ? formatDate(item.date, "tooltip") : label;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border border-none bg-transparent overflow-hidden shadow-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Thread Errors</CardTitle>
            <p className="text-sm text-muted-foreground">
              Error activity over the last 30 days
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Data as of {formatDate(new Date().toISOString(), "header")}
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <LineChart data={chartData}>
              <XAxis
                dataKey="formattedDate"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={tickFormatter}
              />
              <YAxis
                tick={{ fontSize: 12, dx: -30 }}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, _name) => [`${value} errors`]}
                    labelFormatter={labelFormatter}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="errors"
                stroke={chartConfig.errors.color}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { openChat } from "@/lib/chat-control";
import { toDateKeyUTC } from "@/lib/utils";
import { api } from "@/trpc/react";
import { withInteractable } from "@tambo-ai/react";
import { motion } from "framer-motion";
import { MessageCircleIcon, PencilIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { DashboardGraph } from "./dashboard-graph";

type TimeRange = "daily" | "weekly" | "monthly";

export const DailyMessagesChartSchema = z.object({
  projectId: z
    .string()
    .min(10, "Project ID must be at least 10 characters")
    .describe(
      "The project ID to fetch daily messages for. Must be a complete, valid project ID starting with 'p_'",
    ),
  days: z
    .number()
    .min(1)
    .max(90)
    .optional()
    .describe(
      "Number of days to display (1-90, optional - defaults based on view)",
    ),
  initialTimeRange: z
    .enum(["daily", "weekly", "monthly"])
    .optional()
    .describe(
      "Initial time range view for the chart. Options: daily (30 days), weekly (12 weeks), monthly (3 months). Defaults to daily.",
    ),
});

export type DailyMessagesChartProps = z.infer<typeof DailyMessagesChartSchema>;

const TIME_RANGE_CONFIG = {
  daily: {
    days: 30,
    periods: 30,
    label: "Daily",
    description: "the last 30 days",
  },
  weekly: {
    days: 84,
    periods: 12,
    label: "Weekly",
    description: "the last 12 weeks",
  },
  monthly: {
    days: 90,
    periods: 3,
    label: "Monthly",
    description: "the last 3 months",
  },
} as const;

const formatChartLabel = (date: Date, timeRange: TimeRange): string => {
  const options =
    timeRange === "monthly"
      ? { month: "short" as const, year: "numeric" as const }
      : { month: "short" as const, day: "numeric" as const };
  return date.toLocaleDateString(undefined, options);
};

function DailyMessagesChartBase({
  projectId,
  days: propDays,
  initialTimeRange = "daily",
}: DailyMessagesChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);

  // Update timeRange when initialTimeRange prop changes
  useEffect(() => {
    setTimeRange(initialTimeRange);
  }, [initialTimeRange]);

  // Calculate days based on time range
  const config = TIME_RANGE_CONFIG[timeRange];
  const days = propDays ?? config.days;

  const {
    data: dailyMessages,
    isLoading,
    error,
  } = api.project.getProjectDailyMessages.useQuery(
    { projectId, days },
    {
      enabled: !!projectId && projectId.length > 10,
      retry: false,
    },
  );

  if (isLoading) {
    return (
      <Card className="border border-none bg-transparent overflow-hidden shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Message Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (error || !dailyMessages) {
    return (
      <Card className="border border-none bg-transparent overflow-hidden shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Message Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <MessageCircleIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {error
                  ? "Unable to load message activity"
                  : "No data available"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const messagesMap = new Map(
    dailyMessages?.map((item) => [item.date, item.messages]) || [],
  );

  // Aggregate data based on time range
  const { labels, data } = (() => {
    const result: Array<{ label: string; total: number }> = [];

    if (timeRange === "daily") {
      // Daily: one point per day
      for (let i = 0; i < config.periods; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (config.periods - 1 - i));
        const dateString = toDateKeyUTC(date);

        result.push({
          label: formatChartLabel(date, timeRange),
          total: messagesMap.get(dateString) || 0,
        });
      }
    } else if (timeRange === "weekly") {
      // Weekly: aggregate 7 days per point
      for (let i = 0; i < config.periods; i++) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (config.periods - 1 - i) * 7);

        let total = 0;
        for (let day = 0; day < 7; day++) {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + day);
          total += messagesMap.get(toDateKeyUTC(date)) || 0;
        }

        result.push({ label: formatChartLabel(weekStart, timeRange), total });
      }
    } else {
      // Monthly: aggregate by calendar month
      for (let i = 0; i < config.periods; i++) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - (config.periods - 1 - i));
        monthDate.setDate(1);

        const monthStart = toDateKeyUTC(monthDate);
        const monthEnd = toDateKeyUTC(
          new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1),
        );

        let total = 0;
        messagesMap.forEach((count, dateString) => {
          if (dateString >= monthStart && dateString < monthEnd) {
            total += count;
          }
        });

        result.push({ label: formatChartLabel(monthDate, timeRange), total });
      }
    }

    return {
      labels: result.map((r) => r.label),
      data: result.map((r) => r.total),
    };
  })();

  const handleEditChart = () => {
    openChat({
      message: `Show me the monthly view of Message Activity (90 days) for this project.`,
      context: {
        component: "DailyMessagesChart",
        props: { projectId, initialTimeRange: "monthly", days: 90 },
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border border-none bg-transparent overflow-hidden shadow-none">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-base sm:text-lg">
                Message Activity
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Message activity over {config.description}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs sm:text-sm text-muted-foreground">
                <span className="hidden sm:inline">Dates as of </span>
                {new Date().toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <button
                onClick={handleEditChart}
                className="p-2 rounded-md hover:bg-muted transition-colors"
                aria-label="Edit chart with Tambo"
                title="Edit chart with Tambo"
              >
                <PencilIcon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[400px]">
              <DashboardGraph
                data={{
                  type: "bar" as const,
                  labels,
                  datasets: [
                    {
                      label: "Messages",
                      data,
                      color: "hsl(var(--chart-6))",
                    },
                  ],
                }}
                variant="default"
                size="default"
                showLegend={false}
                className="h-48 sm:h-64 md:h-72"
                emptyState={{
                  icon: <MessageCircleIcon className="w-6 h-6" />,
                  title: "No messages yet",
                  description:
                    "Message activity will appear here once your project starts receiving messages.",
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export const DailyMessagesChart = withInteractable(DailyMessagesChartBase, {
  componentName: "DailyMessagesChart",
  description:
    "An interactive bar chart showing message activity for a project with three view modes: daily, weekly, or monthly. Users can ask to change the view and the chart will update in place.",
  propsSchema: DailyMessagesChartSchema,
});

"use client";

import { memo, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  TrendingUp,
  CircleDollarSign,
  Building2,
  LineChart,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionCard {
  title: string;
  description: string;
  icon: LucideIcon;
  action: string;
}

const EMPTY_STATE_ACTIONS: ActionCard[] = [
  {
    title: "Economic Indicators",
    description:
      "Ask about GDP, inflation, unemployment, and other key metrics",
    icon: TrendingUp,
    action: "indicators",
  },
  {
    title: "Monetary Policy",
    description: "Explore Federal Funds Rate, money supply, and Fed actions",
    icon: CircleDollarSign,
    action: "monetary",
  },
  {
    title: "Banking Data",
    description: "Query bank reserves, lending rates, and financial conditions",
    icon: Building2,
    action: "banking",
  },
  {
    title: "Historical Analysis",
    description:
      "Compare trends and analyze data across different time periods",
    icon: LineChart,
    action: "historical",
  },
] as const;

interface ActionCardProps extends Omit<ActionCard, "action"> {
  onAction: () => void;
}

const ActionCardComponent = memo(function ActionCardComponent({
  title,
  description,
  icon: Icon,
  onAction,
}: ActionCardProps) {
  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:bg-muted/50 hover:scale-[1.02] active:scale-[0.98]"
      onClick={onAction}
    >
      <CardHeader>
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
});

interface EmptyStateProps {
  onAction?: (action: string) => void;
  className?: string;
}

export function EmptyState({ onAction, className }: EmptyStateProps) {
  const handleAction = useCallback(
    (action: string) => {
      onAction?.(action);
    },
    [onAction]
  );

  return (
    <div
      className={cn("w-full p-4 sm:p-6 lg:p-8 @container", className)}
      role="region"
      aria-label="Empty State"
    >
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">
          Explore Federal Reserve Data
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
          Select a category below to start analyzing economic data
        </p>
      </div>

      <div
        className="grid grid-cols-1 @[600px]:grid-cols-2 @[900px]:grid-cols-4 gap-4 auto-rows-fr"
        role="grid"
        aria-label="Data Categories"
      >
        {EMPTY_STATE_ACTIONS.map(({ action, ...cardProps }) => (
          <div key={action} role="gridcell">
            <ActionCardComponent
              {...cardProps}
              onAction={() => handleAction(action)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

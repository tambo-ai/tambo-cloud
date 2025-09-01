"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Customer } from "autumn-js";
import { AlertCircle, CheckCircle2, MessageSquare } from "lucide-react";

/**
 * Constants
 */

// These should ideally come from Autumn's product configuration
// but are currently hardcoded as business rules
const FALLBACK_MESSAGE_LIMIT = 200000; // Fallback when Autumn data is unavailable
const OVERAGE_RATE_PER_100K = 8; // This is a business constant - $8 per 100k messages
const APPROACHING_LIMIT_THRESHOLD = 5000;

/**
 * Types
 */

interface UsageOverviewProps {
  customer: Customer | null;
}

interface FeatureUsageCardProps {
  icon: React.ReactNode;
  title: string;
  usage: number;
  limit?: number;
  unlimited?: boolean;
  unit?: string;
  resetDate?: string;
  isInOverage?: boolean;
}

interface StatusAlertProps {
  type: "overage" | "approaching" | "at-limit" | "good";
  usage: number;
  messagesLimit: number;
  messagesBalance?: number;
  overageAmount?: number;
  overageCost?: number;
  isFreePlan?: boolean;
}

interface OveragePillProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "muted";
}

interface UsageMetrics {
  usage: number;
  messagesLimit: number;
  messagesBalance: number;
  isInOverage: boolean;
  isAtLimit: boolean;
  overageAmount: number;
  overageCost: number;
}

/**
 * Utility functions
 */

/**
 * Calculate usage metrics from customer features
 */
function calculateUsageMetrics(features: Customer["features"]): UsageMetrics {
  const messagesFeature = features?.messages;
  // Use Autumn's included_usage, fallback to default if not available
  const messagesLimit =
    messagesFeature?.included_usage || FALLBACK_MESSAGE_LIMIT;
  const messagesBalance = messagesFeature?.balance || 0;
  const usage = messagesLimit - messagesBalance;
  const isInOverage = usage > messagesLimit;
  const isAtLimit = usage === messagesLimit;
  const overageAmount = Math.max(0, usage - messagesLimit);
  // Overage rate is a business constant until Autumn exposes it
  const overageCost = Math.ceil(overageAmount / 100000) * OVERAGE_RATE_PER_100K;

  return {
    usage,
    messagesLimit,
    messagesBalance,
    isInOverage,
    isAtLimit,
    overageAmount,
    overageCost,
  };
}

/**
 * Calculate the reset date for billing period
 */
function calculateResetDate(): string {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return nextMonth.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Determine if user is on free plan
 */
function checkIsFreePlan(
  activeProduct: Customer["products"][0] | undefined,
): boolean {
  const planName = activeProduct?.name || "Free";
  return !activeProduct || planName.toLocaleLowerCase() === "free";
}

/**
 * Sub-components
 */

/**
 * Overage information pill component
 */
function OveragePill({ children, variant = "primary" }: OveragePillProps) {
  const variants = {
    primary: "bg-amber-100",
    secondary: "bg-white/80",
    muted: "bg-white/60",
  };

  const textColors = {
    primary: "text-amber-900",
    secondary: "text-amber-700",
    muted: "text-amber-700",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
        variants[variant],
      )}
    >
      <span
        className={cn(
          "text-xs",
          variant === "primary" ? "font-medium" : "",
          textColors[variant],
        )}
      >
        {children}
      </span>
    </div>
  );
}

/**
 * Status alert component for different usage states
 */
function StatusAlert({
  type,
  usage,
  messagesLimit,
  messagesBalance = 0,
  overageAmount = 0,
  overageCost = 0,
  isFreePlan = false,
}: StatusAlertProps) {
  const configs = {
    overage: {
      borderColor: "border-blue-200",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      titleColor: "text-blue-900",
      textColor: "text-blue-700",
      title: "Usage-based pricing active",
      Icon: AlertCircle,
    },
    approaching: {
      borderColor: "border-amber-200",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      titleColor: "text-amber-900",
      textColor: "text-amber-700",
      title: "Approaching usage limit",
      Icon: AlertCircle,
    },
    "at-limit": {
      borderColor: "border-yellow-200",
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
      titleColor: "text-yellow-900",
      textColor: "text-yellow-700",
      title: "At limit",
      Icon: AlertCircle,
    },
    good: {
      borderColor: "border-green-200",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      titleColor: "text-green-900",
      textColor: "text-green-700",
      title: "Usage is within limits",
      Icon: CheckCircle2,
    },
  };

  const config = configs[type];
  const Icon = config.Icon;

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        config.borderColor,
        config.bgColor,
      )}
    >
      <div className="flex gap-2">
        <Icon
          className={cn("w-5 h-5 flex-shrink-0 mt-0.5", config.iconColor)}
        />
        <div className="flex-1">
          <h4 className={cn("text-sm font-medium", config.titleColor)}>
            {config.title}
          </h4>
          <p className={cn("text-sm mt-1", config.textColor)}>
            {type === "overage" && (
              <>
                You&apos;ve exceeded your {messagesLimit.toLocaleString()}{" "}
                message allowance.
              </>
            )}
            {type === "approaching" && (
              <>
                You&apos;re approaching your {messagesLimit.toLocaleString()}{" "}
                message allowance. Only {messagesBalance.toLocaleString()}{" "}
                messages remaining.
              </>
            )}
            {type === "at-limit" && (
              <>
                You have used {usage.toLocaleString()} of your{" "}
                {messagesLimit.toLocaleString()} message allowance. Usage-based
                pricing will be applied from now on.
              </>
            )}
            {type === "good" && (
              <>
                You have used {usage.toLocaleString()} of your{" "}
                {messagesLimit.toLocaleString()} message allowance.
              </>
            )}
          </p>

          {/* Overage Details for overage state */}
          {type === "overage" && (
            <div className="mt-3 flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 rounded-full">
                <span className="text-xs font-medium text-blue-900">
                  Overage: {overageAmount.toLocaleString()} messages
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/80 rounded-full">
                <span className="text-xs font-medium text-blue-900">
                  Est. cost: ${overageCost}
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/60 rounded-full">
                <span className="text-xs text-blue-700">Rate: $8 per 100k</span>
              </div>
            </div>
          )}

          {/* Overage Info Pills for approaching state */}
          {type === "approaching" && !isFreePlan && (
            <div className="mt-3 flex flex-wrap gap-2">
              <OveragePill variant="primary">
                ⚠️ {messagesBalance.toLocaleString()} left
              </OveragePill>
              <OveragePill variant="primary">
                📈 Overage rate: $8 per 100k
              </OveragePill>
              <OveragePill variant="secondary">
                Auto-billed at end of period
              </OveragePill>
            </div>
          )}

          {/* Overage Info for good state */}
          {type === "good" && !isFreePlan && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100/70 rounded-full text-xs text-green-800 border border-green-200">
                💡 Additional usage: $8 per 100k after limit
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Feature usage card component
 */
function FeatureUsageCard({
  icon,
  title,
  usage,
  limit,
  unlimited,
  unit = "",
  resetDate,
  isInOverage = false,
}: FeatureUsageCardProps) {
  const percentage = limit ? (usage / limit) * 100 : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-base font-medium">{title}</CardTitle>
          </div>
          {isAtLimit && !isInOverage && (
            <Badge variant="destructive" className="text-xs">
              Limit Reached
            </Badge>
          )}
          {isInOverage && (
            <Badge
              variant="secondary"
              className="text-xs bg-blue-100 text-blue-800"
            >
              In Overage
            </Badge>
          )}
          {isNearLimit && !isAtLimit && (
            <Badge
              variant="secondary"
              className="text-xs bg-amber-100 text-amber-800"
            >
              Near Limit
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Usage Display */}
        <div className="flex justify-between items-baseline">
          <span className="text-2xl font-bold">
            {usage.toLocaleString()}
            {unit && (
              <span className="text-sm font-normal text-muted-foreground ml-1">
                {unit}
              </span>
            )}
          </span>
          {!unlimited && limit && (
            <span className="text-sm text-muted-foreground">
              of {limit.toLocaleString()}
            </span>
          )}
          {unlimited && (
            <Badge variant="secondary" className="text-xs">
              Unlimited
            </Badge>
          )}
        </div>

        {/* Progress Bar */}
        {!unlimited && limit && (
          <div className="space-y-1.5">
            <div className="relative">
              <Progress
                value={Math.min(percentage, 100)}
                className={cn(
                  "h-4",
                  "border",
                  "shadow-sm",
                  "bg-background",
                  isAtLimit && "[&>*]:bg-red-500",
                  isInOverage && "[&>*]:bg-blue-500",
                  isNearLimit && !isAtLimit && "[&>*]:bg-amber-500",
                  !isNearLimit && !isAtLimit && "[&>*]:bg-green-500",
                )}
              />

              {/* Overlay percentage text on the progress bar */}
              <div className="absolute inset-0 flex items-center px-2">
                <span
                  className={cn(
                    "text-xs font-bold",
                    percentage > 50
                      ? "text-white ml-auto mr-1"
                      : "text-gray-700 ml-1",
                  )}
                >
                  {percentage.toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Quick stats */}
            {isNearLimit && (
              <p
                className={cn(
                  "text-xs font-medium flex items-center justify-center",
                  isAtLimit ? "text-red-600" : "text-amber-600",
                )}
              >
                {!isInOverage && (
                  <>
                    ⚠️ {(limit - usage).toLocaleString()} {unit} remaining
                  </>
                )}
                {isInOverage && (
                  <span className="text-xs font-normal text-primary ml-1 pl-1">
                    (Usage-based pricing active)
                  </span>
                )}
              </p>
            )}
          </div>
        )}

        {/* Additional Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {resetDate && <span>Resets {resetDate}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main component
 */
export function UsageOverview({ customer }: UsageOverviewProps) {
  // Extract and calculate all necessary data
  const activeProduct = customer?.products?.find((p) => p.status === "active");
  const isFreePlan = checkIsFreePlan(activeProduct);
  const features = customer?.features || {};

  const metrics = calculateUsageMetrics(features);
  const resetDate = calculateResetDate();

  // Determine which status to show
  const shouldShowOverageAlert = metrics.isInOverage;
  const shouldShowApproachingAlert =
    !metrics.isInOverage &&
    metrics.messagesBalance !== undefined &&
    metrics.messagesBalance !== null &&
    metrics.messagesBalance <= APPROACHING_LIMIT_THRESHOLD &&
    !metrics.isAtLimit;
  const shouldShowAtLimitAlert =
    metrics.messagesBalance !== undefined &&
    metrics.messagesBalance !== null &&
    metrics.isAtLimit;
  const shouldShowGoodStatus =
    !metrics.isInOverage &&
    metrics.messagesBalance !== undefined &&
    metrics.messagesBalance !== null &&
    metrics.messagesBalance > APPROACHING_LIMIT_THRESHOLD &&
    !metrics.isAtLimit;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Usage Overview</h2>
        <p className="text-sm text-muted-foreground">
          Track your message usage for the current billing period
        </p>
      </div>

      {/* Usage Card */}
      <div className="w-full">
        <FeatureUsageCard
          icon={<MessageSquare className="w-4 h-4 text-primary" />}
          title="Total Messages"
          usage={metrics.usage}
          limit={metrics.messagesLimit || FALLBACK_MESSAGE_LIMIT}
          unlimited={false}
          unit="messages"
          resetDate={resetDate}
          isInOverage={metrics.isInOverage}
        />
      </div>

      {/* Status Alerts */}
      {shouldShowOverageAlert && (
        <StatusAlert
          type="overage"
          usage={metrics.usage}
          messagesLimit={metrics.messagesLimit || FALLBACK_MESSAGE_LIMIT}
          overageAmount={metrics.overageAmount}
          overageCost={metrics.overageCost}
        />
      )}

      {shouldShowApproachingAlert && (
        <StatusAlert
          type="approaching"
          usage={metrics.usage}
          messagesLimit={metrics.messagesLimit || FALLBACK_MESSAGE_LIMIT}
          messagesBalance={metrics.messagesBalance}
          isFreePlan={isFreePlan}
        />
      )}

      {shouldShowAtLimitAlert && (
        <StatusAlert
          type="at-limit"
          usage={metrics.usage}
          messagesLimit={metrics.messagesLimit || FALLBACK_MESSAGE_LIMIT}
        />
      )}

      {shouldShowGoodStatus && (
        <StatusAlert
          type="good"
          usage={metrics.usage}
          messagesLimit={metrics.messagesLimit || FALLBACK_MESSAGE_LIMIT}
          isFreePlan={isFreePlan}
        />
      )}
    </div>
  );
}

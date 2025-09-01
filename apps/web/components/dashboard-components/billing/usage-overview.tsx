"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Customer } from "autumn-js";
import { AlertCircle, CheckCircle2, MessageSquare } from "lucide-react";

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

export function UsageOverview({ customer }: UsageOverviewProps) {
  // Get current active product
  const activeProduct = customer?.products?.find((p) => p.status === "active");
  const planName = activeProduct?.name || "Free";
  const isFreePlan = !activeProduct || planName.toLowerCase() === "free";

  // Extract feature usage from customer object
  const features = customer?.features || {};

  // Messages feature from Autumn tracking
  const messagesFeature = features.messages;
  const messagesLimit = messagesFeature?.included_usage || 200000; // Default to 200k limit
  const messagesBalance = messagesFeature?.balance || 0;

  // Calculate usage from limit and balance
  const usage = messagesLimit - messagesBalance;

  // Check if user is in overage pricing tier (beyond 200k)
  const isInOverage = usage > messagesLimit;
  const isAtLimit = usage === messagesLimit;
  const overageAmount = Math.max(0, usage - messagesLimit);
  const overageCost = Math.ceil(overageAmount / 100000) * 8; // $8 per 100k messages

  // Calculate reset date (first day of next month)
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const resetDate = nextMonth.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Usage Overview</h2>
        <p className="text-sm text-muted-foreground">
          Track your message usage for the current billing period
        </p>
      </div>

      <div className="w-full">
        {/* Total Messages */}
        <FeatureUsageCard
          icon={<MessageSquare className="w-4 h-4 text-primary" />}
          title="Total Messages"
          usage={usage}
          limit={messagesLimit || 200000}
          unlimited={false}
          unit="messages"
          resetDate={resetDate}
          isInOverage={isInOverage}
        />
      </div>

      {/* Overage Pricing Alert */}
      {isInOverage && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900">
                Usage-based pricing active
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                You&apos;ve exceeded your{" "}
                {(messagesLimit || 200000).toLocaleString()} message allowance.
              </p>

              {/* Overage Details */}
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
                  <span className="text-xs text-blue-700">
                    Rate: $8 per 100k
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Alerts */}
      {!isInOverage &&
        messagesBalance !== undefined &&
        messagesBalance !== null &&
        messagesBalance <= 5000 &&
        !isAtLimit && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-amber-900">
                  Approaching usage limit
                </h4>
                <p className="text-sm text-amber-700 mt-1">
                  You&apos;re approaching your{" "}
                  {(messagesLimit || 200000).toLocaleString()} message
                  allowance. Only {messagesBalance.toLocaleString()} messages
                  remaining.
                </p>

                {/* Overage Info Pills */}
                {!isFreePlan && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 rounded-full">
                      <span className="text-xs font-medium text-amber-900">
                        ⚠️ {messagesBalance.toLocaleString()} left
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 rounded-full">
                      <span className="text-xs font-medium text-amber-900">
                        📈 Overage rate: $8 per 100k
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/80 rounded-full">
                      <span className="text-xs text-amber-700">
                        Auto-billed at end of period
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* At limit status */}
      {messagesBalance !== undefined &&
        messagesBalance !== null &&
        isAtLimit && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-yellow-900">
                  At limit
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  You have used {usage.toLocaleString()} of your{" "}
                  {(messagesLimit || 200000).toLocaleString()} message
                  allowance. Usage-based pricing will be applied from now on.
                </p>
              </div>
            </div>
          </div>
        )}

      {/* All Good Status */}
      {!isInOverage &&
        messagesBalance !== undefined &&
        messagesBalance !== null &&
        messagesBalance > 5000 &&
        !isAtLimit && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-green-900">
                  Usage is within limits
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  You have used {usage.toLocaleString()} of your{" "}
                  {(messagesLimit || 200000).toLocaleString()} message
                  allowance.
                </p>

                {/* Overage Info - Subtle */}
                {!isFreePlan && (
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100/70 rounded-full text-xs text-green-800 border border-green-200">
                      💡 Additional usage: $8 per 100k after limit
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

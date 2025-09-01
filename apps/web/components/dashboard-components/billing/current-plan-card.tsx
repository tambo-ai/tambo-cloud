"use client";

import PricingTable from "@/components/dashboard-components/billing/pricing-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Customer } from "autumn-js";
import { useCustomer } from "autumn-js/react";
import { ArrowUpRight, CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";

interface CurrentPlanCardProps {
  customer: Customer | null;
  onRefresh?: () => void;
}

export function CurrentPlanCard({ customer }: CurrentPlanCardProps) {
  const { openBillingPortal } = useCustomer();
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get current active product
  const activeProduct = customer?.products?.find((p) => p.status === "active");
  const scheduledProduct = customer?.products?.find(
    (p) => p.status === "scheduled",
  );

  const planName = activeProduct?.name || "Free";
  const isFreePlan = !activeProduct || planName.toLowerCase() === "free";
  const nextBillingDate = activeProduct?.started_at
    ? (() => {
        const startDate = new Date(activeProduct.started_at);
        const nextMonth = new Date(startDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      })()
    : null;

  const handleUpgrade = async () => {
    setShowPricingDialog(true);
  };

  const handleManageBilling = async () => {
    setIsLoading(true);
    try {
      // Use Autumn's built-in billing portal method
      await openBillingPortal({
        returnUrl: window.location.href, // Return to current page
      });
    } catch (error) {
      console.error("Failed to open billing portal:", error);
      // If customer doesn't have a Stripe customer yet, show a message
      if (error instanceof Error && error.message.includes("404")) {
        alert(
          "No billing history available yet. Please make a purchase first.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Plan Details */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-2xl font-semibold">{planName}</h3>
              {nextBillingDate && (
                <p className="text-sm text-muted-foreground">
                  Next billing date: {nextBillingDate}
                </p>
              )}
              {scheduledProduct && scheduledProduct.started_at && (
                <p className="text-sm text-amber-600">
                  Scheduled change to {scheduledProduct.name} on{" "}
                  {new Date(scheduledProduct.started_at).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isFreePlan ? (
                <Button onClick={handleUpgrade} className="shadow-sm">
                  Upgrade to Pro
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleManageBilling}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Manage Billing
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleUpgrade}>
                    Change Plan
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Current Plan Features */}
          {customer &&
            customer.features &&
            Object.keys(customer.features).length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">Plan includes:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(() => {
                    // Define features for each plan
                    const freeFeatures = [
                      {
                        key: "messages",
                        name: "Messages",
                        description: `(${(customer.features.messages?.included_usage ?? 10000).toLocaleString()} included)`,
                      },
                      {
                        key: "unlimited_users_oauth",
                        name: "Unlimited Users (OAuth)",
                      },
                      {
                        key: "chat_thread_history",
                        name: "Chat Thread History",
                      },
                      {
                        key: "analytics__observability",
                        name: "Analytics & Observability",
                      },
                      { key: "Community_support", name: "Community Support" },
                    ];
                    const growthFeatures = [
                      {
                        key: "messages",
                        name: "Messages",
                        description: `(${(customer.features.messages?.included_usage ?? 200000).toLocaleString()} included, then $8/100k)`,
                      },
                      { key: "unlimited_users", name: "Unlimited Users" },
                      {
                        key: "chat_thread_history",
                        name: "Chat Thread History",
                      },
                      {
                        key: "analytics__observability",
                        name: "Analytics & Observability",
                      },
                      { key: "email_support", name: "Email Support" },
                    ];

                    const planFeatures = isFreePlan
                      ? freeFeatures
                      : growthFeatures;

                    return planFeatures.map((feature) => (
                      <div
                        key={feature.key}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>{feature.name}</span>
                        {feature.description && (
                          <span>{feature.description}</span>
                        )}
                      </div>
                    ));
                  })()}
                </div>

                {/* Overage Pricing Note */}
                {customer.features.messages && !isFreePlan && (
                  <div className="mt-3 p-3 rounded-lg bg-muted/50">
                    <p className="text-xs">
                      <span className="font-medium">Usage-based pricing:</span>{" "}
                      Your plan includes up to{" "}
                      {(
                        customer.features.messages?.included_usage ?? 200000
                      ).toLocaleString()}{" "}
                      messages. Additional usage is automatically billed at $8
                      per 100,000 messages.
                    </p>
                  </div>
                )}
              </div>
            )}
        </CardContent>
      </Card>

      {/* Pricing Dialog */}
      <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose Your Plan</DialogTitle>
            <DialogDescription>
              Select the plan that best fits your needs
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6">
            <PricingTable />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

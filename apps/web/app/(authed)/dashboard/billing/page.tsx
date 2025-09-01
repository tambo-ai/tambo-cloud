"use client";

import { BillingContent } from "@/components/dashboard-components/billing/billing-content";
import { BillingSkeleton } from "@/components/skeletons/billing-skeleton";
import { useCustomer } from "autumn-js/react";

export default function BillingPage() {
  const { customer, isLoading, error, refetch } = useCustomer();

  if (isLoading) {
    return <BillingSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">
          Failed to load billing information
        </p>
        <button
          onClick={async () => await refetch()}
          className="text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return <BillingContent customer={customer} onRefresh={refetch} />;
}

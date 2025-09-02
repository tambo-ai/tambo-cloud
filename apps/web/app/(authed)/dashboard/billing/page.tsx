"use client";

import { BillingContent } from "@/components/dashboard-components/billing/billing-content";
import { BillingSkeleton } from "@/components/skeletons/billing-skeleton";
import { useCustomer } from "autumn-js/react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

// Client-side metadata updates for dynamic content
function updatePageMeta(customer: any) {
  if (typeof window === "undefined") return;

  // Update document title based on plan
  const planName =
    customer?.products?.find((p: any) => p.status === "active")?.name || "Free";
  document.title = `${planName} Plan - Billing & Usage | Tambo`;

  // Update meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute(
      "content",
      `Currently on ${planName} plan. Manage your Tambo subscription, view usage metrics, and billing information.`,
    );
  }
}

export default function BillingPage() {
  const { customer, isLoading, error, refetch } = useCustomer();

  // Update metadata when customer data loads
  useEffect(() => {
    if (customer) {
      updatePageMeta(customer);
    }
  }, [customer]);

  // Structured data for breadcrumbs
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Dashboard",
          item: `${window.location.origin}/dashboard`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Billing",
          item: `${window.location.origin}/dashboard/billing`,
        },
      ],
    });
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <BillingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 p-8 border rounded-lg bg-muted/10">
        <div className="flex flex-col items-center gap-2">
          <AlertCircle className="w-12 h-12 text-destructive/50" />
          <h2 className="text-xl font-semibold">Unable to Load Billing</h2>
          <p className="text-muted-foreground text-center max-w-md">
            We couldn&apos;t load your billing information. This might be a
            temporary issue. Please try refreshing the page.
          </p>
        </div>
        <button
          onClick={async () => await refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          aria-label="Refresh billing information"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BillingContent customer={customer} onRefresh={refetch} />
    </div>
  );
}

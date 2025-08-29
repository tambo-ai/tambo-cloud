"use client";

import PricingTable from "@/components/autumn/pricing-table";

export default function PricingPage() {
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold text-center mb-8">Pricing Plans</h1>
      <PricingTable />
    </div>
  );
}

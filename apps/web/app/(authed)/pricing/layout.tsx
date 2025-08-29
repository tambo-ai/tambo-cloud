import { DashboardHeader } from "@/components/sections/dashboard-header";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Pricing for tambo",
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function PricingLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader />
      <div className="flex-1 flex items-center justify-center">{children}</div>
    </div>
  );
}

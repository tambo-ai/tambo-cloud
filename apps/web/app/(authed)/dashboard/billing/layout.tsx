import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Billing - Tambo",
    default: "Billing & Usage",
  },
  description:
    "Manage your subscription, view usage metrics, and update billing information for your Tambo account.",
  keywords: [
    "billing",
    "subscription",
    "usage",
    "pricing",
    "payment",
    "plan",
    "upgrade",
    "tambo billing",
  ],
  openGraph: {
    title: "Billing & Usage - Tambo",
    description:
      "Manage your subscription and track usage for your Tambo account",
    type: "website",
    siteName: "Tambo",
  },
  twitter: {
    card: "summary",
    title: "Billing & Usage - Tambo",
    description:
      "Manage your subscription and track usage for your Tambo account",
  },
  robots: {
    index: false,
    follow: false,
  },
};

interface BillingLayoutProps {
  children: React.ReactNode;
}

export default function BillingLayout({ children }: BillingLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Page Header */}
          <div className="mb-8 space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Billing & Usage
            </h1>
            <p className="text-muted-foreground">
              Manage your subscription, track usage, and update payment methods
            </p>
          </div>

          {/* Main Content */}
          <main className="space-y-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

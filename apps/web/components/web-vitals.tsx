"use client";

import { useReportWebVitals } from "next/web-vitals";

/**
 * Component to monitor and report Core Web Vitals
 * Helps track LCP, FID, CLS, and other metrics
 */
export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // Log metrics to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(metric);
    }

    // Send metrics to analytics in production
    if (typeof window !== "undefined" && window.posthog) {
      const { name, value, id } = metric;

      window.posthog.capture("web_vitals", {
        metric_name: name,
        metric_value: value,
        metric_id: id,
        url: window.location.href,
      });
    }
  });

  return null;
}

// Add TypeScript declarations for global objects
declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: Record<string, any>) => void;
    };
  }
}

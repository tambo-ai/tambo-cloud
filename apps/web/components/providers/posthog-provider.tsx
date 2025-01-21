"use client";

import posthog from "posthog-js";
import { PostHogProvider as Provider } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

// Available PostHog features
type PostHogFeatures = {
  eventCapture: boolean;
  autocapture: boolean;
  userIdentification: boolean;
  sessionRecording: boolean;
  featureFlags: boolean;
  groupAnalytics: boolean;
};

const AVAILABLE_FEATURES: PostHogFeatures = {
  eventCapture: true,
  autocapture: true,
  userIdentification: true,
  sessionRecording: true,
  featureFlags: true,
  groupAnalytics: true,
};

const isDev = process.env.NODE_ENV === "development";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize PostHog
    try {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
        autocapture: true,
        persistence: "localStorage",
        loaded: (posthog) => {
          if (isDev) {
            posthog.debug();
          }
        },
        bootstrap: {
          distinctID: undefined,
          isIdentifiedID: false,
        },
        // Disable certain features in development
        disable_session_recording: isDev,
        disable_persistence: isDev,
      });
    } catch (error) {
      console.error("PostHog initialization failed:", error);
    }
  }, []); // Initialize only once

  useEffect(() => {
    // Reload feature flags on route change
    if (AVAILABLE_FEATURES.featureFlags) {
      posthog.reloadFeatureFlags();
    }
  }, [pathname, searchParams]);

  return <Provider client={posthog}>{children}</Provider>;
}

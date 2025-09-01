/**
 * Billing Constants
 * Centralized billing configuration used across multiple components
 */

// Default message limits for different plans (fallbacks when Autumn data unavailable)
export const MESSAGE_LIMITS = {
  FREE: 10000,
  GROWTH: 200000,
} as const;

// Overage pricing configuration
export const OVERAGE_CONFIG = {
  RATE_PER_100K: 8, // $8 per 100k messages
  THRESHOLD: 5000, // Warning threshold when approaching limit
} as const;

/**
 * Plan Features
 */

export interface PlanFeature {
  key: string;
  name: string;
  getDescription?: (customer?: any) => string;
}

export const PLAN_FEATURES: Record<"free" | "growth", PlanFeature[]> = {
  free: [
    {
      key: "messages",
      name: "Messages",
      getDescription: (customer) => {
        const limit =
          customer?.features?.messages?.included_usage ?? MESSAGE_LIMITS.FREE;
        return `${limit.toLocaleString()} included`;
      },
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
    {
      key: "community_support",
      name: "Community Support",
    },
  ],
  growth: [
    {
      key: "messages",
      name: "Messages",
      getDescription: (customer) => {
        const limit =
          customer?.features?.messages?.included_usage ?? MESSAGE_LIMITS.GROWTH;
        return `${limit.toLocaleString()} included, then $${OVERAGE_CONFIG.RATE_PER_100K}/100k`;
      },
    },
    {
      key: "unlimited_users",
      name: "Unlimited Users",
    },
    {
      key: "chat_thread_history",
      name: "Chat Thread History",
    },
    {
      key: "analytics__observability",
      name: "Analytics & Observability",
    },
    {
      key: "email_support",
      name: "Email Support",
    },
  ],
} as const;

/**
 * Plan Identification
 */

/**
 * Determine if a product/plan is the free tier
 */
export function isFreePlan(product: {
  properties?: { is_free?: boolean };
  display?: { name?: string };
  name?: string;
}): boolean {
  return (
    product.properties?.is_free ||
    (product.display?.name || product.name || "")
      .toLocaleLowerCase()
      .includes("free")
  );
}

/**
 * Determine if a product should be marked as recommended
 */
export function isRecommendedPlan(product: {
  display?: { recommend_text?: string; name?: string };
  name?: string;
}): boolean {
  return (
    !!product.display?.recommend_text ||
    (product.display?.name || product.name || "")
      .toLocaleLowerCase()
      .includes("growth")
  );
}

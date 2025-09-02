"use client";

import { CurrentPlanCard } from "@/components/dashboard-components/billing/current-plan-card";
import { UsageOverview } from "@/components/dashboard-components/billing/usage-overview";
import type { Customer } from "autumn-js";
import { motion } from "framer-motion";

interface BillingContentProps {
  customer: Customer | null;
  onRefresh: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

export function BillingContent({ customer, onRefresh }: BillingContentProps) {
  return (
    <motion.div
      className="flex-1 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Current Plan Card */}
      <motion.div variants={itemVariants}>
        <CurrentPlanCard customer={customer} onRefresh={onRefresh} />
      </motion.div>

      {/* Usage Overview Grid */}
      <motion.div variants={itemVariants}>
        <UsageOverview customer={customer} />
      </motion.div>
    </motion.div>
  );
}

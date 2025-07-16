"use client";

import { DashboardHeader } from "@/components/sections/dashboard-header";
import { DashboardThemeProvider } from "@/providers/dashboard-theme-provider";
import { motion } from "framer-motion";
import { Suspense } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const fadeInVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <DashboardThemeProvider defaultTheme="light">
      <div className="flex h-screen flex-col bg-background">
        <DashboardHeader />

        {/* Content Area */}
        <div className="flex-1 min-h-0 container mx-auto px-4 md:px-6">
          <motion.div
            className="h-full"
            initial="hidden"
            animate="visible"
            variants={fadeInVariants}
          >
            <Suspense fallback={<div className="h-32 animate-pulse"></div>}>
              {children}
            </Suspense>
          </motion.div>
        </div>
      </div>
    </DashboardThemeProvider>
  );
}

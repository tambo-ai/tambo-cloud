"use client";

import { DashboardHeader } from "@/components/sections/dashboard-header";
import { motion } from "framer-motion";
import { Suspense } from "react";
import { DashboardThemeProvider } from "@/providers/dashboard-theme-provider";

interface DashboardGroupLayoutProps {
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

export default function DashboardGroupLayout({
  children,
}: DashboardGroupLayoutProps) {
  return (
    <DashboardThemeProvider defaultTheme="light">
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader />

        <div className="container mx-auto px-4 py-6 md:px-6">
          <motion.div
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

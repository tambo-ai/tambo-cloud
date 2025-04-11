"use client";

import { Header } from "@/components/sections/header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        showDashboardButton={false}
        showLogoutButton={true}
        transparent={false}
      />

      {children}
    </div>
  );
}

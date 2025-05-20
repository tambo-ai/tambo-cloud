"use client";

import { MobileDrawer } from "@/components/mobile-drawer";

interface MobileNavigationProps {
  showDashboardButton: boolean;
  showLogoutButton: boolean;
  minimal?: boolean;
}

export function MobileNavigation({
  showDashboardButton,
  showLogoutButton,
  minimal,
}: MobileNavigationProps) {
  return (
    <MobileDrawer
      showDashboardButton={showDashboardButton}
      showLogoutButton={showLogoutButton}
      minimal={minimal}
    />
  );
}

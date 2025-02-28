"use client";

import { LogoutButton } from "@/components/auth/logout-button";
import { Icons } from "@/components/icons";
import { MobileDrawer } from "@/components/mobile-drawer";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function Header({
  showDashboardButton = true,
  showLogoutButton = false,
}: {
  showDashboardButton?: boolean;
  showLogoutButton?: boolean;
}) {
  return (
    <header className="sticky top-0 h-[var(--header-height)] z-50 p-0 bg-background/60 backdrop-blur">
      <div className="flex justify-between items-center container mx-auto p-2">
        <Link
          href="/"
          title="brand-logo"
          className="relative mr-6 flex items-center space-x-2"
        >
          <Icons.logo className="w-auto" />
          <span className="font-semibold text-2xl tracking-tight">
            {siteConfig.name}
          </span>
        </Link>
        <div className="hidden lg:flex items-center gap-6">
          <Link
            href="/product"
            className="text-foreground/80 hover:text-foreground font-medium transition-colors"
          >
            Product
          </Link>
          <Link
            href="/pricing"
            className="text-foreground/80 hover:text-foreground font-medium transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/docs"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-9 rounded-md group tracking-tight font-medium bg-secondary/50 border-secondary-foreground/10",
            )}
          >
            Documentation
          </Link>
          {showDashboardButton && (
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "default" }),
                "h-9 text-primary-foreground rounded-md group tracking-tight font-medium",
              )}
            >
              Dashboard
            </Link>
          )}
          {showLogoutButton && <LogoutButton />}
        </div>
        <div className="mt-2 cursor-pointer block lg:hidden">
          <MobileDrawer
            showDashboardButton={showDashboardButton}
            showLogoutButton={showLogoutButton}
          />
        </div>
      </div>
      <hr className="absolute w-full bottom-0 border-border/20" />
    </header>
  );
}

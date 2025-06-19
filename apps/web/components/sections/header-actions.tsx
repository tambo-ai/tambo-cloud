"use client";

import { LogoutButton } from "@/components/auth/logout-button";
import { buttonVariants } from "@/components/ui/button";
import { GitHubLink } from "@/components/ui/github-link";
import { DiscordLink } from "@/components/ui/discord-link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/config";
import { BookOpenIcon, LayoutDashboardIcon } from "lucide-react";
import Link from "next/link";

interface HeaderActionsProps {
  showDashboardButton: boolean;
  showLogoutButton: boolean;
}

export function HeaderActions({
  showDashboardButton,
  showLogoutButton,
}: HeaderActionsProps) {
  return (
    <div className="hidden lg:flex items-center gap-x-4">
      <Link
        href="/docs"
        className={cn(
          buttonVariants({ variant: "link" }),
          "h-9 rounded-md group tracking-tight font-medium flex items-center gap-2",
        )}
      >
        <BookOpenIcon className="h-4 w-4" />
        Docs
      </Link>
      <GitHubLink href={siteConfig.links.github} text="Github" />
      <DiscordLink href={siteConfig.links.discord} text="Discord" />
      {showDashboardButton && (
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: "default" }),
            "h-9 rounded-md group tracking-tight font-medium flex items-center gap-2",
          )}
        >
          <LayoutDashboardIcon className="h-4 w-4" />
          Dashboard
        </Link>
      )}
      {showLogoutButton && <LogoutButton />}
    </div>
  );
}

import { Icons } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { GitHubLink } from "@/components/ui/github-link";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { IoMenuSharp } from "react-icons/io5";

interface MobileDrawerProps {
  showDashboardButton: boolean;
  showLogoutButton: boolean;
  /**
   * When true, render a reduced drawer that only contains the GitHub link.
   * Defaults to `false` to retain the previous (full-featured) behaviour.
   */
  minimal?: boolean;
}

export function MobileDrawer({
  showDashboardButton,
  showLogoutButton,
  minimal = false,
}: MobileDrawerProps) {
  return (
    <Drawer>
      <DrawerTrigger aria-label="Open navigation">
        <IoMenuSharp className="text-2xl" />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="px-6">
          <DrawerTitle>
            <Link
              href="/"
              title="brand-logo"
              className="relative mr-6 flex items-center space-x-2"
            >
              <Icons.logo
                className="pl-4 h-6 w-auto"
                aria-label={siteConfig.name}
              />
            </Link>
          </DrawerTitle>
          <DrawerDescription>{siteConfig.description}</DrawerDescription>
        </DrawerHeader>
        {minimal ? (
          // Reduced drawer: GitHub link only
          <DrawerFooter>
            {/* GitHubLink lives under ui/ */}
            <GitHubLink
              href="https://github.com/tambo-ai/tambo-cloud"
              text="Star us on GitHub"
            />
          </DrawerFooter>
        ) : (
          <>
            <div className="px-6 flex flex-col gap-2">
              {showDashboardButton && (
                <Link
                  href="/dashboard"
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "justify-start text-base w-full",
                  )}
                >
                  Dashboard
                </Link>
              )}
              {showLogoutButton && (
                <button
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "justify-start text-base w-full",
                  )}
                >
                  Logout
                </button>
              )}
            </div>
            <DrawerFooter>
              <Link
                href="/docs"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "text-white rounded-full group",
                )}
              >
                Docs
              </Link>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

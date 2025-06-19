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
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { BookOpenIcon, LayoutDashboardIcon, LogOutIcon } from "lucide-react";
import Link from "next/link";
import { IoMenuSharp } from "react-icons/io5";

interface MobileDrawerProps {
  showDashboardButton: boolean;
  showLogoutButton: boolean;
}

export function MobileDrawer({
  showDashboardButton,
  showLogoutButton,
}: MobileDrawerProps) {
  return (
    <Drawer>
      <DrawerTrigger>
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
        <div className="px-6 flex flex-col gap-2">
          {showDashboardButton && (
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "justify-start text-base w-full flex items-center gap-2",
              )}
            >
              <LayoutDashboardIcon className="h-4 w-4" />
              Dashboard
            </Link>
          )}
          {showLogoutButton && (
            <button
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "justify-start text-base w-full flex items-center gap-2",
              )}
            >
              <LogOutIcon className="h-4 w-4" />
              Logout
            </button>
          )}
        </div>
        <DrawerFooter>
          <Link
            href="/docs"
            className={cn(
              buttonVariants({ variant: "default" }),
              "text-white rounded-full group flex items-center justify-center gap-2",
            )}
          >
            <BookOpenIcon className="h-4 w-4" />
            Docs
          </Link>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

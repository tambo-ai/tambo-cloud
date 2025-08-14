"use client";

import { useNextAuthSession } from "@/hooks/nextauth";
import { api } from "@/trpc/react";
import { usePathname, useRouter } from "next/navigation";
import { FC, useEffect } from "react";

interface NextAuthLayoutWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const NextAuthLayoutWrapper: FC<NextAuthLayoutWrapperProps> = ({
  children,
  fallback,
}): React.ReactNode => {
  const { data: session, status } = useNextAuthSession();
  const router = useRouter();
  const pathname = usePathname();

  // Check legal acceptance status
  const { data: legalStatus } = api.user.hasAcceptedLegal.useQuery(undefined, {
    enabled: !!session && pathname !== "/legal-acceptance",
  });

  useEffect(() => {
    if (status === "loading") return; // Still loading

    // No session, redirect to login
    if (!session) {
      const returnUrl = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?returnUrl=${returnUrl}`);
    } else if (
      // Check if user has accepted legal
      legalStatus &&
      !legalStatus.accepted &&
      pathname !== "/legal-acceptance"
    ) {
      // Redirect to legal acceptance if not accepted
      router.push("/legal-acceptance");
    }
  }, [session, status, router, legalStatus, pathname]);

  // Show loading state while checking session
  if (status === "loading" || (session && !legalStatus)) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      )
    );
  }

  // Show children if authenticated and legal accepted
  if (session && legalStatus?.accepted) {
    return <>{children}</>;
  }

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  );
};

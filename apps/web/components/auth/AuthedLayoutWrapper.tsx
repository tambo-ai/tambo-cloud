"use client";

import { getSupabaseClient } from "@/app/utils/supabase";
import {
  redirect,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useEffect, useState } from "react";

export function AuthedLayoutWrapper({
  children,
  hasSession,
}: {
  children: React.ReactNode;
  hasSession: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    async function handleAuth() {
      // If there's an auth code in the URL, exchange it for a session
      if (code) {
        await getSupabaseClient().auth.exchangeCodeForSession(code);
        // Refresh the page without the code parameter to load with the new session
        router.replace(pathname);
        return;
      }

      // If no session, redirect to login
      if (!hasSession) {
        redirect(`/login?returnUrl=${encodeURIComponent(pathname)}`);
      } else {
        // Auth check complete, we can render the content
        setIsCheckingAuth(false);
      }
    }

    handleAuth();
  }, [hasSession, pathname, code, router]);

  // Show nothing while checking authentication
  if (isCheckingAuth) {
    return null;
  }

  // Only render children if we have a valid session
  return hasSession ? <>{children}</> : null;
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * CLI Auth Redirect Page
 *
 * This page redirects users from the old CLI auth URL (/cli-auth)
 * to the new authenticated route (/dashboard/cli-auth).
 *
 * The CLI auth functionality is now integrated with the auth middleware through:
 * 1. Placement in the (authed) route group which automatically applies auth middleware
 * 2. Location at /dashboard/cli-auth which is protected by the authenticated layout
 * 3. Use of the useSession hook to ensure the user is authenticated
 *
 * The authentication flow is now:
 * 1. User accesses /cli-auth
 * 2. This redirect component sends them to /dashboard/cli-auth
 * 3. If not authenticated, the auth middleware redirects to login
 * 4. After login, user is returned to /dashboard/cli-auth
 * 5. Authenticated user proceeds with project selection and API key generation
 *
 * This ensures all CLI auth functionality is properly secured by the auth middleware.
 */
export default function CLIAuthRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the authenticated CLI auth page
    router.push("/dashboard/cli-auth");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-xl font-bold mb-4">Redirecting...</h1>
        <p className="text-muted-foreground">
          Please wait while we redirect you to the authenticated CLI setup page.
        </p>
        <p className="text-muted-foreground mt-2">
          You will be redirected to <code>/dashboard/cli-auth</code> which is
          protected by authentication middleware.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect to the authenticated CLI auth page
 * This is a fallback for any old links pointing to this page
 */
export default function CLIAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/(authed)/cli-auth");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg">Redirecting to CLI authentication page...</p>
    </div>
  );
}

"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { Header } from "@/components/sections/header";
import { useSession } from "@/hooks/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

// Separate component that uses the useSearchParams hook
function LoginContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams?.get("returnUrl") || "/dashboard";

  useEffect(() => {
    // If the user is already authenticated, redirect to the return URL
    if (session) {
      router.push(returnUrl);
    }
  }, [session, router, returnUrl]);

  return (
    <div className="container max-w-md py-8 flex items-center justify-center">
      <AuthForm routeOnSuccess={returnUrl} />
    </div>
  );
}

// Main component with Suspense boundary
export default function LoginPage() {
  return (
    <div className="container flex flex-col min-h-screen">
      <Header showDashboardButton={false} showLogoutButton={false} />
      <div className="flex-1 flex items-center justify-center">
        <Suspense
          fallback={
            <div className="container max-w-md py-8 flex items-center justify-center">
              Loading...
            </div>
          }
        >
          <LoginContent />
        </Suspense>
      </div>
    </div>
  );
}

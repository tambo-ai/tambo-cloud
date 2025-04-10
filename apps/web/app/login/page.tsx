"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { useSession } from "@/hooks/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Header } from "@/components/sections/header";

export default function LoginPage() {
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
    <div className="container">
      <Header showDashboardButton={false} showLogoutButton={false} />
      <div className="container max-w-md py-8">
        <AuthForm routeOnSuccess={returnUrl} />
      </div>
    </div>
  );
}

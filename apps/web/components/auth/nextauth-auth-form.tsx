"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthProviderConfig } from "@/lib/auth-providers";
import Link from "next/link";
import { useState } from "react";
import { AuthErrorBanner } from "./auth-error-banner";
import { ProviderButton } from "./provider-button";

interface AuthFormProps {
  routeOnSuccess?: string;
  providers: AuthProviderConfig[];
}

export function NextAuthAuthForm({
  routeOnSuccess = "/dashboard",
  providers,
}: AuthFormProps) {
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] w-full px-4 gap-6">
      <Card className="w-full max-w-md mx-auto shadow-lg border-2">
        <CardHeader className="space-y-3 text-center pb-8">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Welcome to Tambo
            </CardTitle>
            <CardDescription className="text-base">
              Get started by signing in with your preferred method
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pb-8">
          <div className="space-y-4">
            {providers.length > 0 ? (
              providers.map((provider) => (
                <ProviderButton
                  key={provider.id}
                  provider={provider}
                  routeOnSuccess={routeOnSuccess}
                  disabled={!acceptPrivacy}
                />
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No authentication providers available
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 text-left">
            <div className="flex items-center gap-3">
              <Checkbox
                id="accept-privacy"
                checked={acceptPrivacy}
                onCheckedChange={(v) => setAcceptPrivacy(v === true)}
              />
              <label
                htmlFor="accept-privacy"
                className="text-xs text-muted-foreground"
              >
                I have read and accept the{" "}
                <Link
                  className="underline"
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Notice
                </Link>{" "}
                and{" "}
                <Link
                  className="underline"
                  href="/license"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  License Agreement
                </Link>
                .
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to our{" "}
              <Link
                className="underline"
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Use
              </Link>
              .
            </p>
          </div>
        </CardContent>
      </Card>
      <AuthErrorBanner />
    </div>
  );
}

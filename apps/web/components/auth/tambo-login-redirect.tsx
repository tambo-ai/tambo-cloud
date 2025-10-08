"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * A prompt with a button that redirects users to the login page.
 *
 * Specifically used in the tambo chatwhen the fetchCurrentUser tool indicates the user is not logged in.
 */
export function TamboLoginRedirect() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full px-4 gap-6">
      <Card className="w-full max-w-md mx-auto shadow-lg border-2">
        <CardHeader className="space-y-3 text-center pb-4">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Login Required
          </CardTitle>
          <CardDescription className="text-base">
            Please log in to access your account and projects
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <Button
            onClick={() => {
              window.location.href = "/login";
            }}
            className="w-full"
          >
            Go to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

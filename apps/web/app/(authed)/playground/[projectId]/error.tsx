/**
 * Error Boundary for Playground
 */

"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function PlaygroundError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Playground error:", error);
  }, [error]);

  return (
    <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Something went wrong</h2>
          <p className="text-slate-600 dark:text-slate-400">
            {error.message ||
              "An unexpected error occurred while loading the playground."}
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="default">
            Try Again
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

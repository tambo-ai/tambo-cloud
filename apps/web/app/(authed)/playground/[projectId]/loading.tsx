/**
 * Loading State for Playground
 */

import { Loader2 } from "lucide-react";

export default function PlaygroundLoading() {
  return (
    <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Loading playground...
        </p>
      </div>
    </div>
  );
}

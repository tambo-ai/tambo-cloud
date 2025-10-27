/**
 * Not Found Page for Playground
 */

import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";
import Link from "next/link";

export default function PlaygroundNotFound() {
  return (
    <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
            <FileQuestion className="h-8 w-8 text-slate-600 dark:text-slate-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Project Not Found</h2>
          <p className="text-slate-600 dark:text-slate-400">
            The project you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access to it.
          </p>
        </div>

        <Button asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

/**
 * Playground Client Component
 *
 * Client-side playground interface with Tambo provider, tools, and split layout.
 */

"use client";

import { TamboProvider } from "@tambo-ai/react";
import { AppViewer } from "@/components/playground/app-viewer";
import { PlaygroundContextController } from "@/components/playground/playground-context-controller";
import { env } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { MessageThreadFull } from "@/components/ui/tambo/message-thread-full";
import { playgroundTools } from "@/lib/playground/tambo-playground-config";
import { useEffect, useState } from "react";

interface PlaygroundClientProps {
  project: {
    id: string;
    name: string;
    freestyleRepoId?: string;
    freestyleRepoUrl?: string;
    templateGitUrl?: string;
  };
  hasApiKey: boolean;
}

export function PlaygroundClient({
  project,
  hasApiKey: initialHasApiKey,
}: PlaygroundClientProps) {
  const [hasApiKey, setHasApiKey] = useState(initialHasApiKey);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-create API key if missing
  useEffect(() => {
    if (!hasApiKey && !isCreatingKey) {
      setIsCreatingKey(true);
      fetch("/api/playground/api-keys/get-or-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ projectId: project.id }),
      })
        .then(async (res) => await res.json())
        .then((data) => {
          if (data.success && data.hasKey) {
            setHasApiKey(true);
          } else {
            setError(data.error || "Failed to create API key");
          }
        })
        .catch((err) => {
          setError(err.message || "Failed to create API key");
        })
        .finally(() => {
          setIsCreatingKey(false);
        });
    }
  }, [hasApiKey, isCreatingKey, project.id]);

  // Show loading state while creating key
  if (isCreatingKey) {
    return (
      <div className="h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md space-y-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-600" />
            <h2 className="text-xl font-semibold">Setting up playground...</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Creating API key for your project.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if key creation failed
  if (error) {
    return (
      <div className="h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md space-y-6 text-center">
            <h2 className="text-2xl font-semibold text-red-600">
              Setup Failed
            </h2>
            <p className="text-slate-600 dark:text-slate-400">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button asChild variant="outline">
                <Link href={`/dashboard/${project.id}/settings`}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Go to Settings
                </Link>
              </Button>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <TamboProvider
          apiKey={env.NEXT_PUBLIC_TAMBO_API_KEY!}
          tamboUrl={env.NEXT_PUBLIC_TAMBO_API_URL}
          tools={playgroundTools}
        >
          <PlaygroundContextController
            projectId={project.id}
            projectName={project.name}
            repoId={project.freestyleRepoId}
            repoUrl={project.freestyleRepoUrl}
            templateGitUrl={project.templateGitUrl}
            hasTamboApiKey={hasApiKey}
          />

          <div className="h-full grid grid-cols-1 lg:grid-cols-5 gap-4 p-4">
            {/* Left: Preview (3/5 width on large screens) */}
            <div className="flex flex-col h-full min-h-0 lg:col-span-3">
              <AppViewer
                projectId={project.id}
                projectName={project.name}
                repoId={project.freestyleRepoId}
                className="h-full"
              />
            </div>

            {/* Right: Chat (2/5 width on large screens) */}
            <div className="flex flex-col h-full min-h-0 lg:col-span-2">
              {/* Header */}
              <div className="flex items-center justify-between px-2 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 rounded-md mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/dashboard">
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Dashboard
                    </Link>
                  </Button>
                  <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
                  <h1 className="text-base font-semibold truncate">
                    {project.name}
                  </h1>
                  <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                    Playground
                  </span>
                </div>
              </div>
              <MessageThreadFull contextKey={project.id} />
            </div>
          </div>
        </TamboProvider>
      </div>
    </div>
  );
}

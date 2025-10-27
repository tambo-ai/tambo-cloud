/**
 * Playground Context Controller
 *
 * Injects playground-specific context into Tambo's context system.
 * This makes project and repository information available to all tools.
 */

"use client";

import { useTamboContextHelpers } from "@tambo-ai/react";
import { useEffect, useState } from "react";

export interface PlaygroundContext {
  projectId: string;
  projectName: string;
  repoId?: string;
  repoUrl?: string;
  ephemeralUrl?: string;
  templateGitUrl?: string;
  hasTamboApiKey?: boolean;
  tamboKeyId?: string;
}

interface PlaygroundContextControllerProps {
  projectId: string;
  projectName: string;
  repoId?: string;
  repoUrl?: string;
  templateGitUrl?: string;
  hasTamboApiKey?: boolean;
  tamboKeyId?: string;
}

/**
 * Component that registers playground context with Tambo
 *
 * Usage:
 * ```tsx
 * <TamboProvider ...>
 *   <PlaygroundContextController
 *     projectId="proj_123"
 *     projectName="My Project"
 *     repoId="repo_456"
 *     repoUrl="https://..."
 *   />
 *   <YourPlaygroundUI />
 * </TamboProvider>
 * ```
 */
export function PlaygroundContextController({
  projectId,
  projectName,
  repoId,
  repoUrl,
  templateGitUrl,
  hasTamboApiKey,
  tamboKeyId,
}: PlaygroundContextControllerProps): null {
  const [ephemeralUrl, setEphemeralUrl] = useState<string | undefined>();
  const { addContextHelper, removeContextHelper } = useTamboContextHelpers();

  // Register context helper with Tambo
  // TODO: Verify useTamboContextHelpers API - current signature may need adjustment
  // The context will be available via props passed to playground components
  // Context data is managed via localStorage and events below

  // Store context in a way that tools can access
  useEffect(() => {
    if (typeof window !== "undefined") {
      const context: PlaygroundContext = {
        projectId,
        projectName,
        repoId,
        repoUrl,
        ephemeralUrl,
        templateGitUrl,
        hasTamboApiKey,
        tamboKeyId,
      };

      // Make context available globally for tools (namespaced only)
      const w = window as any;
      w.__playgroundContexts = w.__playgroundContexts || {};
      if (projectId) {
        w.__playgroundContexts[projectId] = context;
      }
    }
  }, [
    projectId,
    projectName,
    repoId,
    repoUrl,
    ephemeralUrl,
    templateGitUrl,
    hasTamboApiKey,
    tamboKeyId,
  ]);

  useEffect(() => {
    if (!projectId) return;
    addContextHelper("currentProject", async () => ({
      projectId,
      projectName,
      repoId,
      repoUrl,
      ephemeralUrl,
      templateGitUrl,
      hasTamboApiKey,
      tamboKeyId,
    }));
    return () => {
      removeContextHelper("currentProject");
    };
  }, [
    addContextHelper,
    removeContextHelper,
    projectId,
    projectName,
    repoId,
    repoUrl,
    templateGitUrl,
    ephemeralUrl,
    hasTamboApiKey,
    tamboKeyId,
  ]);

  // Listen for dev server updates
  useEffect(() => {
    // Initial load
    const updateFromStorage = () => {
      if (typeof window === "undefined") return;

      try {
        const storageKey = `playgroundDevServer:${projectId}`;
        const stored = window.localStorage.getItem(storageKey);
        if (stored) {
          const data = JSON.parse(stored) as { ephemeralUrl?: string };
          setEphemeralUrl(data.ephemeralUrl);
        }
      } catch (error) {
        console.warn(
          "Failed to read playground dev server from storage:",
          error,
        );
      }
    };

    updateFromStorage();

    // Listen for updates
    const handleUpdate = () => {
      updateFromStorage();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === `playgroundDevServer:${projectId}`) {
        updateFromStorage();
      }
    };

    window.addEventListener("playground:devserver:updated", handleUpdate);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("playground:devserver:updated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, [projectId]);

  // This component only manages context, doesn't render anything
  return null;
}

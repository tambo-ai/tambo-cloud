/**
 * App Viewer Component
 *
 * Displays the Freestyle sandbox in an iframe with a toolbar for controls.
 * Automatically updates when dev server changes are detected.
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RefreshCw,
  ExternalLink,
  Copy,
  Download,
  Send,
  Monitor,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface AppViewerProps {
  projectId: string;
  projectName: string;
  repoId?: string;
  className?: string;
}

/**
 * Hook to get dev server URL from localStorage
 */
function useDevServerUrl(projectId: string): string | undefined {
  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = () => {
      try {
        const raw = window.localStorage.getItem(
          `playgroundDevServer:${projectId}`,
        );
        const data = raw ? JSON.parse(raw) : undefined;
        setUrl(data?.ephemeralUrl);
      } catch {
        setUrl(undefined);
      }
    };

    handler();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "playgroundDevServer") handler();
    };

    window.addEventListener("playground:devserver:updated", handler);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("playground:devserver:updated", handler);
      window.removeEventListener("storage", onStorage);
    };
  }, [projectId]);

  return url;
}

/**
 * Hook to get full dev server metadata
 */
function useDevServerMeta(projectId: string): {
  url?: string;
  repoId?: string;
} {
  const [meta, setMeta] = useState<{ url?: string; repoId?: string }>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = () => {
      try {
        const raw = window.localStorage.getItem(
          `playgroundDevServer:${projectId}`,
        );
        const data = raw ? JSON.parse(raw) : undefined;
        setMeta({ url: data?.ephemeralUrl, repoId: data?.repoId });
      } catch {
        setMeta({});
      }
    };

    handler();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "playgroundDevServer") handler();
    };

    window.addEventListener("playground:devserver:updated", handler);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("playground:devserver:updated", handler);
      window.removeEventListener("storage", onStorage);
    };
  }, [projectId]);

  return meta;
}

export function AppViewer({
  projectId,
  projectName,
  repoId: propsRepoId,
  className,
}: AppViewerProps) {
  const ephemeralUrl = useDevServerUrl(projectId);
  const { repoId: storedRepoId } = useDevServerMeta(projectId);
  const repoId = propsRepoId || storedRepoId;

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [navUrl, setNavUrl] = useState<string | undefined>(ephemeralUrl);
  const [address, setAddress] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setNavUrl(ephemeralUrl);
    setAddress(ephemeralUrl || "");
  }, [ephemeralUrl]);

  const finalUrl = useMemo(() => ephemeralUrl, [ephemeralUrl]);

  const onReload = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.location.reload();
      } catch {
        setReloadKey((k) => k + 1);
      }
    } else {
      setReloadKey((k) => k + 1);
    }
  }, []);

  const onNavigate = useCallback(() => {
    if (!address) return;

    try {
      let next = address.trim();
      if (finalUrl) {
        if (next.startsWith("/")) {
          next = new URL(next, finalUrl).toString();
        } else if (!/^https?:\/\//i.test(next)) {
          next = new URL(next, finalUrl).toString();
        }
      } else if (!/^https?:\/\//i.test(next)) {
        next = `https://${next}`;
      }
      setNavUrl(next);
    } catch (e) {
      console.error("Invalid URL", e);
    }
  }, [address, finalUrl]);

  const onDownloadCode = useCallback(async () => {
    if (!repoId) {
      console.warn("No repoId found; cannot download");
      return;
    }

    setIsDownloading(true);
    try {
      const res = await fetch(
        `/api/playground/devserver/download?repoId=${encodeURIComponent(repoId)}&projectId=${encodeURIComponent(projectId)}`,
        { method: "GET" },
      );

      if (!res.ok) {
        throw new Error(`Download failed: ${res.status}`);
      }

      const blob = await res.blob();
      const objUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = `${projectName}-${repoId}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objUrl);
    } catch (e) {
      console.error("Failed to download code", e);
    } finally {
      setIsDownloading(false);
    }
  }, [repoId, projectId, projectName]);

  const onCopyUrl = useCallback(async () => {
    if (!navUrl) return;

    try {
      await navigator.clipboard.writeText(navUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (e) {
      console.error("Failed to copy URL", e);
    }
  }, [navUrl]);

  const toolbar = (
    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Monitor className="h-4 w-4 text-slate-600 dark:text-slate-400 flex-shrink-0" />
        <Input
          className="flex-1 text-sm"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onNavigate();
          }}
          placeholder={
            finalUrl
              ? `Enter URL or path (e.g., /route)`
              : "No sandbox connected"
          }
          title={address || "No URL"}
          disabled={!finalUrl && !navUrl}
        />
        <Button
          size="sm"
          onClick={onNavigate}
          disabled={!address}
          title="Navigate to URL"
        >
          Go
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {navUrl && (
          <>
            {repoId && (
              <Button
                size="sm"
                variant="outline"
                onClick={onDownloadCode}
                disabled={isDownloading}
                title="Download code as zip"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isDownloading ? "Downloading..." : "Download"}
              </Button>
            )}
          </>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={onReload}
          disabled={!navUrl}
          title="Reload"
        >
          <RefreshCw className="h-4 w-4" />
          Reload
        </Button>

        <Button
          size="sm"
          variant="outline"
          asChild={!!navUrl}
          disabled={!navUrl}
        >
          <a
            href={navUrl || "#"}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => {
              if (!navUrl) e.preventDefault();
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open
          </a>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={onCopyUrl}
          disabled={!navUrl}
          title="Copy URL"
        >
          {copySuccess ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copySuccess ? "Copied!" : "Copy"}
        </Button>
      </div>
    </div>
  );

  const onQuickStart = useCallback(() => {
    const content = `Start a development sandbox and dev server for the current project.

Requirements:
- If the app doesn't exist yet, create a minimal app and wire it up.
- Set the environment variable TAMBO_API_KEY from my saved key; if it's missing, ask me to provide it securely and then set it.
- Start the dev server and expose a preview URL.
- Save/emit the preview URL so the App Viewer can load it automatically.

Once running, let me know the preview URL so I can start previewing the Tambo app.`;
    const ev = new CustomEvent("playground:sendmessage", {
      detail: { projectId, content },
    });
    window.dispatchEvent(ev);
  }, [projectId]);

  const empty = (
    <div className="h-full flex flex-col items-center justify-center gap-6 p-8 text-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
        <Monitor className="h-10 w-10 text-blue-600 dark:text-blue-400" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          No Sandbox Connected
        </h3>
        <p className="text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
          Ask the AI to create a development sandbox to preview your
          application. Your sandbox will be ready in seconds with a live preview
          URL.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 mt-2">
        <Button size="sm" onClick={onQuickStart}>
          <Send className="h-4 w-4 mr-2" />
          Ask AI to start a dev server
        </Button>
        <div className="text-xs text-slate-500 dark:text-slate-500">
          Or use the chat: &quot;Create a tambo chat app&quot;
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`flex flex-col h-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm ${className || ""}`}
    >
      {toolbar}
      <div className="flex-1 overflow-hidden">
        {navUrl ? (
          <iframe
            key={reloadKey}
            ref={iframeRef}
            src={navUrl}
            className="w-full h-full border-0"
            allow="clipboard-write; clipboard-read"
            title="Sandbox Preview"
          />
        ) : (
          empty
        )}
      </div>
    </div>
  );
}

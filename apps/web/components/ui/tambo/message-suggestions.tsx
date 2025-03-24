"use client";

import { cn } from "@/lib/utils";
import { useTambo, useTamboSuggestions } from "@tambo-ai/react";
import { CheckIcon, LightbulbIcon, Loader2Icon, XIcon } from "lucide-react";
import * as React from "react";
import { useEffect, useRef, useState } from "react";

export interface MessageSuggestionsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  maxSuggestions?: number;
}

export function MessageSuggestions({
  className,
  maxSuggestions = 3,
  ...props
}: MessageSuggestionsProps) {
  const { thread } = useTambo();
  const {
    suggestions,
    selectedSuggestionId,
    accept,
    acceptResult: { isPending: isAccepting },
    generateResult: { isPending: isGenerating, error },
  } = useTamboSuggestions({
    maxSuggestions,
  });
  const [isMac, setIsMac] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Track the last AI message ID to detect new messages
  const lastAiMessageIdRef = useRef<string | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Find the last AI message
  const lastAiMessage = thread?.messages
    ? [...thread.messages].reverse().find((msg) => msg.role === "assistant")
    : null;

  // Debug useEffect to log component state changes
  useEffect(() => {
    console.log("MessageSuggestions state:", {
      hasMessages: Boolean(thread?.messages?.length),
      suggestionsCount: suggestions.length,
      isGenerating,
      isAccepting,
      error: error?.message,
      isVisible,
      lastAiMessageId: lastAiMessage?.id,
      currentTrackedId: lastAiMessageIdRef.current,
    });
  }, [
    thread?.messages?.length,
    suggestions.length,
    isGenerating,
    isAccepting,
    error,
    isVisible,
    lastAiMessage?.id,
  ]);

  // When a new AI message appears, update the reference
  useEffect(() => {
    if (lastAiMessage && lastAiMessage.id !== lastAiMessageIdRef.current) {
      console.log("New AI message detected, id:", lastAiMessage.id);
      lastAiMessageIdRef.current = lastAiMessage.id;

      // Set a timeout to log if suggestions don't appear within a reasonable time
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      loadingTimeoutRef.current = setTimeout(() => {
        if (suggestions.length === 0) {
          console.log("No suggestions received after timeout");
        }
      }, 5000); // 5 second timeout
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [lastAiMessage, suggestions.length]);

  useEffect(() => {
    const isMacOS =
      typeof navigator !== "undefined" &&
      navigator.platform.toUpperCase().includes("MAC");
    setIsMac(isMacOS);
  }, []);

  useEffect(() => {
    if (!suggestions || suggestions.length === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const modifierPressed = isMac
        ? event.metaKey && event.altKey
        : event.ctrlKey && event.altKey;

      if (modifierPressed) {
        const keyNum = parseInt(event.key);
        if (!isNaN(keyNum) && keyNum > 0 && keyNum <= suggestions.length) {
          event.preventDefault();
          const suggestionIndex = keyNum - 1;
          accept({ suggestion: suggestions[suggestionIndex] });
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [suggestions, accept, isMac]);

  const modKey = isMac ? "⌘" : "Ctrl";
  const altKey = isMac ? "⌥" : "Alt";

  // If we have no messages yet, or the feature is minimized, only show the button
  if (!thread?.messages?.length) {
    return null;
  }

  if (!isVisible) {
    return (
      <div className={cn("px-4 py-2 border-t border-gray-200", className)}>
        <button
          onClick={() => setIsVisible(true)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <LightbulbIcon className="h-4 w-4 text-amber-500" />
          <span>Show suggestions</span>
        </button>
      </div>
    );
  }

  // Basic container layout
  return (
    <div
      className={cn("px-4 py-2 border-t border-gray-200", className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 border border-gray-200 rounded-md p-1">
          <LightbulbIcon className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">Suggestions</span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-muted/50 cursor-pointer border border-gray-200"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-2 rounded-md text-sm bg-red-50 text-red-500">
          <p>{error.message}</p>
        </div>
      )}

      {/* Loading state */}
      {isGenerating && (
        <div className="p-2 rounded-md text-sm bg-muted/30">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <p>Loading suggestions...</p>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {!isGenerating && !error && suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              className={cn(
                "p-2 rounded-md text-sm cursor-pointer transition-colors",
                "hover:bg-muted/70",
                selectedSuggestionId === suggestion.id
                  ? "bg-muted border-l-2 border-primary"
                  : "bg-muted/30",
              )}
              onClick={async () => await accept({ suggestion })}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{suggestion.title}</span>
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded border border-muted-foreground/30 bg-muted/50">
                    {modKey}+{altKey}+{index + 1}
                  </kbd>
                </div>
                <button
                  type="button"
                  className="h-5 w-5 inline-flex items-center justify-center rounded-md hover:bg-muted/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    accept({ suggestion, shouldSubmit: true });
                  }}
                  disabled={isAccepting}
                >
                  <CheckIcon className="h-3 w-3" />
                </button>
              </div>
              <p className="text-muted-foreground line-clamp-2">
                {suggestion.detailedSuggestion}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Empty state - no suggestions */}
      {!isGenerating && !error && suggestions.length === 0 && (
        <div className="p-2 rounded-md text-sm bg-muted/30">
          <p className="text-muted-foreground">No suggestions available</p>
        </div>
      )}
    </div>
  );
}

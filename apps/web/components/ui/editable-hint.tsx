"use client";

import { useContextAttachment } from "@/components/ui/tambo/context-attachment-provider";
import { cn } from "@/lib/utils";
import { useMessageThreadPanel } from "@/providers/message-thread-panel-provider";
import type { Suggestion } from "@tambo-ai/react";
import { Sparkles } from "lucide-react";
import { useCallback, useMemo, useState, type MouseEvent } from "react";

/**
 * Props for the EditableHint component.
 */
interface EditableHintProps {
  /**
   * Array of suggestions to display when the hint is clicked.
   * These will replace auto-generated suggestions in the message thread.
   *
   * @example
   * ```tsx
   * [
   *   {
   *     id: "suggestion-1",
   *     title: "Add Analytics",
   *     detailedSuggestion: "Add API key usage analytics showing request counts",
   *     messageId: "api-key-analytics"
   *   }
   * ]
   * ```
   */
  suggestions: Suggestion[];

  /**
   * Description text shown in the hover popover.
   * Provides context about what clicking the hint will do.
   */
  description: string;

  /** Optional className for styling the button */
  className?: string;

  /**
   * Optional name for the context attachment badge that appears above the message input.
   * If not provided, defaults to the first 3 words of the description.
   *
   * @example "API Keys" or "LLM Provider Settings"
   */
  componentName?: string;
}

/**
 * An inline sparkle button that indicates a component can be edited with Tambo AI.
 *
 * **What it does:**
 * - Shows a sparkle (✨) icon next to component headings
 * - Displays a description popover on hover
 * - When clicked:
 *   1. Opens the Tambo message thread panel
 *   2. Adds a context badge for the component
 *   3. Shows custom suggestions specific to that component
 *
 * **Requirements:**
 * - Must be used within `ContextAttachmentProvider`
 * - Must be used within `MessageThreadPanelProvider`
 *
 * @example
 * Basic usage with multiple suggestions
 * ```tsx
 * <h2>
 *   API Keys
 *   <EditableHint
 *     suggestions={[
 *       {
 *         id: "api-key-analytics",
 *         title: "Usage Analytics",
 *         detailedSuggestion: "Show request counts and usage analytics for each API key",
 *         messageId: "api-key-analytics"
 *       },
 *       {
 *         id: "api-key-rate-limits",
 *         title: "Rate Limits",
 *         detailedSuggestion: "Display rate limits and throttling information per key",
 *         messageId: "api-key-rate-limits"
 *       }
 *     ]}
 *     description="Click to enhance API key management"
 *   />
 * </h2>
 * ```
 *
 * @example
 * With custom component name
 * ```tsx
 * <CardTitle>
 *   LLM Providers
 *   <EditableHint
 *     suggestions={[...]}
 *     description="Enhance provider monitoring"
 *     componentName="LLM Providers"
 *   />
 * </CardTitle>
 * ```
 */
export function EditableHint({
  suggestions,
  description,
  className,
  componentName,
}: EditableHintProps) {
  const { setIsOpen } = useMessageThreadPanel();
  const contextAttachment = useContextAttachment();
  const [showPopover, setShowPopover] = useState(false);

  // Generate a component name from description if not provided
  const contextName = useMemo(() => {
    if (componentName) return componentName;
    // Extract first 3 words from description
    const words = description.split(" ").slice(0, 3);
    return words.join(" ");
  }, [componentName, description]);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      contextAttachment?.setCustomSuggestions(suggestions);
      contextAttachment?.addContextAttachment({
        name: contextName,
      });
      setIsOpen(true);
    },
    [suggestions, contextName, contextAttachment, setIsOpen],
  );

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setShowPopover(true)}
        onMouseLeave={() => setShowPopover(false)}
        className={cn(
          "inline-flex items-center justify-center ml-2 p-1 rounded-md",
          "text-muted-foreground hover:text-primary",
          "hover:bg-accent transition-colors duration-200",
          "cursor-pointer",
          className,
        )}
        aria-label={description}
      >
        <Sparkles className="h-4 w-4" />
      </button>

      {/* Hover popover */}
      {showPopover && (
        <div
          className={cn(
            "absolute left-0 top-full mt-2 z-50",
            "px-3 py-2 text-sm rounded-lg whitespace-nowrap",
            "bg-popover text-popover-foreground border shadow-md",
            "animate-in fade-in-0 zoom-in-95 duration-200",
          )}
        >
          <p className="font-medium">Edit with tambo</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      )}
    </span>
  );
}

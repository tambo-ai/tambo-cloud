"use client";

import { useComponentContext } from "@/components/ui/tambo/component-context";
import { getMessageContexts, getMessageImages } from "@/lib/thread-hooks";
import { cn } from "@/lib/utils";
import type { TamboThreadMessage } from "@tambo-ai/react";
import { useTamboThreadInput } from "@tambo-ai/react";
import { Cuboid, Image as ImageIcon, X } from "lucide-react";
import Image from "next/image";
import * as React from "react";

/**
 * Props for the ContextBadge component.
 */
export interface ContextBadgeProps {
  id: string;
  displayName: string;
  icon?: React.ReactNode;
  image?: { dataUrl: string };
  isExpanded: boolean;
  onToggle: () => void;
  onRemove?: () => void;
  showRemoveButton?: boolean;
}

/**
 * Reusable badge component for rendering individual context items (images or component contexts).
 * Used in both message input and message display.
 */
export const ContextBadge: React.FC<ContextBadgeProps> = ({
  displayName,
  icon,
  image,
  isExpanded,
  onToggle,
  onRemove,
  showRemoveButton = true,
}) => (
  <div className="relative group flex-shrink-0 max-w-[200px]">
    <button
      type="button"
      onClick={image ? onToggle : undefined}
      aria-expanded={image ? isExpanded : undefined}
      disabled={!image}
      className={cn(
        "relative flex items-center rounded-lg border overflow-hidden",
        "border-border bg-background hover:bg-muted cursor-pointer",
        "transition-[width,height,padding] duration-200 ease-in-out",
        isExpanded ? "w-40 h-28 p-0" : "w-40 h-9 pl-3 pr-8 gap-2",
      )}
    >
      {isExpanded && image && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-150",
            image ? "opacity-100 delay-100" : "opacity-0",
          )}
        >
          <div className="relative w-full h-full">
            <Image
              src={image.dataUrl}
              alt={displayName}
              fill
              unoptimized
              className="object-cover"
            />
            <div className="absolute bottom-1 left-2 right-2 text-primary-foreground text-xs font-medium truncate bg-primary/40 px-1 py-0.5 rounded">
              {displayName}
            </div>
          </div>
        </div>
      )}
      <span
        className={cn(
          "flex items-center gap-1.5 text-sm text-foreground truncate leading-none transition-opacity duration-150",
          isExpanded && image ? "opacity-0" : "opacity-100 delay-100",
        )}
        title={displayName}
      >
        {icon}
        <span className="truncate">{displayName}</span>
      </span>
    </button>
    {showRemoveButton && onRemove && (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -top-1 -right-1 w-5 h-5 bg-background border border-border text-muted-foreground rounded-full flex items-center justify-center hover:bg-muted hover:text-foreground transition-colors shadow-sm z-10"
        aria-label={`Remove ${displayName}`}
      >
        <X className="w-3 h-3" />
      </button>
    )}
  </div>
);

ContextBadge.displayName = "ContextBadge";

/**
 * Minimal shape required for displaying message attachments.
 * This decouples MessageAttachments from the full TamboThreadMessage type.
 */
export interface MessageAttachmentsData {
  content?: Array<{ type?: string; image_url?: { url?: string } }>;
  additionalContext?: Record<string, unknown> | null;
  role?: string;
}

/**
 * Props for the MessageAttachments component.
 */
export interface MessageAttachmentsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional message to display attachments from (display mode) */
  message?: TamboThreadMessage | MessageAttachmentsData;
  /** Whether to show remove buttons (input mode) */
  showRemoveButtons?: boolean;
}

/**
 * Displays attachments (images and contexts) from either a sent message or input state.
 * - Pass `message` prop for display mode (sent messages)
 * - Don't pass `message` for input mode (uses hooks automatically)
 * @example
 * ```tsx
 * // Display mode
 * <MessageAttachments message={message} />
 *
 * // Input mode
 * <MessageAttachments showRemoveButtons />
 * ```
 */
export const MessageAttachments = React.forwardRef<
  HTMLDivElement,
  MessageAttachmentsProps
>(({ message, showRemoveButtons = false, className, ...props }, ref) => {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  let allAttachments: Array<{
    id: string;
    displayName: string;
    icon: React.ReactNode;
    image?: { dataUrl: string };
    onRemove?: () => void;
  }> = [];

  // Get images and contexts based on mode
  const imagesList = message
    ? getMessageImages(
        Array.isArray(message.content) ? message.content : null,
      ).map((url, index) => ({ id: `image-${index}`, dataUrl: url }))
    : useTamboThreadInput().images;

  const contextsList = message
    ? getMessageContexts(message)
    : (useComponentContext()?.contexts ?? []);

  // Build attachments array
  const { removeImage } = message
    ? { removeImage: undefined }
    : useTamboThreadInput();
  const { removeContext } = message
    ? { removeContext: undefined }
    : (useComponentContext() ?? {});

  allAttachments = [
    ...imagesList.map((image, index) => ({
      id: "id" in image ? image.id : `image-${index}`,
      displayName: `Image ${index + 1}`,
      icon: <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" />,
      image: { dataUrl: image.dataUrl },
      onRemove: removeImage ? () => removeImage(image.id) : undefined,
    })),
    ...contextsList.map((context) => ({
      id: context.id,
      displayName: context.name,
      icon: <Cuboid className="w-3.5 h-3.5 flex-shrink-0" />,
      image: undefined,
      onRemove: removeContext ? () => removeContext(context.id) : undefined,
    })),
  ];

  if (allAttachments.length === 0) return null;

  return (
    <div
      ref={ref}
      className={cn("flex flex-wrap items-center gap-2", className)}
      data-slot="message-attachments"
      {...props}
    >
      {allAttachments.map((attachment) => (
        <ContextBadge
          key={attachment.id}
          id={attachment.id}
          displayName={attachment.displayName}
          icon={attachment.icon}
          image={attachment.image}
          isExpanded={expandedId === attachment.id}
          onToggle={() =>
            setExpandedId(expandedId === attachment.id ? null : attachment.id)
          }
          onRemove={attachment.onRemove}
          showRemoveButton={showRemoveButtons && !!attachment.onRemove}
        />
      ))}
    </div>
  );
});

MessageAttachments.displayName = "MessageAttachments";

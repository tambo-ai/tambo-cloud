import { cn } from "@/lib/utils";
import { ReactRenderer, type Editor } from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
import { Cuboid } from "lucide-react";
import * as React from "react";
import { forwardRef, useImperativeHandle, useState } from "react";
import tippy, { type Instance as TippyInstance } from "tippy.js";

/**
 * Represents a resource item that appears in a command dropdown (e.g., "@" mentions or "/" commands).
 * Used to represent components, actions, or other entities that can be triggered.
 * Interactables are one type of resource.
 */
export interface ResourceItem {
  id: string;
  name: string;
  icon?: React.ReactNode;
  componentData?: unknown;
}

/**
 * Configuration for a command trigger (e.g., "@" or "/").
 * Note: TipTap's Mention only supports "@". For "/", create a custom extension using Suggestion plugin with `char: "/"`.
 * Use `createResourceItemConfig` from this file. See: https://tiptap.dev/docs/editor/api/utilities/suggestion
 */
export interface CommandConfig {
  /** The character that triggers this command (e.g., "@" or "/") */
  triggerChar: string;
  /**
   * Items to show in the dropdown when user types the trigger.
   * Can be either a static array or an async function that fetches items based on the query.
   * The query parameter is the text after the trigger character (e.g., "@foo" → query is "foo").
   */
  items: ResourceItem[] | ((query: string) => Promise<ResourceItem[]>);
  /** Callback when a user selects an item from the dropdown */
  onSelect?: (item: ResourceItem) => void;
  /**
   * How to render the command label in the editor (e.g., "@name" or "/name").
   * The typed text appears in `node.attrs.label` (e.g., if user types "@foo", then `node.attrs.label` is "foo").
   * This function should return the string to display in the editor for this mention/command.
   */
  renderLabel: (props: {
    options: unknown;
    node: { attrs: Record<string, unknown> };
    suggestion: unknown;
  }) => string;
  /** HTML attributes to apply to the command node */
  HTMLAttributes?: Record<string, string>;
  /** Optional ref to track if the menu is open (for preventing Enter key conflicts) */
  isMenuOpenRef?: React.MutableRefObject<boolean>;
}

/**
 * Ref interface for the resource item list component.
 * Allows parent components to handle keyboard events.
 */
interface ResourceItemListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

/**
 * Dropdown component that displays resource items.
 *
 * When the user types "@" in the editor, this component renders a list
 * of resource items with keyboard navigation (arrow keys, Enter, Escape).
 */
const ResourceItemList = forwardRef<
  ResourceItemListRef,
  { items: ResourceItem[]; command: (item: ResourceItem) => void }
>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset selection when items change
  React.useEffect(() => setSelectedIndex(0), [items]);

  const navigate = (delta: number) =>
    setSelectedIndex((i) => (i + delta + items.length) % items.length);

  // Expose keyboard handler to parent
  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      const handlers: Record<string, () => void> = {
        ArrowUp: () => navigate(-1),
        ArrowDown: () => navigate(1),
        Enter: () => items[selectedIndex] && command(items[selectedIndex]),
      };
      const handler = handlers[event.key];
      if (handler) {
        handler();
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="px-3 py-2 text-sm text-muted-foreground">
        No results found
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 p-1">
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm rounded-md text-left",
            "hover:bg-accent hover:text-accent-foreground transition-colors",
            index === selectedIndex && "bg-accent text-accent-foreground",
          )}
          onClick={() => command(item)}
        >
          {item.icon ?? <Cuboid className="w-4 h-4 flex-shrink-0" />}
          <span className="truncate">{item.name}</span>
        </button>
      ))}
    </div>
  );
});
ResourceItemList.displayName = "ResourceItemList";

/**
 * Checks if a mention with the given label already exists in the editor.
 * Used to prevent duplicate mentions when inserting via @ command or EditableHint.
 *
 * @param editor - The TipTap editor instance
 * @param label - The mention label to check for
 * @returns true if a mention with the given label exists, false otherwise
 */
export function hasExistingMention(editor: Editor, label: string): boolean {
  let hasMention = false;
  editor.state.doc.descendants((node) => {
    if (node.type.name === "mention") {
      const mentionLabel = node.attrs.label as string;
      if (mentionLabel === label) {
        hasMention = true;
        return false; // Stop traversing
      }
    }
    return true;
  });
  return hasMention;
}

/**
 * Creates a popup handler for the resource item dropdown using tippy.js.
 */
function createResourceItemPopup() {
  let itemListComponent: ReactRenderer<ResourceItemListRef> | undefined;
  let tippyPopup: TippyInstance | undefined;

  return {
    /**
     * Called when the user starts typing "@" and resource items should appear.
     * Creates the React component and tippy popup.
     */
    onStart(props: {
      items: ResourceItem[];
      command: (item: ResourceItem) => void;
      editor: Editor;
      clientRect?: (() => DOMRect | null) | null;
    }) {
      itemListComponent = new ReactRenderer(ResourceItemList, {
        props: { items: props.items, command: props.command },
        editor: props.editor,
      });

      if (!props.clientRect) return;

      tippyPopup = tippy("body", {
        getReferenceClientRect: () => props.clientRect?.() ?? new DOMRect(),
        appendTo: () => document.body,
        content: itemListComponent.element,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
        maxWidth: "24rem",
        theme: "light-border",
      })[0];
    },

    /**
     * Called when resource items change (user continues typing after "@").
     * Updates the resource item list and repositions the popup.
     */
    onUpdate(props: {
      items: ResourceItem[];
      command: (item: ResourceItem) => void;
      clientRect?: (() => DOMRect | null) | null;
    }) {
      itemListComponent?.updateProps({
        items: props.items,
        command: props.command,
      });
      if (props.clientRect && tippyPopup) {
        tippyPopup.setProps({
          getReferenceClientRect: () => props.clientRect?.() ?? new DOMRect(),
        });
      }
    },

    /**
     * Handles keyboard events in the resource item dropdown.
     * - Escape: closes the popup
     * - Arrow keys/Enter: delegated to the resource item list component
     */
    onKeyDown({ event }: { event: KeyboardEvent }) {
      if (event.key === "Escape") {
        tippyPopup?.hide();
        return true;
      }
      const handled = itemListComponent?.ref?.onKeyDown({ event }) ?? false;
      if (handled) event.preventDefault();
      return handled;
    },

    /**
     * Called when the resource item popup should be closed.
     * Cleans up the React component and tippy popup.
     */
    onExit() {
      tippyPopup?.destroy();
      itemListComponent?.destroy();
    },
  };
}

/**
 * Creates the resource item configuration for TipTap Mention extension.
 * Filters resource items as user types and handles dropdown lifecycle.
 * Supports both static arrays and async fetching.
 */
export function createResourceItemConfig(
  items: ResourceItem[] | ((query: string) => Promise<ResourceItem[]>),
  onSelect?: (item: ResourceItem) => void,
  isMenuOpenRef?: React.MutableRefObject<boolean>,
): Omit<SuggestionOptions, "editor"> {
  return {
    items: async ({ query }) => {
      // If items is a function, call it with the query
      if (typeof items === "function") {
        return await items(query);
      }
      // Otherwise, filter the static array
      return items.filter((item) =>
        item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
      );
    },

    /**
     * Returns handlers for managing the resource item popup lifecycle.
     * Called once when the mention system initializes (when editor is created).
     */
    render: () => {
      const popupHandlers = createResourceItemPopup();

      /**
       * Creates a command handler that checks for duplicates before inserting.
       * Simpler than the previous triple-nested curried function.
       */
      function createCommandHandler(
        editor: Editor,
        tiptapCommand: (attrs: { id: string; label: string }) => void,
        item: ResourceItem,
      ) {
        // Check if mention already exists in the editor
        if (hasExistingMention(editor, item.name)) {
          // Don't insert duplicate mention
          return;
        }

        // Insert the command into the editor (e.g., "@ComponentName")
        tiptapCommand({ id: item.id, label: item.name });
        // Run custom logic (e.g., add context attachment, insert table, etc.)
        onSelect?.(item);
      }

      return {
        /**
         * Called when user starts typing the trigger character (e.g., "@").
         * Shows the resource item dropdown.
         */
        onStart: (props) => {
          if (isMenuOpenRef) isMenuOpenRef.current = true;
          popupHandlers.onStart({
            items: props.items,
            editor: props.editor,
            clientRect: props.clientRect,
            command: (item) =>
              createCommandHandler(props.editor, props.command, item),
          });
        },

        /**
         * Called as user continues typing after the trigger (e.g., "@jo" -> "@john").
         * Updates the filtered resource items in the dropdown.
         */
        onUpdate: (props) => {
          popupHandlers.onUpdate({
            items: props.items,
            clientRect: props.clientRect,
            command: (item) =>
              createCommandHandler(props.editor, props.command, item),
          });
        },

        /**
         * Handles keyboard events in the resource item dropdown.
         * - ArrowUp/ArrowDown: Navigate through resource items
         * - Enter: Select current resource item
         * - Escape: Close dropdown
         */
        onKeyDown: popupHandlers.onKeyDown,

        /**
         * Called when the resource item dropdown should close.
         * Cleans up the popup and updates the menu state.
         */
        onExit: () => {
          popupHandlers.onExit();
          // Set menu to closed after cleanup
          // Note: We do this after popupHandlers.onExit() to ensure any pending
          // keyboard events see the menu as still open
          if (isMenuOpenRef) isMenuOpenRef.current = false;
        },
      };
    },
  };
}

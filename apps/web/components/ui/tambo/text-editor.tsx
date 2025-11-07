"use client";

import { cn } from "@/lib/utils";
import Document from "@tiptap/extension-document";
import Mention from "@tiptap/extension-mention";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import Text from "@tiptap/extension-text";
import {
  EditorContent,
  ReactRenderer,
  useEditor,
  type Editor,
} from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
import { Cuboid } from "lucide-react";
import * as React from "react";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import "tippy.js/dist/tippy.css";

/**
 * Represents an item that appears in a command dropdown (e.g., "@" mentions or "/" commands).
 * Used to suggest components, actions, or other entities that can be triggered.
 */
export interface SuggestionItem {
  id: string;
  name: string;
  icon?: React.ReactNode;
  componentData?: unknown;
}

/**
 * Configuration for a command trigger (e.g., "@" or "/").
 * Note: TipTap's Mention only supports "@". For "/", create a custom extension using Suggestion plugin with `char: "/"`.
 * Use `createSuggestionConfig` from this file. See: https://tiptap.dev/docs/editor/api/utilities/suggestion
 */
export interface CommandConfig {
  /** The character that triggers this command (e.g., "@" or "/") */
  triggerChar: string;
  /** List of items to show in the dropdown when user types the trigger */
  items: SuggestionItem[];
  /** Callback when a user selects an item from the dropdown */
  onSelect?: (item: SuggestionItem) => void;
  /** How to render the command label in the editor (e.g., "@name" or "/name") */
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

export interface TextEditorProps {
  value: string;
  onChange: (text: string) => void;
  onKeyDown?: (event: React.KeyboardEvent, editor: Editor) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  editorRef?: React.MutableRefObject<Editor | null>;
  commands?: CommandConfig[];
}

/**
 * Ref interface for the suggestion list component.
 * Allows parent components to handle keyboard events.
 */
interface SuggestionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

/**
 * Dropdown component that displays mention suggestions.
 *
 * When the user types "@" in the editor, this component renders a list
 * of suggestions with keyboard navigation (arrow keys, Enter, Escape).
 *
 */
const MentionSuggestionList = forwardRef<
  SuggestionListRef,
  { items: SuggestionItem[]; command: (item: SuggestionItem) => void }
>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset selection when items change
  useEffect(() => setSelectedIndex(0), [items]);

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
MentionSuggestionList.displayName = "MentionSuggestionList";

/**
 * Creates a popup handler for the suggestion dropdown using tippy.js.
 */
function createSuggestionPopup() {
  let suggestionListComponent: ReactRenderer<SuggestionListRef> | undefined;
  let tippyPopup: TippyInstance | undefined;

  return {
    /**
     * Called when the user starts typing "@" and suggestions should appear.
     * Creates the React component and tippy popup.
     */
    onStart(props: {
      items: SuggestionItem[];
      command: (item: SuggestionItem) => void;
      editor: Editor;
      clientRect?: (() => DOMRect | null) | null;
    }) {
      suggestionListComponent = new ReactRenderer(MentionSuggestionList, {
        props: { items: props.items, command: props.command },
        editor: props.editor,
      });

      if (!props.clientRect) return;

      tippyPopup = tippy("body", {
        getReferenceClientRect: () => props.clientRect?.() ?? new DOMRect(),
        appendTo: () => document.body,
        content: suggestionListComponent.element,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
        maxWidth: "24rem",
        theme: "light-border",
      })[0];
    },

    /**
     * Called when suggestions change (user continues typing after "@").
     * Updates the suggestion list and repositions the popup.
     */
    onUpdate(props: {
      items: SuggestionItem[];
      command: (item: SuggestionItem) => void;
      clientRect?: (() => DOMRect | null) | null;
    }) {
      suggestionListComponent?.updateProps({
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
     * Handles keyboard events in the suggestion dropdown.
     * - Escape: closes the popup
     * - Arrow keys/Enter: delegated to the suggestion list component
     */
    onKeyDown({ event }: { event: KeyboardEvent }) {
      if (event.key === "Escape") {
        tippyPopup?.hide();
        return true;
      }
      const handled =
        suggestionListComponent?.ref?.onKeyDown({ event }) ?? false;
      if (handled) event.preventDefault();
      return handled;
    },

    /**
     * Called when the suggestion popup should be closed.
     * Cleans up the React component and tippy popup.
     */
    onExit() {
      tippyPopup?.destroy();
      suggestionListComponent?.destroy();
    },
  };
}

/**
 * Creates the suggestion configuration for TipTap Mention extension.
 * Filters suggestions as user types and handles dropdown lifecycle.
 */
function createSuggestionConfig(
  itemsRef: React.MutableRefObject<SuggestionItem[]>,
  onSelect?: (item: SuggestionItem) => void,
  isMenuOpenRef?: React.MutableRefObject<boolean>,
): Omit<SuggestionOptions, "editor"> {
  return {
    items: ({ query }) =>
      itemsRef.current.filter((item) =>
        item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
      ),

    /**
     * Returns handlers for managing the suggestion popup lifecycle.
     * Called once when the mention system initializes (when editor is created).
     */
    render: () => {
      const popupHandlers = createSuggestionPopup();

      /**
       * Wraps TipTap's mention command to also call our callback.
       * When a suggestion is selected:
       * 1. TipTap's command inserts the mention into the editor
       * 2. Our `onSelect` callback runs (e.g., to add context attachment)
       */
      const wrapCommand =
        (tiptapCommand: (attrs: { id: string; label: string }) => void) =>
        (item: SuggestionItem) => {
          // Insert the command into the editor (e.g., "@ComponentName")
          tiptapCommand({ id: item.id, label: item.name });
          // Run custom logic (e.g., add context attachment, insert table, etc.)
          onSelect?.(item);
        };

      return {
        /**
         * Called when user starts typing the trigger character (e.g., "@").
         * Shows the suggestion dropdown.
         */
        onStart: (props) => {
          if (isMenuOpenRef) isMenuOpenRef.current = true;
          popupHandlers.onStart({
            items: props.items,
            editor: props.editor,
            clientRect: props.clientRect,
            command: wrapCommand(props.command),
          });
        },

        /**
         * Called as user continues typing after the trigger (e.g., "@jo" -> "@john").
         * Updates the filtered suggestions in the dropdown.
         */
        onUpdate: (props) => {
          popupHandlers.onUpdate({
            items: props.items,
            clientRect: props.clientRect,
            command: wrapCommand(props.command),
          });
        },

        /**
         * Handles keyboard events in the suggestion dropdown.
         * - ArrowUp/ArrowDown: Navigate through suggestions
         * - Enter: Select current suggestion
         * - Escape: Close dropdown
         */
        onKeyDown: popupHandlers.onKeyDown,

        /**
         * Called when the suggestion dropdown should close.
         * Cleans up the popup and updates the menu state.
         */
        onExit: () => {
          if (isMenuOpenRef) isMenuOpenRef.current = false;
          popupHandlers.onExit();
        },
      };
    },
  };
}

/**
 * Text editor component with command support (e.g., "@" mentions).
 */
export const TextEditor = React.forwardRef<HTMLDivElement, TextEditorProps>(
  (
    {
      value,
      onChange,
      onKeyDown,
      placeholder = "What do you want to do?",
      disabled = false,
      className,
      editorRef,
      commands = [],
    },
    ref,
  ) => {
    const commandRefsRef = React.useRef<
      Array<{
        itemsRef: React.MutableRefObject<SuggestionItem[]>;
        isMenuOpenRef: React.MutableRefObject<boolean>;
      }>
    >([]);

    // Initialize command references for each command
    for (let i = 0; i < commands.length; i++) {
      if (!commandRefsRef.current[i]) {
        commandRefsRef.current[i] = {
          itemsRef: { current: [] },
          isMenuOpenRef: commands[i].isMenuOpenRef ?? { current: false },
        };
      }
      // Update the command references with the current items and menu state
      const ref = commandRefsRef.current[i];
      ref.itemsRef.current = commands[i].items;
      const menuRef = commands[i].isMenuOpenRef;
      if (menuRef) {
        ref.isMenuOpenRef = menuRef;
      }
    }

    const commandRefs = commandRefsRef.current;

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        Document,
        Paragraph,
        Text,
        Placeholder.configure({ placeholder }),
        ...commands.map((cmd, index) => {
          const ref = commandRefs[index];
          return Mention.configure({
            HTMLAttributes: cmd.HTMLAttributes ?? {},
            suggestion: createSuggestionConfig(
              ref.itemsRef,
              cmd.onSelect,
              ref.isMenuOpenRef,
            ),
            renderLabel: cmd.renderLabel,
          });
        }),
      ],
      content: value,
      editable: !disabled,
      onUpdate: ({ editor }) => onChange(editor.getText()),
      editorProps: {
        attributes: {
          class: cn(
            "prose prose-sm max-w-none focus:outline-none",
            "p-3 rounded-t-lg bg-transparent text-sm leading-relaxed",
            "min-h-[82px] max-h-[40vh] overflow-y-auto",
            "break-words whitespace-pre-wrap",
            className,
          ),
        },
        handleKeyDown: (view, event) => {
          // Check if any command menu is open
          const anyMenuOpen = commandRefs.some(
            (ref) => ref.isMenuOpenRef.current,
          );

          // Prevent Enter from submitting form when selecting from any suggestion menu
          if (event.key === "Enter" && !event.shiftKey && anyMenuOpen) {
            return false;
          }

          // Delegate to parent's onKeyDown handler if provided
          if (onKeyDown && editor) {
            const reactEvent = event as unknown as React.KeyboardEvent;
            onKeyDown(reactEvent, editor);
            return reactEvent.defaultPrevented;
          }
          return false;
        },
      },
    });

    // Sync external value changes and disabled state with editor
    React.useEffect(() => {
      if (!editor) return;
      if (value !== editor.getText()) {
        editor.commands.setContent(value);
      }
      editor.setEditable(!disabled);
      if (editorRef) {
        editorRef.current = editor;
      }
    }, [editor, value, disabled, editorRef]);

    return (
      <div ref={ref} className="w-full">
        <EditorContent editor={editor} />
      </div>
    );
  },
);

TextEditor.displayName = "TextEditor";

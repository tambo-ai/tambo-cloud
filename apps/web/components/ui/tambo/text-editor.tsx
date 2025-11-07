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
 * Represents a mentionable item that appears in the @ mention dropdown.
 * Used to suggest components or other entities that can be mentioned.
 */
export interface SuggestionItem {
  /** Unique identifier for the suggestion */
  id: string;
  /** Display name shown in the dropdown */
  name: string;
  /** Optional icon displayed next to the name */
  icon?: React.ReactNode;
  /** Optional additional data associated with this suggestion */
  componentData?: unknown;
}

/**
 * Props for the TextEditor component.
 */
export interface TextEditorProps {
  /** Current text value */
  value: string;
  /** Callback when text changes */
  onChange: (text: string) => void;
  /** Optional keyboard event handler */
  onKeyDown?: (event: React.KeyboardEvent, editor: Editor) => void;
  /** Placeholder text shown when editor is empty */
  placeholder?: string;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Optional ref to access the TipTap editor instance */
  editorRef?: React.MutableRefObject<Editor | null>;
  /** List of suggestions to show when user types "@" */
  suggestions?: SuggestionItem[];
  /** Callback when a suggestion is selected from the dropdown */
  onMentionSelect?: (item: SuggestionItem) => void;
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
 * @example
 * ```tsx
 * <MentionSuggestionList
 *   items={[{ id: "1", name: "Component" }]}
 *   command={(item) => insertMention(item)}
 * />
 * ```
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
 * Creates a popup handler for the mention suggestion dropdown.
 *
 * This function manages the lifecycle of the tippy.js popup that displays
 * suggestions when the user types "@". It handles:
 * - Creating and showing the popup
 * - Updating suggestions as the user types
 * - Keyboard navigation (arrow keys, Enter, Escape)
 * - Cleaning up when the popup closes
 *
 * @returns An object with lifecycle handlers for the suggestion popup
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
 * Creates the suggestion configuration for the TipTap Mention extension.
 *
 * This function connects the TipTap mention system with our custom suggestion
 * UI. When a user types "@", TipTap calls the `items` function to get filtered
 * suggestions, and `render` returns handlers for showing/updating the dropdown.
 *
 * @param itemsRef - Mutable ref containing the current list of suggestions
 * @param onMentionSelect - Optional callback when a mention is selected
 * @param isMenuOpenRef - Mutable ref to track if the suggestion menu is open
 * @returns Configuration object for TipTap's Mention extension
 */
function createSuggestionConfig(
  itemsRef: React.MutableRefObject<SuggestionItem[]>,
  onMentionSelect?: (item: SuggestionItem) => void,
  isMenuOpenRef?: React.MutableRefObject<boolean>,
): Omit<SuggestionOptions, "editor"> {
  return {
    /**
     * Filters suggestions based on the query typed after "@".
     * Called by TipTap as the user types.
     */
    items: ({ query }) =>
      itemsRef.current.filter((item) =>
        item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
      ),

    /**
     * Returns handlers for managing the suggestion popup lifecycle.
     * Called once when the mention system initializes.
     */
    render: () => {
      const popupHandlers = createSuggestionPopup();

      /**
       * Wraps TipTap's mention command to also call our callback.
       * When a suggestion is selected, this inserts the mention into the editor
       * and optionally triggers the onMentionSelect callback.
       */
      const wrapMentionCommand =
        (tiptapCommand: (attrs: { id: string; label: string }) => void) =>
        (item: SuggestionItem) => {
          tiptapCommand({ id: item.id, label: item.name });
          onMentionSelect?.(item);
        };

      return {
        /**
         * Called when user starts typing "@".
         * Shows the suggestion dropdown.
         */
        onStart: (props) => {
          if (isMenuOpenRef) isMenuOpenRef.current = true;
          popupHandlers.onStart({
            items: props.items,
            editor: props.editor,
            clientRect: props.clientRect,
            command: wrapMentionCommand(props.command),
          });
        },

        /**
         * Called as user continues typing after "@".
         * Updates the filtered suggestions in the dropdown.
         */
        onUpdate: (props) => {
          popupHandlers.onUpdate({
            items: props.items,
            clientRect: props.clientRect,
            command: wrapMentionCommand(props.command),
          });
        },

        /**
         * Handles keyboard events in the suggestion dropdown.
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
 * A minimal text editor component built on TipTap that behaves like a textarea
 * with @ mention support.
 *
 * **How @ mentions work:**
 * 1. User types "@" in the editor
 * 2. TipTap Mention extension detects this and calls `createSuggestionConfig`
 * 3. Suggestions are filtered based on what the user types after "@"
 * 4. A dropdown appears showing matching suggestions (via tippy.js)
 * 5. User navigates with arrow keys and selects with Enter
 * 6. Selected mention is inserted as `@name` and `onMentionSelect` is called
 *
 * **Key features:**
 * - Plain text editing (no rich text formatting)
 * - @ mention autocomplete with keyboard navigation
 * - Placeholder support
 * - Controlled component (value/onChange)
 * - Accessible via refs
 *
 * @example
 * ```tsx
 * <TextEditor
 *   value={text}
 *   onChange={setText}
 *   suggestions={[
 *     { id: "1", name: "Component A" },
 *     { id: "2", name: "Component B" }
 *   ]}
 *   onMentionSelect={(item) => console.log("Selected:", item.name)}
 * />
 * ```
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
      suggestions = [],
      onMentionSelect,
    },
    ref,
  ) => {
    // Keep suggestions in a ref so the mention extension always has latest values
    const suggestionsRef = React.useRef<SuggestionItem[]>(suggestions);
    // Track if suggestion menu is open to prevent Enter from submitting when selecting
    const isMenuOpenRef = React.useRef(false);

    suggestionsRef.current = suggestions;

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        Document,
        Paragraph,
        Text,
        Placeholder.configure({ placeholder }),
        Mention.configure({
          HTMLAttributes: { class: "mention" },
          suggestion: createSuggestionConfig(
            suggestionsRef,
            onMentionSelect,
            isMenuOpenRef,
          ),
          renderLabel: ({ node }) => `@${node.attrs.label}`,
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
          // Prevent Enter from submitting form when selecting from suggestion menu
          if (
            event.key === "Enter" &&
            !event.shiftKey &&
            isMenuOpenRef.current
          ) {
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

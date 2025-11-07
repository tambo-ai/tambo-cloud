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

export interface SuggestionItem {
  id: string;
  name: string;
  icon?: React.ReactNode;
  componentData?: unknown;
}

export interface TextEditorProps {
  value: string;
  onChange: (text: string) => void;
  onKeyDown?: (event: React.KeyboardEvent, editor: Editor) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  editorRef?: React.MutableRefObject<Editor | null>;
  suggestions?: SuggestionItem[];
  onMentionSelect?: (item: SuggestionItem) => void;
}

interface SuggestionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

/**
 * Dropdown list for rendering mention suggestions with keyboard navigation
 */
const MentionSuggestionList = forwardRef<
  SuggestionListRef,
  { items: SuggestionItem[]; command: (item: SuggestionItem) => void }
>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => setSelectedIndex(0), [items]);

  const navigate = (delta: number) =>
    setSelectedIndex((i) => (i + delta + items.length) % items.length);

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
 * Creates a suggestion popup handler for Tiptap mentions
 */
function createSuggestionPopup() {
  let component: ReactRenderer<SuggestionListRef> | undefined;
  let popup: TippyInstance | undefined;

  const safeGetRect = (clientRect?: (() => DOMRect | null) | null) => () =>
    clientRect?.() ?? new DOMRect();

  return {
    onStart(props: {
      items: SuggestionItem[];
      command: (item: SuggestionItem) => void;
      editor: Editor;
      clientRect?: (() => DOMRect | null) | null;
    }) {
      component = new ReactRenderer(MentionSuggestionList, {
        props: { items: props.items, command: props.command },
        editor: props.editor,
      });

      if (!props.clientRect) return;

      popup = tippy("body", {
        getReferenceClientRect: safeGetRect(props.clientRect),
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
        maxWidth: "24rem",
        theme: "light-border",
      })[0];
    },

    onUpdate(props: {
      items: SuggestionItem[];
      command: (item: SuggestionItem) => void;
      clientRect?: (() => DOMRect | null) | null;
    }) {
      component?.updateProps({ items: props.items, command: props.command });
      if (props.clientRect && popup) {
        popup.setProps({
          getReferenceClientRect: safeGetRect(props.clientRect),
        });
      }
    },

    onKeyDown({ event }: { event: KeyboardEvent }) {
      if (event.key === "Escape") {
        popup?.hide();
        return true;
      }
      const handled = component?.ref?.onKeyDown({ event }) ?? false;
      if (handled) event.preventDefault();
      return handled;
    },

    onExit() {
      popup?.destroy();
      component?.destroy();
    },
  };
}

/**
 * Creates suggestion config for the Mention extension
 */
function createSuggestionConfig(
  itemsRef: React.MutableRefObject<SuggestionItem[]>,
  onMentionSelect?: (item: SuggestionItem) => void,
  isMenuOpenRef?: React.MutableRefObject<boolean>,
): Omit<SuggestionOptions, "editor"> {
  return {
    items: ({ query }) =>
      itemsRef.current.filter((item) =>
        item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
      ),

    render: () => {
      const popup = createSuggestionPopup();

      const wrapCommand =
        (command: (attrs: { id: string; label: string }) => void) =>
        (item: SuggestionItem) => {
          command({ id: item.id, label: item.name });
          onMentionSelect?.(item);
        };

      return {
        onStart: (props) => {
          if (isMenuOpenRef) isMenuOpenRef.current = true;
          popup.onStart({
            items: props.items,
            editor: props.editor,
            clientRect: props.clientRect,
            command: wrapCommand(props.command),
          });
        },

        onUpdate: (props) => {
          popup.onUpdate({
            items: props.items,
            clientRect: props.clientRect,
            command: wrapCommand(props.command),
          });
        },

        onKeyDown: popup.onKeyDown,

        onExit: () => {
          if (isMenuOpenRef) isMenuOpenRef.current = false;
          popup.onExit();
        },
      };
    },
  };
}

/**
 * Minimal TextEditor that behaves like a textarea with @ mention support
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
    const suggestionsRef = React.useRef<SuggestionItem[]>(suggestions);
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
          if (
            event.key === "Enter" &&
            !event.shiftKey &&
            isMenuOpenRef.current
          ) {
            return false;
          }

          if (onKeyDown && editor) {
            const reactEvent = event as unknown as React.KeyboardEvent;
            onKeyDown(reactEvent, editor);
            return reactEvent.defaultPrevented;
          }
          return false;
        },
      },
    });

    // Sync editor state and expose ref
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

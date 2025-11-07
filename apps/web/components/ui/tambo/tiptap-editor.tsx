"use client";

import {
  MentionSuggestionList,
  type SuggestionItem,
  type SuggestionListRef,
} from "@/components/ui/tambo/mention-suggestion-list";
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
import * as React from "react";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import "tippy.js/dist/tippy.css";

export interface TiptapEditorProps {
  value: string;
  onChange: (text: string) => void;
  onKeyDown?: (event: React.KeyboardEvent, editor: Editor) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  editorRef?: React.MutableRefObject<Editor | null>;
  /** Interactable components to show in @ mentions */
  suggestions?: SuggestionItem[];
  /** Callback when a mention is selected - receives the full item */
  onMentionSelect?: (item: SuggestionItem) => void;
}

/**
 * Creates the suggestion configuration for the Mention extension
 */
function createSuggestionConfig(
  itemsRef: React.MutableRefObject<SuggestionItem[]>,
  onMentionSelect?: (item: SuggestionItem) => void,
  isMenuOpenRef?: React.MutableRefObject<boolean>,
): Omit<SuggestionOptions, "editor"> {
  return {
    items: ({ query }) => {
      return itemsRef.current.filter((item) =>
        item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
      );
    },
    render: () => {
      let component: ReactRenderer<SuggestionListRef> | undefined;
      let popup: TippyInstance[] | undefined;

      return {
        onStart: (props) => {
          // Mark menu as open
          if (isMenuOpenRef) {
            isMenuOpenRef.current = true;
          }

          const wrappedCommand = (item: SuggestionItem) => {
            // Insert the mention into editor
            props.command({
              id: item.id,
              label: item.name,
            });
            // Call the callback to add context attachment with full item
            onMentionSelect?.(item);
          };

          component = new ReactRenderer(MentionSuggestionList, {
            props: {
              items: props.items,
              command: wrappedCommand,
            },
            editor: props.editor,
          });

          if (!props.clientRect) {
            return;
          }

          popup = tippy("body", {
            getReferenceClientRect: props.clientRect as () => DOMRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
            maxWidth: "24rem",
            theme: "light-border",
          });
        },

        onUpdate(props) {
          const wrappedCommand = (item: SuggestionItem) => {
            // Insert the mention into editor
            props.command({
              id: item.id,
              label: item.name,
            });
            // Call the callback to add context attachment with full item
            onMentionSelect?.(item);
          };

          component?.updateProps({
            items: props.items,
            command: wrappedCommand,
          });

          if (!props.clientRect) {
            return;
          }

          popup?.[0]?.setProps({
            getReferenceClientRect: props.clientRect as () => DOMRect,
          });
        },

        onKeyDown(props) {
          if (props.event.key === "Escape") {
            popup?.[0]?.hide();
            return true;
          }

          // Let the suggestion list handle navigation and selection
          const handled = component?.ref?.onKeyDown(props) ?? false;

          // If handled, prevent default to stop event propagation
          if (handled) {
            props.event.preventDefault();
          }

          return handled;
        },

        onExit() {
          // Mark menu as closed
          if (isMenuOpenRef) {
            isMenuOpenRef.current = false;
          }
          popup?.[0]?.destroy();
          component?.destroy();
        },
      };
    },
  };
}

/**
 * Minimal Tiptap editor that behaves like a textarea
 */
export const TiptapEditor = React.forwardRef<HTMLDivElement, TiptapEditorProps>(
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
    // Use a ref to hold current suggestions so they update dynamically
    const suggestionsRef = React.useRef<SuggestionItem[]>(suggestions);
    // Track if the suggestion menu is open
    const isMenuOpenRef = React.useRef<boolean>(false);

    // Update ref when suggestions change
    React.useEffect(() => {
      suggestionsRef.current = suggestions;
    }, [suggestions]);

    const editor = useEditor({
      immediatelyRender: false, // Prevent SSR hydration issues
      extensions: [
        Document,
        Paragraph,
        Text,
        Placeholder.configure({
          placeholder,
        }),
        Mention.configure({
          HTMLAttributes: {
            class: "mention",
          },
          suggestion: createSuggestionConfig(
            suggestionsRef,
            onMentionSelect,
            isMenuOpenRef,
          ),
          renderLabel({ node }) {
            return `@${node.attrs.label}`;
          },
        }),
      ],
      content: value,
      editable: !disabled,
      onUpdate: ({ editor }) => {
        const text = editor.getText();
        onChange(text);
      },
      editorProps: {
        attributes: {
          class: cn(
            "prose prose-sm max-w-none focus:outline-none",
            "min-h-[82px] max-h-[40vh] overflow-y-auto",
            className,
          ),
        },
        handleKeyDown: (view, event) => {
          // Don't handle Enter if the mention dropdown is open
          if (event.key === "Enter" && !event.shiftKey) {
            if (isMenuOpenRef.current) {
              // Dropdown is open, let it handle the event
              return false;
            }
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

    // Update editor content when value changes externally
    React.useEffect(() => {
      if (editor && value !== editor.getText()) {
        editor.commands.setContent(value);
      }
    }, [editor, value]);

    // Update disabled state
    React.useEffect(() => {
      if (editor) {
        editor.setEditable(!disabled);
      }
    }, [editor, disabled]);

    // Expose editor instance via ref
    React.useEffect(() => {
      if (editorRef && editor) {
        editorRef.current = editor;
      }
    }, [editor, editorRef]);

    return (
      <div ref={ref} className="w-full">
        <EditorContent editor={editor} />
      </div>
    );
  },
);

TiptapEditor.displayName = "TiptapEditor";

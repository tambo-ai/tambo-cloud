import {
  useCurrentInteractablesSnapshot,
  useTamboContextAttachment,
  useTamboThreadInput,
} from "@tambo-ai/react";
import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Mention from "@tiptap/extension-mention";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import Text from "@tiptap/extension-text";
import { useEditor, type Editor } from "@tiptap/react";
import { Cuboid } from "lucide-react";
import * as React from "react";

import {
  createResourceItemConfig,
  type CommandConfig,
  type ResourceItem,
} from "./text-editor-shared";
import { cn } from "@/lib/utils";

export interface UseTextEditorOptions {
  value: string;
  onChange: (text: string) => void;
  onKeyDown?: (event: React.KeyboardEvent, editor: Editor) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  commands?: CommandConfig[];
  /** Optional submit handler for Tambo-specific Enter key behavior */
  onSubmit?: (e: React.FormEvent) => Promise<void>;
  /** Ref to populate with the editor instance */
  editorRef?: React.MutableRefObject<Editor | null>;
  /** Ref to share menu open state (for testing/external control) */
  menuOpenRef?: React.MutableRefObject<boolean>;
}

/**
 * Symbol for marking pasted images.
 * Using Symbol.for to create a global symbol that can be accessed across modules.
 * @internal
 */
const IS_PASTED_IMAGE = Symbol.for("tambo-is-pasted-image");

/**
 * Hook that provides Tambo-specific commands and image paste handling.
 * Encapsulates all Tambo AI integration logic separate from generic editor features.
 *
 * @param enabled - Whether Tambo features should be enabled (typically when onSubmit is provided)
 * @returns Array of Tambo-specific command configurations
 */
function useTamboCommands(enabled: boolean): CommandConfig[] {
  // Use Tambo-specific hooks - must be called unconditionally per React rules
  // These hooks will throw if not in Tambo context, which is expected when enabled is true
  const tamboThreadInput = useTamboThreadInput();
  const tamboContextAttachment = useTamboContextAttachment();
  const interactables = useCurrentInteractablesSnapshot();

  // Ref to access the current interactables without capturing them in a closure
  const interactablesRef = React.useRef(interactables);
  React.useEffect(() => {
    interactablesRef.current = interactables;
  }, [interactables]);

  // Handle image paste from clipboard when Tambo features are enabled
  React.useEffect(() => {
    if (!enabled) return;

    const handlePaste = async (e: Event) => {
      const clipboardEvent = e as ClipboardEvent;
      const items = Array.from(clipboardEvent.clipboardData?.items ?? []);
      const imageItems = items.filter((item) => item.type.startsWith("image/"));

      if (imageItems.length === 0) return;

      const hasText = clipboardEvent.clipboardData?.getData("text/plain");
      if (!hasText) e.preventDefault();

      for (const item of imageItems) {
        const file = item.getAsFile();
        if (file) {
          try {
            file[IS_PASTED_IMAGE] = true;
            await tamboThreadInput.addImage(file);
          } catch (error) {
            console.error("Failed to add pasted image:", error);
          }
        }
      }
    };

    const editorElement = document.querySelector(
      '[data-slot="message-input-textarea"]',
    );
    editorElement?.addEventListener("paste", handlePaste as EventListener);
    return () =>
      editorElement?.removeEventListener("paste", handlePaste as EventListener);
  }, [enabled, tamboThreadInput]);

  // Tambo-specific commands (@ mentions for interactables)
  return React.useMemo((): CommandConfig[] => {
    if (!enabled) return [];

    // Function to get the resource items for the @ mention dropdown
    const getResourceItems = async (query: string): Promise<ResourceItem[]> => {
      // Get the current interactables via ref to get the current value
      const resourceItems = interactablesRef.current.map((component) => ({
        id: component.id,
        name: component.name,
        icon: React.createElement(Cuboid, { className: "w-4 h-4" }),
        componentData: component,
      }));

      // Filter the resource items by query
      return resourceItems.filter((item) =>
        item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
      );
    };

    // Create the @ command
    return [
      {
        triggerChar: "@",
        items: getResourceItems,
        onSelect: (item: ResourceItem) => {
          // When a mention is selected, add it as a context attachment
          // This will appear as a badge above the input
          tamboContextAttachment.addContextAttachment({ name: item.name });
        },
        renderLabel: ({ node }: { node: { attrs: Record<string, unknown> } }) =>
          `@${(node.attrs.label as string) ?? ""}`,
        HTMLAttributes: { class: "mention" },
      },
    ];
  }, [enabled, tamboContextAttachment, interactablesRef]);
}

/**
 * Custom hook that encapsulates all the TipTap editor setup logic.
 * This makes the TextEditor component simpler and the editor logic more testable.
 *
 * @param options - Configuration options for the editor
 * @returns The TipTap editor instance
 */
export function useTextEditor({
  value,
  onChange,
  onKeyDown,
  placeholder = "What do you want to do?",
  disabled = false,
  className,
  commands: providedCommands = [],
  onSubmit,
  editorRef,
  menuOpenRef: externalMenuOpenRef,
}: UseTextEditorOptions) {
  // Get Tambo-specific commands (enabled when onSubmit is provided)
  const tamboCommands = useTamboCommands(!!onSubmit);

  // Merge provided commands with Tambo-specific commands
  const commands = React.useMemo(
    () => [...providedCommands, ...tamboCommands],
    [providedCommands, tamboCommands],
  );

  // Handle Enter key to submit message when onSubmit is provided
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent, editor: Editor) => {
      // Handle Shift+Enter to insert newline (TipTap default behavior)
      if (e.key === "Enter" && e.shiftKey) {
        // Let TipTap handle Shift+Enter naturally (inserts hard break)
        return;
      }

      // Handle Tambo-specific Enter key behavior
      if (onSubmit && e.key === "Enter" && !e.shiftKey && value.trim()) {
        e.preventDefault();
        void onSubmit(e as React.FormEvent);
        return;
      }

      // Delegate to provided onKeyDown handler
      if (onKeyDown) {
        onKeyDown(e, editor);
      }
    },
    [onSubmit, value, onKeyDown],
  );

  // Initialize menu open ref - shared across all commands
  // Use external ref if provided, otherwise create internal one
  const internalMenuOpenRef = React.useRef<boolean>(false);
  const menuOpenRef = externalMenuOpenRef ?? internalMenuOpenRef;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      Document,
      Paragraph,
      Text,
      HardBreak,
      Placeholder.configure({ placeholder }),
      ...commands.map((cmd) => {
        return Mention.configure({
          HTMLAttributes: cmd.HTMLAttributes ?? {},
          suggestion: createResourceItemConfig(
            cmd.items,
            cmd.onSelect,
            menuOpenRef,
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
          "tiptap prose prose-sm max-w-none focus:outline-none",
          "p-3 rounded-t-lg bg-transparent",
          "text-sm leading-relaxed",
          "min-h-[82px] max-h-[40vh] overflow-y-auto",
          "break-words whitespace-pre-wrap",
          className,
        ),
      },
      handleKeyDown: (view, event) => {
        // Prevent Enter from submitting form when selecting from menu
        if (event.key === "Enter" && !event.shiftKey && menuOpenRef.current) {
          // Prevent the DOM event from propagating
          event.preventDefault();
          event.stopPropagation();
          // Return false to let the suggestion plugin handle the selection
          return false;
        }

        // Delegate to handleKeyDown (which handles both Tambo-specific and custom handlers)
        if (editor) {
          const reactEvent = event as unknown as React.KeyboardEvent;
          handleKeyDown(reactEvent, editor);
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
    // Update external ref if provided
    if (editorRef) {
      editorRef.current = editor;
    }
  }, [editor, value, disabled, editorRef]);

  return editor;
}

/**
 * Extend the File interface to include the IS_PASTED_IMAGE property.
 * This is a type-safe way to mark pasted images without using a broad index signature.
 */
declare global {
  interface File {
    [IS_PASTED_IMAGE]?: boolean;
  }
}

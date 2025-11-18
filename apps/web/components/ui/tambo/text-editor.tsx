"use client";

import { EditorContent, type Editor } from "@tiptap/react";
import * as React from "react";
import "tippy.js/dist/tippy.css";

import type { CommandConfig } from "./text-editor-shared";
import { useTextEditor } from "./use-text-editor";

export interface TextEditorProps {
  value: string;
  onChange: (text: string) => void;
  onKeyDown?: (event: React.KeyboardEvent, editor: Editor) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  editorRef?: React.MutableRefObject<Editor | null>;
  commands?: CommandConfig[];
  /** Optional submit handler for Tambo-specific Enter key behavior */
  onSubmit?: (e: React.FormEvent) => Promise<void>;
}

/**
 * Text editor component with command support (e.g., "@" mentions).
 */
export const TextEditor = React.forwardRef<HTMLDivElement, TextEditorProps>(
  (props, ref) => {
    // Use the custom hook to set up the editor
    const editor = useTextEditor(props);

    return (
      <div ref={ref} className="w-full">
        <EditorContent editor={editor} />
      </div>
    );
  },
);

TextEditor.displayName = "TextEditor";

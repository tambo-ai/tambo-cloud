import {
  TextEditor,
  type CommandConfig,
} from "@/components/ui/tambo/text-editor";
import { render, screen } from "@testing-library/react";

// Mock Tambo hooks since we're testing the editor in isolation
jest.mock("@tambo-ai/react", () => ({
  useCurrentInteractablesSnapshot: jest.fn(() => []),
  useTamboContextAttachment: jest.fn(() => ({
    addContextAttachment: jest.fn(),
  })),
  useTamboThreadInput: jest.fn(() => ({
    addImage: jest.fn(),
  })),
}));

describe("TextEditor - Smoke Tests", () => {
  describe("Basic rendering", () => {
    it("renders without crashing", () => {
      render(<TextEditor value="" onChange={() => {}} />);

      const editor = document.querySelector(".tiptap.ProseMirror");
      expect(editor).toBeInTheDocument();
    });

    it("renders with placeholder attribute", () => {
      render(
        <TextEditor
          value=""
          onChange={() => {}}
          placeholder="Type something..."
        />,
      );

      const editor = document.querySelector(".tiptap.ProseMirror");
      const placeholder = editor?.querySelector(
        '[data-placeholder="Type something..."]',
      );
      expect(placeholder).toBeInTheDocument();
    });

    it("displays the provided value", () => {
      render(<TextEditor value="Hello world" onChange={() => {}} />);

      expect(screen.getByText("Hello world")).toBeInTheDocument();
    });

    it("respects disabled state", () => {
      render(<TextEditor value="" onChange={() => {}} disabled={true} />);

      const editor = document.querySelector(".tiptap.ProseMirror");
      expect(editor).toHaveAttribute("contenteditable", "false");
    });
  });

  describe("Command configuration", () => {
    it("renders with single command config", () => {
      const commands: CommandConfig[] = [
        {
          triggerChar: "@",
          items: [{ id: "1", name: "Test" }],
          renderLabel: ({ node }) => `@${node.attrs.label as string}`,
        },
      ];

      render(<TextEditor value="" onChange={() => {}} commands={commands} />);

      const editor = document.querySelector(".tiptap.ProseMirror");
      expect(editor).toBeInTheDocument();
    });

    it("renders with multiple command configs", () => {
      const commands: CommandConfig[] = [
        {
          triggerChar: "@",
          items: [{ id: "1", name: "At Item" }],
          renderLabel: ({ node }) => `@${node.attrs.label as string}`,
        },
        {
          triggerChar: "/",
          items: [{ id: "2", name: "Slash Item" }],
          renderLabel: ({ node }) => `/${node.attrs.label as string}`,
        },
      ];

      // This will show a warning about duplicate extension names, but should still render
      render(<TextEditor value="" onChange={() => {}} commands={commands} />);

      const editor = document.querySelector(".tiptap.ProseMirror");
      expect(editor).toBeInTheDocument();
    });

    it("renders with async items function", () => {
      const asyncItems = jest.fn(async () => [{ id: "1", name: "Async Item" }]);

      const commands: CommandConfig[] = [
        {
          triggerChar: "@",
          items: asyncItems,
          renderLabel: ({ node }) => `@${node.attrs.label as string}`,
        },
      ];

      render(<TextEditor value="" onChange={() => {}} commands={commands} />);

      const editor = document.querySelector(".tiptap.ProseMirror");
      expect(editor).toBeInTheDocument();
    });

    it("renders with onSelect callback", () => {
      const onSelect = jest.fn();
      const commands: CommandConfig[] = [
        {
          triggerChar: "@",
          items: [{ id: "1", name: "Test" }],
          onSelect,
          renderLabel: ({ node }) => `@${node.attrs.label as string}`,
        },
      ];

      render(<TextEditor value="" onChange={() => {}} commands={commands} />);

      const editor = document.querySelector(".tiptap.ProseMirror");
      expect(editor).toBeInTheDocument();
    });
  });

  describe("Props integration", () => {
    it("accepts editorRef prop", () => {
      const editorRef = { current: null };

      render(
        <TextEditor
          value=""
          onChange={() => {}}
          editorRef={editorRef as React.MutableRefObject<any>}
        />,
      );

      // After render, ref should be populated with editor instance
      expect(editorRef.current).toBeTruthy();
    });

    it("renders with onSubmit handler", () => {
      const onSubmit = jest.fn();

      render(
        <TextEditor value="test" onChange={() => {}} onSubmit={onSubmit} />,
      );

      const editor = document.querySelector(".tiptap.ProseMirror");
      expect(editor).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      render(
        <TextEditor value="" onChange={() => {}} className="custom-class" />,
      );

      const editor = document.querySelector(".tiptap.ProseMirror");
      expect(editor).toHaveClass("custom-class");
    });
  });

  describe("hasExistingMention utility", () => {
    it("exports hasExistingMention function", async () => {
      const { hasExistingMention } = await import(
        "@/components/ui/tambo/text-editor"
      );
      expect(typeof hasExistingMention).toBe("function");
    });
  });
});

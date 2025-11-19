import { useTextEditor } from "@/components/ui/tambo/use-text-editor";
import type { Editor } from "@tiptap/react";
import { renderHook } from "@testing-library/react";
import * as React from "react";

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

describe("useTextEditor", () => {
  describe("Basic hook behavior", () => {
    it("returns an editor instance", () => {
      const { result } = renderHook(() =>
        useTextEditor({
          value: "",
          onChange: jest.fn(),
        }),
      );

      expect(result.current).toBeTruthy();
      expect(result.current).toHaveProperty("commands");
      expect(result.current).toHaveProperty("state");
    });

    it("initializes with provided value", () => {
      const { result } = renderHook(() =>
        useTextEditor({
          value: "Hello world",
          onChange: jest.fn(),
        }),
      );

      expect(result.current?.getText()).toBe("Hello world");
    });

    it("respects disabled state", () => {
      const { result } = renderHook(() =>
        useTextEditor({
          value: "",
          onChange: jest.fn(),
          disabled: true,
        }),
      );

      expect(result.current?.isEditable).toBe(false);
    });

    it("respects enabled state", () => {
      const { result } = renderHook(() =>
        useTextEditor({
          value: "",
          onChange: jest.fn(),
          disabled: false,
        }),
      );

      expect(result.current?.isEditable).toBe(true);
    });

    it("calls onChange when content changes", () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useTextEditor({
          value: "",
          onChange,
        }),
      );

      // Insert text using the editor commands
      result.current?.commands.insertContent("test");

      expect(onChange).toHaveBeenCalledWith("test");
    });
  });

  describe("Placeholder configuration", () => {
    it("uses default placeholder when not provided", () => {
      const { result } = renderHook(() =>
        useTextEditor({
          value: "",
          onChange: jest.fn(),
        }),
      );

      const placeholderExt = result.current?.extensionManager.extensions.find(
        (ext) => ext.name === "placeholder",
      );
      expect(placeholderExt?.options.placeholder).toBe(
        "What do you want to do?",
      );
    });

    it("uses custom placeholder when provided", () => {
      const { result } = renderHook(() =>
        useTextEditor({
          value: "",
          onChange: jest.fn(),
          placeholder: "Custom placeholder",
        }),
      );

      const placeholderExt = result.current?.extensionManager.extensions.find(
        (ext) => ext.name === "placeholder",
      );
      expect(placeholderExt?.options.placeholder).toBe("Custom placeholder");
    });
  });

  describe("EditorRef", () => {
    it("populates editorRef with editor instance", () => {
      const editorRef =
        React.createRef<Editor | null>() as React.MutableRefObject<Editor | null>;
      editorRef.current = null;

      renderHook(() =>
        useTextEditor({
          value: "",
          onChange: jest.fn(),
          editorRef,
        }),
      );

      expect(editorRef.current).toBeTruthy();
      expect(editorRef.current).toHaveProperty("commands");
    });
  });

  describe("Commands configuration", () => {
    it("creates editor without commands", () => {
      const { result } = renderHook(() =>
        useTextEditor({
          value: "",
          onChange: jest.fn(),
          commands: [],
        }),
      );

      // Should have no mention extensions when no commands provided
      const mentionExtensions =
        result.current?.extensionManager.extensions.filter(
          (ext) => ext.name === "mention",
        );
      expect(mentionExtensions?.length).toBe(0);
    });

    it("creates mention extension for each command", () => {
      const { result } = renderHook(() =>
        useTextEditor({
          value: "",
          onChange: jest.fn(),
          commands: [
            {
              triggerChar: "@",
              items: [{ id: "1", name: "Test" }],
              renderLabel: ({ node }) => `@${node.attrs.label as string}`,
            },
          ],
        }),
      );

      const mentionExtensions =
        result.current?.extensionManager.extensions.filter(
          (ext) => ext.name === "mention",
        );
      expect(mentionExtensions?.length).toBe(1);
    });

    it("creates multiple mention extensions for multiple commands", () => {
      const { result } = renderHook(() =>
        useTextEditor({
          value: "",
          onChange: jest.fn(),
          commands: [
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
          ],
        }),
      );

      const mentionExtensions =
        result.current?.extensionManager.extensions.filter(
          (ext) => ext.name === "mention",
        );
      expect(mentionExtensions?.length).toBe(2);
    });
  });

  describe("Extensions", () => {
    it("includes required extensions", () => {
      const { result } = renderHook(() =>
        useTextEditor({
          value: "",
          onChange: jest.fn(),
        }),
      );

      const extensionNames = result.current?.extensionManager.extensions.map(
        (ext) => ext.name,
      );

      expect(extensionNames).toContain("doc");
      expect(extensionNames).toContain("paragraph");
      expect(extensionNames).toContain("text");
      expect(extensionNames).toContain("hardBreak");
      expect(extensionNames).toContain("placeholder");
    });
  });

  describe("Value updates", () => {
    it("updates editor content when value changes", () => {
      const { result, rerender } = renderHook(
        ({ value }) =>
          useTextEditor({
            value,
            onChange: jest.fn(),
          }),
        {
          initialProps: { value: "initial" },
        },
      );

      expect(result.current?.getText()).toBe("initial");

      rerender({ value: "updated" });

      expect(result.current?.getText()).toBe("updated");
    });
  });

  describe("Menu open ref", () => {
    it("uses external menuOpenRef when provided", () => {
      const menuOpenRef =
        React.createRef<boolean>() as React.MutableRefObject<boolean>;
      menuOpenRef.current = false;

      renderHook(() =>
        useTextEditor({
          value: "",
          onChange: jest.fn(),
          menuOpenRef,
        }),
      );

      // The ref should still be the same object
      expect(menuOpenRef.current).toBe(false);
    });

    it("creates internal menuOpenRef when not provided", () => {
      const { result } = renderHook(() =>
        useTextEditor({
          value: "",
          onChange: jest.fn(),
        }),
      );

      // Should successfully create editor without external menuOpenRef
      expect(result.current).toBeTruthy();
    });
  });
});

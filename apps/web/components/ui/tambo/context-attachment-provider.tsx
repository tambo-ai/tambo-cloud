"use client";

import { useTamboContextHelpers, type Suggestion } from "@tambo-ai/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * Represents a context item that can be displayed in MessageInputContexts.
 * Context items appear as badges above the message input and provide additional
 * information to the AI about what to focus on.
 *
 * @property {string} name - Display name shown in the badge
 * @property {ReactNode} [icon] - Optional icon to display in the badge
 * @property {Record<string, unknown>} [metadata] - Additional data passed to the AI
 *
 * @example
 * ```tsx
 * const context: ContextItem = {
 *   name: "Button.tsx",
 *   icon: <FileIcon />,
 *   metadata: { filePath: "/src/components/Button.tsx" }
 * };
 * ```
 */
export interface ContextItem {
  id: string;
  name: string;
  icon?: ReactNode;
  metadata?: Record<string, unknown>;
}

/**
 * Represents the data structure returned by a context helper
 */
export interface ContextHelperData {
  selectedComponent: {
    name: string;
    instruction?: string;
    [key: string]: unknown;
  };
}

/**
 * Context state interface for managing context attachments and custom suggestions.
 *
 * @property {ContextItem[]} attachments - Array of active context items (badges above message input)
 * @property {function} addContextAttachment - Add a new context item
 * @property {function} removeContextAttachment - Remove a context item by ID
 * @property {function} clearContextAttachments - Remove all context items - This is used to clear the context when the user submits a message
 * @property {Suggestion[] | null} customSuggestions - Custom suggestions to display instead of auto-generated ones
 * @property {function} setCustomSuggestions - Set or clear custom suggestions
 */
interface ContextAttachmentState {
  attachments: ContextItem[];
  addContextAttachment: (context: Omit<ContextItem, "id">) => void;
  removeContextAttachment: (id: string) => void;
  clearContextAttachments: () => void;
  customSuggestions: Suggestion[] | null;
  setCustomSuggestions: (suggestions: Suggestion[] | null) => void;
}

const ContextAttachmentContext = createContext<ContextAttachmentState | null>(
  null,
);

/**
 * Props for the ContextAttachmentProvider.
 */
export interface ContextAttachmentProviderProps {
  children: ReactNode;
  /**
   * Optional function to customize the data sent to the AI for each context.
   * If not provided, uses a default structure with the context name and instruction.
   *
   * @param context - The context item to generate data for
   * @returns Object containing data to send to the AI (can be async)
   *
   * @example
   * ```tsx
   * <ContextAttachmentProvider
   *   getContextHelperData={(context) => ({
   *     selectedFile: {
   *       name: context.name,
   *       path: context.metadata?.filePath,
   *       instruction: "Focus on this file"
   *     }
   *   })}
   * >
   *   {children}
   * </ContextAttachmentProvider>
   * ```
   */
  getContextHelperData?: (
    context: ContextItem,
  ) => Promise<ContextHelperData> | ContextHelperData;
}

/**
 * Provider that enables context attachment features and custom suggestions in MessageInput.
 *
 * **When to use:**
 * - **Optional** - MessageInput works without this provider (shows images only)
 * - **Required** if you want to programmatically add context items (components, files, etc.)
 * - **Required** if you want to set custom suggestions for message threads
 * - Wrap your app or specific routes where you need context features
 *
 * **What it does:**
 * - Manages context items that appear as badges above MessageInput
 * - Syncs context data with Tambo's AI for better responses
 * - Manages custom suggestions that replace auto-generated suggestions
 * - Allows components to add/remove contexts via `useContextAttachment()`
 * - Allows components to set custom suggestions via `setCustomSuggestions()`
 *
 * **Without this provider:**
 * - MessageInputContexts will only show images (still works!)
 * - `useContextAttachment()` returns `undefined`
 * - Custom suggestions cannot be set
 *
 * @example
 * Basic usage - wrap your app
 * ```tsx
 * <TamboProvider apiKey="...">
 *   <ContextAttachmentProvider>
 *     <App />
 *   </ContextAttachmentProvider>
 * </TamboProvider>
 * ```
 *
 * @example
 * With custom context data
 * ```tsx
 * <ContextAttachmentProvider
 *   getContextHelperData={(context) => ({
 *     selectedComponent: {
 *       name: context.name,
 *       filePath: context.metadata?.path,
 *       instruction: "Edit this component"
 *     }
 *   })}
 * >
 *   <App />
 * </ContextAttachmentProvider>
 * ```
 */
export function ContextAttachmentProvider({
  children,
  getContextHelperData,
}: ContextAttachmentProviderProps) {
  const [attachments, setAttachments] = useState<ContextItem[]>([]);
  const [customSuggestions, setCustomSuggestions] = useState<
    Suggestion[] | null
  >(null);
  const { addContextHelper, removeContextHelper } = useTamboContextHelpers();
  const previousContextIdsRef = useRef<Set<string>>(new Set());

  // Sync attachments to Tambo's context helpers
  useEffect(() => {
    const currentIds = new Set(attachments.map((c) => c.id));
    const previousIds = previousContextIdsRef.current;

    // Add new contexts
    attachments.forEach((context) => {
      if (!previousIds.has(context.id)) {
        addContextHelper(context.id, async (): Promise<ContextHelperData> => {
          if (getContextHelperData) {
            return await getContextHelperData(context);
          }
          return {
            selectedComponent: {
              name: context.name,
              instruction:
                "This component is selected. Only edit this component.",
              ...(context.metadata || {}),
            },
          };
        });
      }
    });

    // Remove deleted contexts
    previousIds.forEach((id) => {
      if (!currentIds.has(id)) {
        removeContextHelper(id);
      }
    });

    previousContextIdsRef.current = currentIds;

    // Cleanup: remove all context helpers on unmount
    return () => {
      previousContextIdsRef.current.forEach((id) => {
        removeContextHelper(id);
      });
    };
  }, [
    attachments,
    addContextHelper,
    removeContextHelper,
    getContextHelperData,
  ]);

  const addContextAttachment = useCallback(
    (context: Omit<ContextItem, "id">) => {
      setAttachments((prev) => {
        if (prev.some((c) => c.name === context.name)) return prev;
        const newId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        return [...prev, { ...context, id: newId }];
      });
    },
    [],
  );

  // This is used to remove a context when the user clicks the remove button
  const removeContextAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // This is used to clear the context when the user submits a message
  const clearContextAttachments = useCallback(() => {
    // Remove all context helpers before clearing
    attachments.forEach((context) => {
      removeContextHelper(context.id);
    });
    setAttachments([]);
  }, [attachments, removeContextHelper]);

  const value = useMemo(
    () => ({
      attachments,
      addContextAttachment,
      removeContextAttachment,
      clearContextAttachments,
      customSuggestions,
      setCustomSuggestions,
    }),
    [
      attachments,
      addContextAttachment,
      removeContextAttachment,
      clearContextAttachments,
      customSuggestions,
    ],
  );

  return (
    <ContextAttachmentContext.Provider value={value}>
      {children}
    </ContextAttachmentContext.Provider>
  );
}

/**
 * Hook to access context attachment state and methods.
 *
 * **Important:** Returns `undefined` if used outside of `ContextAttachmentProvider`.
 * Always use optional chaining or check for `undefined` before calling methods.
 *
 * @returns Context state with `attachments`, `addContextAttachment`, `removeContextAttachment`,
 *          `customSuggestions`, and `setCustomSuggestions`, or `undefined`
 *
 * @example
 * Adding a context (safe with optional chaining)
 * ```tsx
 * function MyComponent() {
 *   const contextAttachment = useContextAttachment();
 *
 *   const handleClick = () => {
 *     contextAttachment?.addContextAttachment({
 *       name: "Button.tsx",
 *       icon: <FileIcon />,
 *       metadata: { path: "/src/Button.tsx" }
 *     });
 *   };
 *
 *   return <button onClick={handleClick}>Add Context</button>;
 * }
 * ```
 *
 * @example
 * Setting custom suggestions
 * ```tsx
 * function EditableComponent() {
 *   const contextAttachment = useContextAttachment();
 *
 *   const handleEditClick = () => {
 *     contextAttachment?.setCustomSuggestions([
 *       {
 *         id: "suggestion-1",
 *         title: "Add Feature",
 *         detailedSuggestion: "Add a new feature to this component",
 *         messageId: "add-feature"
 *       }
 *     ]);
 *   };
 *
 *   return <button onClick={handleEditClick}>Edit</button>;
 * }
 * ```
 *
 * @example
 * Checking if provider is available
 * ```tsx
 * const contextAttachment = useContextAttachment();
 *
 * if (contextAttachment) {
 *   // Provider is available, use context features
 *   contextAttachment.addContextAttachment({ name: "File.tsx" });
 * }
 * ```
 *
 * @example
 * Removing a context - This is used to remove a context when the user clicks the remove button
 * ```tsx
 * contextAttachment?.removeContextAttachment(contextId);
 * ```
 *
 * @example
 * Clearing all contexts - This is used to clear the context when the user submits a message
 * ```tsx
 * contextAttachment?.clearContextAttachments();
 * ```
 *
 * @example
 * Clearing custom suggestions
 * ```tsx
 * contextAttachment?.setCustomSuggestions(null);
 * ```
 */
export function useContextAttachment() {
  return useContext(ContextAttachmentContext);
}

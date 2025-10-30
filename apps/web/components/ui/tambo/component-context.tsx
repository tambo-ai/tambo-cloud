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
 * Context state interface for managing component contexts and custom suggestions.
 *
 * @property {ContextItem[]} contexts - Array of active context items (badges above message input)
 * @property {function} addContext - Add a new context item
 * @property {function} removeContext - Remove a context item by ID
 * @property {function} clearContexts - Remove all context items - This is used to clear the context when the user submits a message
 * @property {Suggestion[] | null} customSuggestions - Custom suggestions to display instead of auto-generated ones
 * @property {function} setCustomSuggestions - Set or clear custom suggestions
 */
interface ContextState {
  contexts: ContextItem[];
  addContext: (context: Omit<ContextItem, "id">) => void;
  removeContext: (id: string) => void;
  clearContexts: () => void;
  customSuggestions: Suggestion[] | null;
  setCustomSuggestions: (suggestions: Suggestion[] | null) => void;
}

const ComponentContext = createContext<ContextState | null>(null);

/**
 * Props for the ComponentContextProvider.
 */
export interface ComponentContextProviderProps {
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
   * <ComponentContextProvider
   *   getContextHelperData={(context) => ({
   *     selectedFile: {
   *       name: context.name,
   *       path: context.metadata?.filePath,
   *       instruction: "Focus on this file"
   *     }
   *   })}
   * >
   *   {children}
   * </ComponentContextProvider>
   * ```
   */
  getContextHelperData?: (
    context: ContextItem,
  ) => Promise<ContextHelperData> | ContextHelperData;
}

/**
 * Provider that enables component context features and custom suggestions in MessageInput.
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
 * - Allows components to add/remove contexts via `useComponentContext()`
 * - Allows components to set custom suggestions via `setCustomSuggestions()`
 *
 * **Without this provider:**
 * - MessageInputContexts will only show images (still works!)
 * - `useComponentContext()` returns `undefined`
 * - Custom suggestions cannot be set
 *
 * @example
 * Basic usage - wrap your app
 * ```tsx
 * <TamboProvider apiKey="...">
 *   <ComponentContextProvider>
 *     <App />
 *   </ComponentContextProvider>
 * </TamboProvider>
 * ```
 *
 * @example
 * With custom context data
 * ```tsx
 * <ComponentContextProvider
 *   getContextHelperData={(context) => ({
 *     selectedComponent: {
 *       name: context.name,
 *       filePath: context.metadata?.path,
 *       instruction: "Edit this component"
 *     }
 *   })}
 * >
 *   <App />
 * </ComponentContextProvider>
 * ```
 */
export function ComponentContextProvider({
  children,
  getContextHelperData,
}: ComponentContextProviderProps) {
  const [contexts, setContexts] = useState<ContextItem[]>([]);
  const [customSuggestions, setCustomSuggestions] = useState<
    Suggestion[] | null
  >(null);
  const { addContextHelper, removeContextHelper } = useTamboContextHelpers();
  const previousContextIdsRef = useRef<Set<string>>(new Set());

  // Sync contexts to Tambo's context helpers
  useEffect(() => {
    const currentIds = new Set(contexts.map((c) => c.id));
    const previousIds = previousContextIdsRef.current;

    // Add new contexts
    contexts.forEach((context) => {
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
  }, [contexts, addContextHelper, removeContextHelper, getContextHelperData]);

  const addContext = useCallback((context: Omit<ContextItem, "id">) => {
    setContexts((prev) => {
      if (prev.some((c) => c.name === context.name)) return prev;
      return [...prev, { ...context, id: `ctx-${Date.now()}` }];
    });
  }, []);

  // This is used to remove a context when the user clicks the remove button
  const removeContext = useCallback((id: string) => {
    setContexts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // This is used to clear the context when the user submits a message
  const clearContexts = useCallback(() => {
    // Remove all context helpers before clearing
    contexts.forEach((context) => {
      removeContextHelper(context.id);
    });
    setContexts([]);
  }, [contexts, removeContextHelper]);

  const value = useMemo(
    () => ({
      contexts,
      addContext,
      removeContext,
      clearContexts,
      customSuggestions,
      setCustomSuggestions,
    }),
    [contexts, addContext, removeContext, clearContexts, customSuggestions],
  );

  return (
    <ComponentContext.Provider value={value}>
      {children}
    </ComponentContext.Provider>
  );
}

/**
 * Hook to access component context state and methods.
 *
 * **Important:** Returns `undefined` if used outside of `ComponentContextProvider`.
 * Always use optional chaining or check for `undefined` before calling methods.
 *
 * @returns Context state with `contexts`, `addContext`, `removeContext`,
 *          `customSuggestions`, and `setCustomSuggestions`, or `undefined`
 *
 * @example
 * Adding a context (safe with optional chaining)
 * ```tsx
 * function MyComponent() {
 *   const componentContext = useComponentContext();
 *
 *   const handleClick = () => {
 *     componentContext?.addContext({
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
 *   const componentContext = useComponentContext();
 *
 *   const handleEditClick = () => {
 *     componentContext?.setCustomSuggestions([
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
 * const componentContext = useComponentContext();
 *
 * if (componentContext) {
 *   // Provider is available, use context features
 *   componentContext.addContext({ name: "File.tsx" });
 * }
 * ```
 *
 * @example
 * Removing a context - This is used to remove a context when the user clicks the remove button
 * ```tsx
 * componentContext?.removeContext(contextId);
 * ```
 *
 * @example
 * Clearing all contexts - This is used to clear the context when the user submits a message
 * ```tsx
 * componentContext?.clearContexts();
 * ```
 *
 * @example
 * Clearing custom suggestions
 * ```tsx
 * componentContext?.setCustomSuggestions(null);
 * ```
 */
export function useComponentContext() {
  return useContext(ComponentContext);
}

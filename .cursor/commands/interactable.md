# interactable

Guide for making React components interactable with Tambo AI.

## Overview

Interactable components are pre-placed by you but can be controlled by Tambo through natural language. They auto-register when mounted - no manual registration needed.

## Steps to Make a Component Interactable

### 1. Import `withInteractable`

```typescript
import { withInteractable } from "@tambo-ai/react";
import { z } from "zod";
```

### 2. Create Zod Schema with Detailed Descriptions

```typescript
export const InteractableYourComponentProps = z.object({
  // Required/current state props
  projectId: z.string().describe("The project ID..."),
  currentValue: z.string().optional().describe("Current value..."),

  // Interactable control props - these let Tambo trigger actions
  editedValue: z
    .string()
    .optional()
    .describe("When set, enters edit mode with this value..."),
  createNewItem: z
    .string()
    .optional()
    .describe("When set, creates a new item with this name..."),
  deleteItemId: z
    .string()
    .optional()
    .describe("When set, deletes the item with this ID..."),

  // Callback
  onEdited: z
    .function()
    .args()
    .returns(z.void())
    .optional()
    .describe("Callback triggered when changes are saved..."),
});
```

**Key principles:**

- **Current state props**: What the component displays now
- **Control props**: Actions Tambo can trigger (`editedValue`, `createX`, `deleteX`, `toggleX`, etc.)
- **Descriptions are critical**: They tell Tambo what each prop does and when to use it

### 3. Update TypeScript Interface

```typescript
interface YourComponentProps {
  projectId: string;
  currentValue?: string;
  // Add the interactable control props
  editedValue?: string;
  createNewItem?: string;
  deleteItemId?: string;
  onEdited?: () => void;
}
```

### 4. Add useEffect Hooks to Watch Control Props

```typescript
export function YourComponent({
  projectId,
  currentValue,
  editedValue,
  createNewItem,
  deleteItemId,
  onEdited,
}: YourComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayValue, setDisplayValue] = useState(currentValue ?? "");

  // Sync current value from props (but respect ongoing edits)
  useEffect(() => {
    if (currentValue !== undefined && !isEditing) {
      setDisplayValue(currentValue);
    }
  }, [currentValue, isEditing]);

  // When Tambo sends editedValue, enter edit mode
  useEffect(() => {
    if (editedValue !== undefined) {
      setDisplayValue(editedValue);
      setIsEditing(true);
    }
  }, [editedValue]);

  // When Tambo sends createNewItem, create it
  useEffect(() => {
    if (createNewItem !== undefined) {
      handleCreate(createNewItem).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createNewItem]);

  // When Tambo sends deleteItemId, delete it
  useEffect(() => {
    if (deleteItemId !== undefined) {
      handleDelete(deleteItemId).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteItemId]);

  // ... rest of component
}
```

### 5. Wrap and Export with `withInteractable`

```typescript
export const InteractableYourComponent = withInteractable(YourComponent, {
  componentName: "ComponentName",
  description: "Clear description of what this component does and manages...",
  propsSchema: InteractableYourComponentProps,
});
```

### 6. Use the Interactable Version

```typescript
// In the parent component
<InteractableYourComponent
  projectId={project.id}
  currentValue={project.someValue}
  onEdited={handleRefresh}
/>
```

## Patterns for Complex Components

### Multiple Edit States

```typescript
// Separate control props for different sections
editSettings: z.object({ theme: z.string() }).optional(),
editFilters: z.array(z.string()).optional(),
```

### Nested Objects

```typescript
// Be explicit about what can be updated
updateConfig: z.object({
  provider: z.string().optional(),
  apiKey: z.string().optional(),
}).partial().optional().describe("Partial config updates..."),
```

### Arrays/Lists

```typescript
addItem: z.object({ name: z.string() }).optional(),
removeItemAtIndex: z.number().optional(),
updateItems: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
```

### Toggle States

```typescript
enableFeature: z.boolean().optional().describe("When set, toggles feature on/off"),
```

### Complex Actions

```typescript
triggerAction: z.enum(["save", "reset", "refresh"]).optional(),
actionPayload: z.unknown().optional(), // For action-specific data
```

## Real Examples in Codebase

### InteractableCustomInstructionsEditor

```typescript
export const InteractableCustomInstructionsEditorProps = z.object({
  projectId: z.string().describe("The unique identifier for the project."),
  customInstructions: z
    .string()
    .nullable()
    .optional()
    .describe("The current custom instructions for the AI assistant."),
  allowSystemPromptOverride: z
    .boolean()
    .nullable()
    .optional()
    .describe("Current setting for system prompt override."),
  editedValue: z
    .string()
    .optional()
    .describe(
      "The value to overwrite the current custom instructions field with. When set, the component will be in 'editing mode' where the user can save this updated value or cancel it.",
    ),
});
```

### InteractableAPIKeyList

```typescript
export const InteractableAPIKeyListProps = z.object({
  projectId: z.string().describe("The project ID to fetch API keys for."),
  isLoading: z
    .boolean()
    .optional()
    .describe("Whether the API keys are loading."),
  createKeyWithName: z
    .string()
    .optional()
    .describe(
      "When set, automatically creates a new API key with the specified name. The component will enter create mode and execute the key creation.",
    ),
  enterCreateMode: z
    .boolean()
    .optional()
    .describe(
      "When true, automatically opens the create key form dialog, allowing the user to enter a key name manually.",
    ),
  onEdited: z
    .function()
    .args()
    .returns(z.void())
    .optional()
    .describe(
      "Optional callback function triggered when API keys are successfully created, updated, or deleted.",
    ),
});
```

## Key Principles

1. **Keep props flat and simple** when possible
2. **Each control prop = one clear action** that Tambo can trigger
3. **Descriptions are Tambo's interface** - be detailed and specific about what each prop does
4. **Call `onEdited()` after any mutation** to notify parent
5. **No registration needed** - component auto-registers on mount (unlike regular components)
6. **Pass minimal props** - only what the component actually uses
7. **Use useEffect to watch control props** - they trigger actions when Tambo sets them
8. **Respect ongoing user edits** - don't overwrite state during active editing

## Important Notes

- Interactable components are **automatically registered when they mount** - do NOT add them to `TamboProvider` components array
- If you want Tambo to both modify pre-placed instances AND generate new instances inline, register the component normally in `TamboProvider` as well
- The component name in `withInteractable` config is what Tambo uses to reference it
- Descriptions in Zod schemas are how Tambo understands what the component does - make them clear and actionable

## Documentation Reference

https://docs.tambo.co/concepts/components/interactable-components

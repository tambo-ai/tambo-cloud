# interactable

Guide for making React components interactable with Tambo AI.

## Overview

Interactable components are pre-placed by you but can be controlled by Tambo through natural language.

**🚨 KEY DIFFERENCE: Interactable components auto-register when mounted - DO NOT add them to `TamboProvider` components array!**

Unlike regular components that must be registered in `TamboProvider`, interactable components handle their own registration automatically when they mount.

### When to Use Interactable vs Regular Components

| Feature          | Interactable Components                                 | Regular Components                                              |
| ---------------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| **Placement**    | You place them in JSX                                   | Tambo generates them inline                                     |
| **Registration** | ✅ Auto-registers on mount                              | ❌ Must register in `TamboProvider`                             |
| **Control**      | Tambo updates props                                     | Tambo creates/removes instances                                 |
| **Use Case**     | Settings panels, editors, forms that are always visible | Dynamic content, tables, charts that Tambo decides when to show |

**Pro Tip**: If you want BOTH behaviors (pre-placed AND Tambo can generate new ones), register it in `TamboProvider` too.

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

## Automatic Context Awareness

When you use interactable components, they are **automatically included in the AI's context**. This means:

- The AI knows what components are currently on the page
- Users can ask "What's on this page?" and get a comprehensive answer
- The AI can see the current state (props) of all interactable components
- Component changes are reflected in real-time

**No additional setup required** - this context is provided automatically.

## Auto-Registered Tools

When interactable components are present, these tools are automatically available to Tambo:

- `get_all_interactable_components` — Returns all interactable components with their current props
- `get_interactable_component_by_id` — Returns a specific component by ID
- `remove_interactable_component` — Removes a component from the interactables list
- `update_interactable_component_<id>` — Updates props for a specific component using partial props

These tools enable Tambo to discover what's on the page and perform targeted updates.

## Partial Updates Behavior

Interactable component props are updated via **partial updates**:

- Only the provided **top-level props** are replaced
- Providing `{ count: 5 }` only updates `count`, leaving other props unchanged
- **Nested objects are replaced entirely** - if you update a nested object, provide the complete nested object to avoid losing properties

Example:

```typescript
// Original props
{
  title: "Original",
  config: { theme: "light", language: "en" }
}

// Partial update
{ config: { theme: "dark" } }

// Result (config is completely replaced!)
{
  title: "Original",
  config: { theme: "dark" }  // language is now undefined!
}
```

**Best practice**: For nested updates, provide the complete nested object.

## Important Notes

- **🚨 DO NOT register interactable components in `TamboProvider` components array** - they auto-register on mount
- If you want Tambo to both modify pre-placed instances AND generate new instances inline, then register the component normally in `TamboProvider` as well
- The component name in `withInteractable` config is what Tambo uses to reference it
- Descriptions in Zod schemas are how Tambo understands what the component does - make them clear and actionable
- Each interactable component gets a unique ID for targeted updates
- Use `useCurrentInteractablesSnapshot()` hook to read current interactables without mutating internal state

## Quick Checklist

When making a component interactable, ensure you have:

- [ ] Imported `withInteractable` from `@tambo-ai/react`
- [ ] Created Zod schema with detailed descriptions for all props
- [ ] Added control props (e.g., `editedValue`, `createX`, `deleteX`) for Tambo to trigger actions
- [ ] Added TypeScript interface matching the Zod schema
- [ ] Added `useEffect` hooks to watch control props and trigger actions
- [ ] Wrapped component with `withInteractable` and exported it
- [ ] Used the `Interactable` version in parent component (not the base component)
- [ ] **NOT** added it to `TamboProvider` components array (unless you want both behaviors)
- [ ] Passed minimal props - only what the component actually needs
- [ ] Added `onEdited` callback and call it after mutations

## Documentation Reference

https://docs.tambo.co/concepts/components/interactable-components

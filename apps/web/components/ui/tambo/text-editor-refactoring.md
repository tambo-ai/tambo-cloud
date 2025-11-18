# TextEditor Refactoring Plan

## Complexity Issues Identified

### 1. Confusing ref structure (lines 500-509)

**Problem**: Creates wrapper objects for each command, all sharing the same `stableMenuOpenRef`
**Location**: `apps/web/components/ui/tambo/text-editor.tsx:500-509`

### 2. Triple-nested wrapper function (lines 298-312)

**Problem**: `createWrapCommand` is a higher-order function with three levels of nesting
**Location**: `apps/web/components/ui/tambo/text-editor.tsx:298-312`

### 3. 100ms setTimeout hack (lines 353-359)

**Problem**: Race condition workaround that's fragile and hard to reason about
**Location**: `apps/web/components/ui/tambo/text-editor.tsx:353-359`

### 4. Inconsistent async/sync item filtering (lines 276-284, 399-415)

**Problem**: Static arrays filter synchronously, functions are async, creating confusion
**Location**: `apps/web/components/ui/tambo/text-editor.tsx:276-284, 399-415`

---

## Proposed Fixes

### [x] Fix 1: Simplify ref management

**Current code**:

```typescript
const stableMenuOpenRef = React.useRef<boolean>(false);
const commandRefs = React.useMemo(
  () =>
    commands.map((cmd) => ({
      isMenuOpenRef: cmd.isMenuOpenRef ?? stableMenuOpenRef,
    })),
  [commands],
);
```

**Proposed**:

```typescript
// Single shared ref for all commands (simpler!)
const menuOpenRef = React.useRef<boolean>(false);

// Pass the same ref to all commands - they all share state
// This is actually what the current code does, just more directly
```

**Why better**: Removes unnecessary array mapping and wrapper objects. Makes it clear that all commands share the same "is menu open" state.

### [x] Fix 2: Flatten wrapper function

**Current code**:

```typescript
const createWrapCommand =
  (editor: Editor) =>
  (tiptapCommand: (attrs: { id: string; label: string }) => void) =>
  (item: ResourceItem) => {
    if (hasExistingMention(editor, item.name)) {
      return;
    }
    tiptapCommand({ id: item.id, label: item.name });
    onSelect?.(item);
  };
```

**Proposed**:

```typescript
function createCommandHandler(
  editor: Editor,
  tiptapCommand: (attrs: { id: string; label: string }) => void,
  item: ResourceItem,
  onSelect?: (item: ResourceItem) => void,
) {
  if (hasExistingMention(editor, item.name)) {
    return;
  }
  tiptapCommand({ id: item.id, label: item.name });
  onSelect?.(item);
}

// Usage in onStart:
command: (item) =>
  createCommandHandler(props.editor, props.command, item, onSelect);
```

**Why better**: Single function instead of curried triple-nesting. Easier to read, test, and debug.

### [x] Fix 3: Remove 100ms setTimeout hack

**Current code**:

```typescript
onExit: () => {
  setTimeout(() => {
    if (isMenuOpenRef) isMenuOpenRef.current = false;
  }, 100);
  popupHandlers.onExit();
},
```

**Proposed**:

```typescript
onExit: () => {
  // Set to false immediately - no race condition
  if (isMenuOpenRef) isMenuOpenRef.current = false;
  popupHandlers.onExit();
},
```

**Why better**: The 100ms delay was trying to let the Enter key handler see the menu was open. But the TipTap suggestion plugin already handles this correctly - it intercepts Enter when the menu is active. We don't need the delay.

**Testing note**: Verify that pressing Enter in dropdown selects item and doesn't submit form.

### [x] Fix 4: Consistent async handling

**Current code**:

```typescript
items: async ({ query }) => {
  if (typeof items === "function") {
    return await items(query);
  }
  return items.filter((item) =>
    item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
},
```

**Proposed**: Keep as-is - this is actually fine! The function already handles both cases consistently.

**Status**: No change needed

---

## Testing Plan

### Behavior to Preserve

1. ✅ Typing trigger character ("@") shows dropdown with filtered items
2. ✅ Arrow keys navigate dropdown items
3. ✅ Enter key selects item from dropdown (does NOT submit form)
4. ✅ Enter key without dropdown submits form (when onSubmit provided)
5. ✅ Duplicate mentions are prevented
6. ✅ Custom onSelect callback is called when item selected
7. ✅ Shift+Enter adds newline instead of submitting
8. ✅ Escape key closes dropdown
9. ✅ Image paste works when onSubmit provided
10. ✅ Context attachments are added when mention selected

### Automated Test Cases

#### Test 1: Basic mention dropdown

```typescript
it('shows dropdown when trigger character is typed', async () => {
  const items = [
    { id: '1', name: 'Component 1' },
    { id: '2', name: 'Component 2' },
  ];
  const commands = [{
    triggerChar: '@',
    items,
    renderLabel: ({ node }) => `@${node.attrs.label}`,
  }];

  render(<TextEditor value="" onChange={() => {}} commands={commands} />);

  const editor = screen.getByRole('textbox');
  await userEvent.type(editor, '@');

  expect(screen.getByText('Component 1')).toBeInTheDocument();
  expect(screen.getByText('Component 2')).toBeInTheDocument();
});
```

#### Test 2: Dropdown filtering

```typescript
it('filters dropdown items as user types', async () => {
  const items = [
    { id: '1', name: 'Apple' },
    { id: '2', name: 'Banana' },
  ];
  const commands = [{
    triggerChar: '@',
    items,
    renderLabel: ({ node }) => `@${node.attrs.label}`,
  }];

  render(<TextEditor value="" onChange={() => {}} commands={commands} />);

  await userEvent.type(screen.getByRole('textbox'), '@ba');

  expect(screen.queryByText('Apple')).not.toBeInTheDocument();
  expect(screen.getByText('Banana')).toBeInTheDocument();
});
```

#### Test 3: Prevent duplicate mentions

```typescript
it('prevents duplicate mentions', async () => {
  const onSelect = jest.fn();
  const items = [{ id: '1', name: 'Component 1' }];
  const commands = [{
    triggerChar: '@',
    items,
    onSelect,
    renderLabel: ({ node }) => `@${node.attrs.label}`,
  }];

  render(<TextEditor value="" onChange={() => {}} commands={commands} />);

  // Select mention first time
  await userEvent.type(screen.getByRole('textbox'), '@Component 1');
  await userEvent.keyboard('{Enter}');

  expect(onSelect).toHaveBeenCalledTimes(1);

  // Try to select same mention again
  await userEvent.type(screen.getByRole('textbox'), '@Component 1');
  await userEvent.keyboard('{Enter}');

  // Should still only be called once
  expect(onSelect).toHaveBeenCalledTimes(1);
});
```

#### Test 4: Enter key with dropdown does NOT submit form

```typescript
it('does not submit form when Enter selects from dropdown', async () => {
  const onSubmit = jest.fn();
  const items = [{ id: '1', name: 'Test' }];
  const commands = [{
    triggerChar: '@',
    items,
    renderLabel: ({ node }) => `@${node.attrs.label}`,
  }];

  render(
    <TextEditor
      value=""
      onChange={() => {}}
      onSubmit={onSubmit}
      commands={commands}
    />
  );

  await userEvent.type(screen.getByRole('textbox'), '@Test');
  await userEvent.keyboard('{Enter}');

  expect(onSubmit).not.toHaveBeenCalled();
});
```

#### Test 5: Enter key without dropdown DOES submit form

```typescript
it('submits form when Enter pressed without dropdown', async () => {
  const onSubmit = jest.fn();

  render(
    <TextEditor
      value="hello world"
      onChange={() => {}}
      onSubmit={onSubmit}
    />
  );

  const editor = screen.getByRole('textbox');
  await userEvent.click(editor);
  await userEvent.keyboard('{Enter}');

  expect(onSubmit).toHaveBeenCalled();
});
```

#### Test 6: Arrow keys navigate dropdown

```typescript
it('navigates dropdown with arrow keys', async () => {
  const items = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
  ];
  const commands = [{
    triggerChar: '@',
    items,
    renderLabel: ({ node }) => `@${node.attrs.label}`,
  }];

  render(<TextEditor value="" onChange={() => {}} commands={commands} />);

  await userEvent.type(screen.getByRole('textbox'), '@');

  // First item should be selected by default
  expect(screen.getByText('Item 1')).toHaveClass('bg-accent');

  // Arrow down should select second item
  await userEvent.keyboard('{ArrowDown}');
  expect(screen.getByText('Item 2')).toHaveClass('bg-accent');

  // Arrow up should go back to first
  await userEvent.keyboard('{ArrowUp}');
  expect(screen.getByText('Item 1')).toHaveClass('bg-accent');
});
```

#### Test 7: Escape closes dropdown

```typescript
it('closes dropdown when Escape is pressed', async () => {
  const items = [{ id: '1', name: 'Item 1' }];
  const commands = [{
    triggerChar: '@',
    items,
    renderLabel: ({ node }) => `@${node.attrs.label}`,
  }];

  render(<TextEditor value="" onChange={() => {}) commands={commands} />);

  await userEvent.type(screen.getByRole('textbox'), '@');
  expect(screen.getByText('Item 1')).toBeInTheDocument();

  await userEvent.keyboard('{Escape}');
  expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
});
```

### Manual Test Checklist

After automated tests pass, manually verify:

- [ ] Type "@" in Tambo message input
- [ ] See dropdown with interactable components
- [ ] Use arrow keys to navigate dropdown
- [ ] Press Enter to select item
- [ ] Verify @ mention appears in input
- [ ] Verify context badge appears above input
- [ ] Try to add same mention again - verify prevented
- [ ] Type message without dropdown, press Enter - verify form submits
- [ ] Type "@comp" to open dropdown, press Enter - verify form does NOT submit
- [ ] Press Shift+Enter - verify newline is inserted
- [ ] Paste image - verify it's added to thread input
- [ ] Test slash commands (if configured)

---

## Implementation Order

1. [x] Write tests first (TDD approach)
2. [x] Fix 1: Simplify ref management
3. [x] Fix 2: Flatten wrapper function
4. [x] Fix 3: Remove setTimeout hack
5. [x] ~~Fix 4: Async consistency~~ (no change needed)
6. [x] Extract useTextEditor hook (separate refactoring)
7. [x] Run all tests to verify behavior preserved
8. [ ] Manual testing checklist
9. [ ] Update documentation/comments if needed

---

## Second Pass - Additional Simplifications

### [ ] Fix 5: Simplify keyboard handler logic in editorProps

**Problem**: The `handleKeyDown` in `editorProps` (use-text-editor.ts:210-227) has duplicated logic for checking menu state and Enter key.

**Current code** (use-text-editor.ts:210-227):

```typescript
handleKeyDown: (view, event) => {
  // Prevent Enter from submitting form when selecting from menu
  if (event.key === "Enter" && !event.shiftKey && menuOpenRef.current) {
    event.preventDefault();
    event.stopPropagation();
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
```

**Analysis**: This handler has special logic to prevent Enter from submitting when menu is open. However, the outer `handleKeyDown` callback (lines 155-176) also checks for Enter. There's potential for simplification by consolidating the logic.

**Status**: Needs investigation - may be necessary due to event flow differences between ProseMirror DOM events and React events.

### [ ] Fix 6: Consolidate interactables ref pattern

**Problem**: The interactables ref pattern (use-text-editor.ts:70-74) uses useEffect to sync, which could potentially be simplified.

**Current code**:

```typescript
const interactablesRef = React.useRef(interactables);
React.useEffect(() => {
  interactablesRef.current = interactables;
}, [interactables]);
```

**Why needed**: The ref is used in `getResourceItems` (line 82) to avoid capturing stale interactables in the closure. This is actually a good pattern to avoid recreating the command config unnecessarily.

**Status**: Keep as-is - this is the correct React pattern for accessing fresh values in callbacks without recreating them.

### [ ] Fix 7: Extract Tambo-specific logic into separate hook

**Problem**: `useTextEditor` mixes generic editor setup with Tambo-specific logic (interactables, context attachments, image paste).

**Proposed**: Create `useTamboCommands` hook to encapsulate:

- Tambo hooks (useTamboContextAttachment, useTamboThreadInput, useCurrentInteractablesSnapshot)
- Tambo command generation
- Image paste handling

**Why better**:

- Makes `useTextEditor` truly generic and reusable
- Separates concerns (generic editor vs Tambo-specific features)
- Easier to test in isolation
- Could use the generic editor elsewhere without Tambo dependencies

**Implementation**:

```typescript
// New hook in use-text-editor.ts or separate file
function useTamboCommands(enabled: boolean): CommandConfig[] {
  const tamboThreadInput = useTamboThreadInput();
  const tamboContextAttachment = useTamboContextAttachment();
  const interactables = useCurrentInteractablesSnapshot();

  // ... rest of Tambo logic

  return enabled ? [tamboCommand] : [];
}

// In useTextEditor
export function useTextEditor({ onSubmit, commands, ...rest }) {
  const tamboCommands = useTamboCommands(!!onSubmit);
  const allCommands = useMemo(
    () => [...(commands ?? []), ...tamboCommands],
    [commands, tamboCommands],
  );
  // ... rest uses allCommands
}
```

### [ ] Fix 8: Simplify className string template

**Problem**: The className template (use-text-editor.ts:208) is a very long string literal that's hard to read.

**Current code**:

```typescript
class: `tiptap prose prose-sm max-w-none focus:outline-none p-3 rounded-t-lg bg-transparent text-sm leading-relaxed min-h-[82px] max-h-[40vh] overflow-y-auto break-words whitespace-pre-wrap ${className ?? ""}`,
```

**Proposed**:

```typescript
class: cn(
  "tiptap prose prose-sm max-w-none focus:outline-none",
  "p-3 rounded-t-lg bg-transparent",
  "text-sm leading-relaxed",
  "min-h-[82px] max-h-[40vh] overflow-y-auto",
  "break-words whitespace-pre-wrap",
  className
),
```

**Why better**: Easier to read, modify, and understand the different categories of styles. Uses the `cn` utility that's already imported in text-editor-shared.tsx.

### [x] Fix 9: IS_PASTED_IMAGE symbol investigation

**Investigation results**: The symbol is defined and set on pasted files (use-text-editor.ts:44, 84) but not checked in this codebase.

**Status**: KEEP AS-IS

- Symbol may be used by external consumers of the File object
- The Symbol.for() pattern allows other modules to access the same symbol
- Provides metadata to distinguish pasted vs uploaded images
- No harm in keeping it, potential value for future features or external integrations
- User confirmed it's likely used elsewhere to distinguish image sources

---

## Notes

- All fixes should preserve existing external behavior
- Tests verify the interface, not implementation
- The refactoring makes code more testable and maintainable
- Breaking changes to the public API are NOT allowed

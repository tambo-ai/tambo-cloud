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

### [ ] Fix 1: Simplify ref management

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

### [ ] Fix 2: Flatten wrapper function

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

### [ ] Fix 3: Remove 100ms setTimeout hack

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

### [ ] Fix 4: Consistent async handling

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

1. [ ] Write tests first (TDD approach)
2. [ ] Fix 1: Simplify ref management
3. [ ] Fix 2: Flatten wrapper function
4. [ ] Fix 3: Remove setTimeout hack
5. [ ] ~~Fix 4: Async consistency~~ (no change needed)
6. [ ] Extract useTextEditor hook (separate refactoring)
7. [ ] Run all tests to verify behavior preserved
8. [ ] Manual testing checklist
9. [ ] Update documentation/comments if needed

---

## Notes

- All fixes should preserve existing external behavior
- Tests verify the interface, not implementation
- The refactoring makes code more testable and maintainable
- Breaking changes to the public API are NOT allowed

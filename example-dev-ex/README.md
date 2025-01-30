# Hydra AI React Example

This example demonstrates how to use the `hydra-ai-react` package to create AI-powered interactive components in a React application.

## Project Structure

```
example-dev-ex/
├── src/
│   ├── components/           # React components
│   │   ├── EmailComponent.tsx    # Email composition component
│   │   ├── MessageThread.tsx     # Main thread UI component
│   │   └── NoteComponent.tsx     # Note taking component
│   ├── config/
│   │   └── hydraConfig.ts        # Hydra initialization config
│   ├── api/
│   │   └── apiTools.ts           # API utility functions
│   ├── schemas/
│   │   ├── componentSchemas.ts   # Zod schemas for components
│   │   └── toolSchemas.ts        # Zod schemas for API tools
│   ├── types/
│   │   └── hydra-ai-react.d.ts   # Type definitions for the package
│   ├── examples/
│   │   └── threadState.example.ts # Example thread state structure
│   ├── HydraProvider.tsx         # Root provider component
│   └── App.tsx                   # Main application component
```

## Big Changes

### 1. Context Provider

Hydra is initialized with a configuration file that defines the components and tools that Hydra can use, including tool associations like before, except now it's provided by a context provider.

```tsx
<HydraProvider>
  <MessageThread />
</HydraProvider>
```

- `hydraConfig.ts`: Configures available components and tools that Hydra can use, including tool associations
- `HydraProvider.tsx`: Root provider that initializes Hydra with your API key and configuration

### 2. Components and Tools Registry

1. Zod is strongly encouraged for schemas, but we also support JSONschemas.
2. Components and tools are decoupled, but can be "associated" with each other.

Components can declare which tools they need access to:

```typescript
const components = {
  EmailComponent: {
    component: EmailComponent,
    propsSchema: EmailPropsSchema,
    associatedTools: ["getContacts", "getCalendar"], // Tools this component can use
  },
  NoteComponent: {
    component: NoteComponent,
    propsSchema: NotePropsSchema,
    associatedTools: [], // No tools needed
  },
};
```

[ ] TODO: Add a tools example.
[ ] TODO: Make sure it handles callbacks to functions.

This association helps Hydra understand which tools to make available to each component.

### 3. Component Generation

1. AI Process Status (`HydraAIProcessStatus`): External AI processing states
2. Streaming State (`HydraStreamingState`): Real-time component updates

- `threadState.example.ts`: Demonstrates the structure of a thread's state, including:
  - AI process status tracking
  - Component streaming states
  - Generated vs interactive props
  - Component lifecycle

### 4. Component State Management

Components in Hydra follow a two-part pattern to separate concerns:

1. **Base Components**:

   - Simple props and callbacks interface
   - Can be used independently of Hydra

2. **Hydra Wrappers**
   - Wrap base components with Hydra state management
   - Handle interactive state updates
   - Connect to Hydra's thread system

See [src/components/NoteComponent.tsx](src/components/NoteComponent.tsx) for a complete implementation example.

See [src/components/EmailComponent.tsx](src/components/EmailComponent.tsx) for state not managed by Hydra. Can still be used with Hydra, but hydra will not know updated state.

- [ ] Can we interanlly generate the wrapper component?
  - {message.map(m => <HydraMessage messageId={m}><MyComponent /></HydraMessage>)}

### 5. Hook Patterns

Hydra provides three patterns for managing thread state and operations, allowing you to choose the right level of abstraction for your needs:

#### Core Hook Pattern

The `useThreadCore` hook provides a centralized way to access all thread operations and state:

```typescript
function ThreadManager() {
  const { operations, state } = useThreadCore();

  return (
    <div>
      <button onClick={() => operations.create()}>New Thread</button>
      {state.threads.map(thread => (
        <div key={thread.id}>
          {thread.title}
          <button onClick={() => operations.send(thread.id, "Hello")}>
            Send Message
          </button>
        </div>
      ))}
    </div>
  );
}
```

#### Individual Hooks Pattern

For granular control and optimal performance, use individual hooks:

```typescript
function MessageSender({ threadId }) {
  const sendMessage = useSendThreadMessage();
  const threads = useThreads();

  // Only re-renders when sendMessage changes
  const handleSend = useCallback(() => {
    sendMessage(threadId, "Hello");
  }, [sendMessage, threadId]);

  return <button onClick={handleSend}>Send</button>;
}
```

#### Specialized Hooks Pattern

For common use cases, specialized hooks provide simplified interfaces:

```typescript
function MessagePanel({ threadId }) {
  const { send, clear, messages } = useThreadMessages(threadId);

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.message}</div>
      ))}
      <button onClick={() => send("Hello")}>Send</button>
      <button onClick={clear}>Clear</button>
    </div>
  );
}
```

#### When to Use Each Pattern

1. **Use Core Hook (`useThreadCore`) when:**

   - Building thread management UIs
   - Needing access to multiple operations
   - Managing global thread state

   ```typescript
   const { operations, state } = useThreadCore();
   ```

2. **Use Individual Hooks when:**

   - Optimizing for performance
   - Implementing specific features
   - Need precise dependency control

   ```typescript
   const sendMessage = useSendThreadMessage();
   const threads = useThreads();
   ```

3. **Use Specialized Hooks when:**
   - Working with a single thread
   - Implementing common patterns
   - Want a simpler API
   ```typescript
   const { send }: ThreadMessages = useThreadMessages(threadId);
   ```

#### Best Practices

1. **Performance Optimization:**

   ```typescript
   // ❌ Avoid using core hook for simple components
   const { operations } = useThreadCore();
   useEffect(() => {
     operations.send(threadId, msg);
   }, [operations, threadId, msg]);

   // ✅ Use individual hooks for better performance
   const sendMessage = useSendThreadMessage();
   useEffect(() => {
     sendMessage(threadId, msg);
   }, [sendMessage, threadId, msg]);
   ```

2. **Component Organization:**

   ```typescript
   // ✅ Use specialized hooks for focused components
   function ThreadMessages({ threadId }) {
     const { messages, send } = useThreadMessages(threadId);
     return <MessageList messages={messages} onSend={send} />;
   }

   // ✅ Use core hook for container components
   function ThreadDashboard() {
     const { operations, state } = useThreadCore();
     return <ThreadList threads={state.threads} onDelete={operations.delete} />;
   }
   ```

3. **Type Safety:**
   ```typescript
   // All patterns provide full type safety
   const { operations }: ThreadCore = useThreadCore();
   const sendMessage: (threadId: string, msg: string) => Promise<void> =
     useSendThreadMessage();
   const { send }: ThreadMessages = useThreadMessages(threadId);
   ```
4. **Thread Management**
   - `useDeleteThread()` - Remove thread completely
   - `useClearThreadMessages()` - Clear messages but keep thread
   - `useArchiveThread()` - Archive thread for later reference

Threads can be created with or without titles:

- No title specified: Defaults to "New Thread", updated by AI after first response
- Custom title specified: Keeps the provided title
- `isAutoTitle: true`: Forces AI to generate a title even if custom title was provided

Example:

```typescript
// Auto-titled thread (starts as "New Thread", AI will update)
const threadId1 = await createThread();
// Fixed title thread
const threadId2 = await createThread("Team Updates");
// Force AI to re-generate title
const threadId3 = await createThread("My Thread", undefined, { isAutoTitle: true });
};
```

## 6. Suggestions

Hydra provides a built-in suggestion system that allows the AI to guide users through multi-step interactions. Each AI response can include suggested next steps that users can easily follow.

### Structure

```typescript
interface HydraSuggestion {
  title: string; // Brief, actionable title to be displayed to the user
  detailedSuggestion: string; // Detailed explanation of the suggestion.
  suggestedTools?: string[]; // Tools that might be helpful
  components?: string[]; // Components that might be relevant
}
```

### Implementation

Suggestions are included in AI responses and can be acted upon in the next message:

```typescript
// AI response includes suggestions
const aiMessage = {
  role: "ai",
  message: "I've created your shopping list.",
  ...
  suggestions: [
    {
      title: "Add Categories",
      detailedSuggestion: "Would you like to organize your list by categories?",
      components: ["NoteComponent"],
    },
  ],
};

// Acting on a suggestion
const { send } = useThreadMessages(threadId);
await send("Yes, let's do that", { suggestion: selectedSuggestion });
```

### Usage Example

```typescript
function ThreadMessage({ message, onSelectSuggestion }) {
  return (
    <div>
      <p>{message.message}</p>

      {message.role === "ai" && (
        <Suggestions
          suggestions={message.suggestions}
          onSelect={onSelectSuggestion}
        />
      )}
    </div>
  );
}

function Thread({ threadId }) {
  const { send, messages } = useThreadMessages(threadId);

  const handleSuggestion = async (suggestion) => {
    await send("Let's try this suggestion", { suggestion });
  };

  return (
    <div>
      {messages.map(msg => (
        <ThreadMessage
          message={msg}
          onSelectSuggestion={handleSuggestion}
        />
      ))}
    </div>
  );
}
```

## 7. System Messages and Prompts

Hydra AI allows you to configure the AI's behavior using system messages and prompts. These can be set during initialization or updated dynamically using hooks.

### Initial Configuration

Configure system messages and prompts in your `hydraConfig.ts`:

```typescript
const systemMessage = `You are a helpful AI assistant focused on productivity and communication.`;

const prompt = `For all tasks:
- Maintain consistent formatting
- Be clear and structured
- Focus on user's needs`;

export const initializeHydra = (): HydraInitConfig => ({
  // ... other config
  systemMessage,
  prompt,
});
```

### Hooks

Three hooks are available for managing system configuration:

#### useUpdateSystemMessage

Updates just the system message:

```typescript
const updateSystemMessage = useUpdateSystemMessage();
await updateSystemMessage("New system message");
```

#### useUpdatePrompt

Updates just the prompt:

```typescript
const updatePrompt = useUpdatePrompt();
await updatePrompt("New prompt");
```

#### useSystemConfig

Comprehensive hook that provides both current values and update functions:

```typescript
const {
  systemMessage, // Current system message
  prompt, // Current prompt
  updateSystemMessage,
  updatePrompt,
} = useSystemConfig();
```

## Future

- memory

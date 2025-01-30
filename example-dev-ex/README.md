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

1. Zod is required for schemas.
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

See `src/components/NoteComponent.tsx` for a complete implementation example.

See `src/components/EmailComponent.tsx` for state not managed by Hydra. Can still be used with Hydra, but hydra will not know updated state.

### 5. Useful Hooks for Thread Management

1. **Thread Creation and Updates**

   - `useCreateThread()` - Create new thread with title and optional context
   - `useUpdateThread()` - Modify thread properties
   - `useSendThreadMessage()` - Add message to thread

2. **Thread Querying**

   - `useThreads()` - Get all threads
   - `useThreadState()` - Get full thread state including messages
   - `useGetThreadsByContext()` - Filter threads by contextId

3. **Thread Management**
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

## TBD

### ??? Something I can't remember but is important

### Memory & State Management

- Memory: Hooks to enable and visualize memory usage
- State persistence and synchronization
- Offline support with conflict resolution
- Optimistic updates for better UX
- Thread state inspection and debugging

### Error Handling & Recovery

- Error boundary patterns and fallbacks
- Retry mechanisms and recovery strategies
- Error logging and monitoring
- Graceful degradation patterns
- Useful tools for error handling and debugging

### Performance Optimization

- Virtualization for long thread lists
- Lazy loading strategies
- Component re-render optimization
- Caching strategies for AI responses
- Memory leak prevention
- Performance profiling utilities

### Developer Experience

- Component debugging tools
- Thread state inspection tools
- Type generation helpers
- Hot reload optimization
- Component playground/storybook

### Security & Validation

- Input sanitization guidelines
- Rate limiting strategies
- Content validation patterns
- Sensitive data handling
- Authentication patterns

### Integration & Extensibility

- Third-party tool integration
- API versioning strategy
- WebSocket support
- Custom tool development
- Middleware system

### Thread Management

- Batch operations
- Advanced search and filtering
- Version control and history
- Templates and presets
- Export/import functionality

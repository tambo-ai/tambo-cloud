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

### 1. Tool and Component Registries

Hydra uses separate registries for tools and components with Zod schemas for type safety.

#### Tool Registry

```typescript
// Define available tools with schemas
export const toolRegistry = createHydraToolRegistry({
  getContacts: {
    description: "Retrieves user contacts list",
    inputSchema: z.object({
      userId: z.string(),
      limit: z.number().optional(),
    }),
  },
});

// Register implementations when ready
toolRegistry.registerTool("getContacts", async (input) => {
  const { userId, limit } = input; // Fully typed
  return fetchContacts(userId, limit);
});
```

#### Component Registry

```typescript
// Components reference tools from the registry
export const componentRegistry = createHydraComponentRegistry<
  typeof toolRegistry.tools
>({
  EmailComponent: {
    component: EmailComponent,
    propsSchema: EmailPropsSchema,
    description: "Email composition component",
    associatedTools: ["getContacts"],
  },
});
```

#### Usage Examples

1. Direct tool usage:

```typescript
function ContactList() {
  const getContacts = useTool("getContacts");
  // Tool inputs are fully typed
  const contacts = await getContacts({ userId: "123" });
}
```

2. Tool registration with context:

```typescript
function AuthToolProvider() {
  const auth = useAuth();

  useEffect(() => {
    if (auth.isReady) {
      toolRegistry.registerTool("getContacts", createAuthenticatedTool(auth));
    }
  }, [auth.isReady]);
}
```

- [src/config/hydraConfig.ts](src/config/hydraConfig.ts) - Configuration setup

### 2. Context Provider

Hydra uses a context-based configuration pattern that consists of two parts:

#### Configuration

First, initialize Hydra with your configuration:

```typescript
// Define tools
export const toolRegistry = createToolRegistry({
  getContacts: {
    description: "Retrieves user contacts list",
    inputSchema: z.object({ userId: z.string(), limit: z.number().optional() }),
  },
});

// Define components
export const componentRegistry = createComponentRegistry<
  typeof toolRegistry.tools
>({
  EmailComponent: {
    component: EmailComponent,
    propsSchema: EmailPropsSchema,
    associatedTools: ["getContacts"],
  },
});

// Define configuration
export const initializeHydra = (): HydraInitConfig => {
  if (!process.env.NEXT_PUBLIC_HYDRA_API_KEY) {
    throw new Error("NEXT_PUBLIC_HYDRA_API_KEY is not set");
  }

  return {
    apiKey: process.env.NEXT_PUBLIC_HYDRA_API_KEY,
    toolRegistry,
    componentRegistry,
    systemMessage: "You are a helpful AI assistant...",
    prompt: "For all tasks, maintain consistent formatting...",
  };
};
```

Example: [src/config/hydraConfig.ts](src/config/hydraConfig.ts)

#### Provider Setup

Then, wrap your application with `HydraProvider` in [src/App.tsx](src/App.tsx):

```tsx
import { HydraProvider } from "hydra-ai-react";
import { initializeHydra } from "./config/hydraConfig";

export const App = (): ReactElement => {
  const hydraInstance = initializeHydra();

  return (
    <HydraProvider hydraInstance={hydraInstance}>
      <MessageThread />
    </HydraProvider>
  );
};
```

This pattern provides:

- Centralized configuration management
- Type-safe initialization
- Access to Hydra's features throughout your app
- Environment-based configuration
- Easy testing and mocking

See the complete implementation in:

- [src/App.tsx](src/App.tsx) - Provider implementation

### 3. Component Generation

1. AI Process Status (`HydraAIProcessStatus`): External AI processing states
2. Streaming State (`HydraStreamingState`): Real-time component updates

- `threadState.example.ts`: Demonstrates the structure of a thread's state, including:
  - AI process status tracking
  - Component streaming states
  - Generated vs interactive props
  - Component lifecycle

### 4. Component State Management

Components in Hydra can be implemented in two ways:

#### Stateful Components (Using Hydra State)

Components can use Hydra's state management through the `useHydraMessage` hook. These components must be wrapped in a `HydraMessageProvider` to access the message's state:

```typescript
import { useHydraMessage } from "hydra-ai-react";
import { type EmailData } from "../schemas/componentSchemas";

export const EmailComponent = (): ReactElement => {
  // React-like state management pattern
  const [message, setMessage] = useHydraMessage<EmailData>();

  const handleToChange = (value: string) => {
    setMessage({
      to: value.split(",").map((s) => s.trim()).filter(Boolean)
    });
  };

  return (
    <div>
      <input
        value={message.subject}
        onChange={(e) => setMessage({ subject: e.target.value })}
      />
      <textarea
        value={message.content}
        onChange={(e) => setMessage({ content: e.target.value })}
      />
      <div>
        <input
          value={message.to.join(", ")}
          onChange={(e) => handleToChange(e.target.value)}
        />
      </div>
    </div>
  );
};

// Usage in MessageThread:
{message.generatedComponent?.component && (
  <div>
    <h4>Generated Component:</h4>
    <HydraMessageProvider messageId={messageId} initialProps={message.generatedComponent.generatedProps}>
      <EmailComponent />
    </HydraMessageProvider>
  </div>
)}
```

#### Stateless Components (Pure Props)

For simpler cases or reusable components, you can use a pure props-based approach. These components don't need the `HydraMessageProvider` since they don't use Hydra's state management:

```typescript
interface NoteProps {
  title: string;
  content: string;
  tags?: string[];
}

export const NoteComponent = ({
  title,
  content,
  tags = [],
}: Readonly<NoteProps>): ReactElement => {
  return (
    <div>
      <input value={title} readOnly />
      <textarea value={content} readOnly />
      <div>
        {tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </div>
  );
};

// Usage in MessageThread - no provider needed:
{message.generatedComponent?.component && (
  <div>
    <h4>Generated Component:</h4>
    <NoteComponent {...message.generatedComponent.generatedProps} />
  </div>
)}
```

#### When to Use Each Pattern

- **Stateful Components**: Use when the component needs to:

  - Maintain interactive state
  - Sync updates with Hydra's thread system
  - Handle complex state management
  - Must be wrapped in `HydraMessageProvider`

- **Stateless Components**: Use when the component:
  - Is purely presentational
  - Needs to be reusable outside Hydra
  - Has simple, immutable data display
  - No provider needed

See [src/components/EmailComponent.tsx](src/components/EmailComponent.tsx) and [src/components/NoteComponent.tsx](src/components/NoteComponent.tsx) for complete implementations.

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
          <button onClick={() => operations.generate(thread.id, "Hello")}>
            Send
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
  const generateMessage = useGenerateThreadMessage();
  const threads = useThreads();

  // Only re-renders when generateMessage changes
  const handleGenerate = useCallback(() => {
    generateMessage(threadId, "Hello");
  }, [generateMessage, threadId]);

  return <button onClick={handleGenerate}>Generate</button>;
}
```

#### Specialized Hooks Pattern

For common use cases, specialized hooks provide simplified interfaces:

```typescript
function MessagePanel({ threadId }) {
  const { generate, clear, messages } = useThreadMessages(threadId);

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.message}</div>
      ))}
      <button onClick={() => generate("Hello")}>Generate</button>
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
   const generateMessage = useGenerateThreadMessage();
   const threads = useThreads();
   ```

3. **Use Specialized Hooks when:**
   - Working with a single thread
   - Implementing common patterns
   - Want a simpler API
   ```typescript
   const { generate }: ThreadMessages = useThreadMessages(threadId);
   ```

#### Best Practices

1. **Performance Optimization:**

   ```typescript
   // ❌ Avoid using core hook for simple components
   const { operations } = useThreadCore();
   useEffect(() => {
     operations.generate(threadId, msg);
   }, [operations, threadId, msg]);

   // ✅ Use individual hooks for better performance
   const generateMessage = useGenerateThreadMessage();
   useEffect(() => {
     generateMessage(threadId, msg);
   }, [generateMessage, threadId, msg]);
   ```

2. **Component Organization:**

   ```typescript
   // ✅ Use specialized hooks for focused components
   function ThreadMessages({ threadId }) {
     const { messages, generate } = useThreadMessages(threadId);
     return <MessageList messages={messages} onGenerate={generate} />;
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
   const generateMessage: (threadId: string, msg: string) => Promise<void> =
     useGenerateThreadMessage();
   const { generate }: ThreadMessages = useThreadMessages(threadId);
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
const { generate } = useThreadMessages(threadId);
await generate("Yes, let's do that", { suggestion: selectedSuggestion });
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
  const { generate, messages } = useThreadMessages(threadId);

  const handleSuggestion = async (suggestion) => {
    await generate("Let's try this suggestion", { suggestion });
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

## 7. AI Personality Configuration

Hydra AI allows you to configure the AI's behavior using a personality configuration. This defines how the AI behaves, communicates, and operates within your application.

### Initial Configuration

Configure the AI's personality in your `hydraConfig.ts`:

The personality configuration has three key fields:

- `role`: Defines the AI's identity, purpose and capabilities
- `style`: Controls how the AI communicates and presents information
- `rules`: Sets boundaries and guidelines for the AI's behavior

```typescript
const personality = {
  role: `You are a friendly personal finance assistant focused on helping users manage their money better. You specialize in budgeting, savings goals, and making financial concepts easy to understand.`,

  style: `You communicate in a friendly and encouraging way, avoiding complex financial jargon. You celebrate user progress and provide gentle suggestions for improvement. When explaining financial concepts, you use real-world examples and analogies.`,

  rules: [
    "Never make specific investment recommendations",
    "Always encourage responsible financial habits",
    "Never request sensitive financial information",
    "Keep suggestions within user's stated budget",
    "Maintain user privacy and data security",
    "Focus on educational guidance over direct advice",
  ],
};

export const initializeHydra = (): HydraInitConfig => ({
  // ... other config
  personality,
});
```

### Hooks

Three hooks are available for managing personality configuration:

#### useUpdatePersonality

Updates the entire personality configuration:

```typescript
const updatePersonality = useUpdatePersonality();
await updatePersonality({
  role: "I am your personal shopping assistant, helping you find the best deals and make smart purchasing decisions.",
  style:
    "I'm enthusiastic and helpful, focusing on your preferences and budget while making shopping fun and stress-free.",
  rules: [
    "I respect your budget limits, never push for purchases, and always prioritize value over price.",
  ],
});
```

#### usePersonalityField

Updates a single personality field:

```typescript
const updateRole = usePersonalityField("role");
await updateRole(
  "I am your fitness journey companion, here to help you achieve your health and wellness goals.",
);
```

#### usePersonality

Comprehensive hook that provides both current values and update functions:

```typescript
const {
  personality, // Current personality config
  updatePersonality, // Update entire config
  updateField, // Update single field
} = usePersonality();
```

## 8. User Profile

Hydra AI supports user profiles to provide context-aware interactions. You can attach user profile information to threads, allowing the AI to personalize its responses based on user characteristics, preferences, or other relevant information.

### Usage

You can provide user profile information when creating a thread:

```typescript
// Create a thread with user profile
const threadId = await createThread("Fitness Plan", undefined, {
  userProfile:
    "Name: Michael Magan, Age: 32, Hobbies: Skiing, Company: Hydra AI",
});
```

You can also update the user profile for an existing thread:

```typescript
const updateThread = useUpdateThread();
await updateThread(threadId, {
  userProfile: "Name: Michael Magan, Role: Developer, Interests: AI, Skiing",
});
```

### Implementation Example

```typescript
function PersonalizedThread() {
  const createThread = useCreateThread();
  const { generate, messages } = useThreadMessages(threadId);

  const startNewThread = async () => {
    const threadId = await createThread("Personal Assistant", undefined, {
      userProfile: "Name: Michael, Preferences: Morning person, Diet: Vegetarian"
    });

    // The AI will now have context about the user's preferences
    await generate("Can you help me plan my day?");
  };

  return (
    <div>
      <button onClick={startNewThread}>Start New Thread</button>
      {/* Thread messages */}
    </div>
  );
}
```

## 9. Stored Profiles

Hydra AI provides a profile storage system that allows you to persistently store and manage user profiles. This is useful for maintaining consistent user context across different threads and sessions.

### Profile Hooks

#### useProfile

For managing a single user's profile:

```typescript
function UserProfileManager({ userId }: { userId: string }) {
  const {
    profile,
    isLoading,
    error,
    updateProfile,
    deleteProfile
  } = useProfile(userId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {profile ? (
        <>
          <pre>{profile.profile}</pre>
          <button onClick={() => updateProfile("Updated profile info...")}>
            Update Profile
          </button>
          <button onClick={deleteProfile}>Delete Profile</button>
        </>
      ) : (
        <button onClick={() => updateProfile("Initial profile info...")}>
          Create Profile
        </button>
      )}
    </div>
  );
}
```

#### useProfiles

For managing multiple profiles:

```typescript
function ProfilesList() {
  const { profiles, isLoading, error, refresh } = useProfiles();

  if (isLoading) return <div>Loading profiles...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Refresh Profiles</button>
      {profiles.map(profile => (
        <div key={profile.userId}>
          <h3>User: {profile.userId}</h3>
          <pre>{profile.profile}</pre>
          <small>Last updated: {profile.updatedAt}</small>
        </div>
      ))}
    </div>
  );
}
```

#### useProfileOperations

For direct access to profile operations:

```typescript
function ProfileOperationsExample() {
  const {
    getProfile,
    updateProfile,
    deleteProfile,
    listProfiles
  } = useProfileOperations();

  const handleBulkOperation = async () => {
    // Get a specific profile
    const profile = await getProfile("user123");

    // Update multiple profiles
    await Promise.all([
      updateProfile("user1", "Profile 1"),
      updateProfile("user2", "Profile 2")
    ]);

    // List all profiles
    const allProfiles = await listProfiles();
    console.log(allProfiles);
  };

  return <button onClick={handleBulkOperation}>Perform Operations</button>;
}
```

### Integration with Threads

You can easily use stored profiles when creating new threads:

```typescript
function ThreadWithStoredProfile({ userId }: { userId: string }) {
  const { profile } = useProfile(userId);
  const createThread = useCreateThread();
  const { generate } = useThreadMessages(threadId);

  const startNewThread = async () => {
    if (!profile) return;

    const threadId = await createThread(
      "Personal Assistant",
      undefined,
      { userProfile: profile.profile }
    );

    await generate("Hello! Please help me with my tasks.");
  };

  return (
    <button
      onClick={startNewThread}
      disabled={!profile}
    >
      Start Thread with Profile
    </button>
  );
}
```

### 2. Message State Management

Hydra provides two main patterns for message handling:

#### Chat-Like Interface

The simplest way to handle messages is using the chat-like interface:

```typescript
function ChatThread({ threadId }: { threadId: string }) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    isStreaming,
    abort,
    clear
  } = useHydraThreadMessages(threadId);

  const handleSend = async () => {
    try {
      await handleSubmit(input, {
        stream: true,
        onProgress: (partial) => {
          console.log('Streaming:', partial);
        },
        onFinish: (message) => {
          console.log('Complete:', message);
        }
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      {messages.map(msg => <Message key={msg.id} message={msg} />)}
      <form onSubmit={handleSend}>
        <input
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
        {isStreaming && (
          <button onClick={abort}>Stop</button>
        )}
      </form>
    </div>
  );
}
```

#### Component State Management

For more complex interactive components:

```typescript
function EmailComponent() {
  const [message, setMessage] = useHydraMessage<EmailData>();

  return (
    <input
      value={message.subject}
      onChange={(e) => setMessage({ subject: e.target.value })}
    />
  );
}

// Wrapping with message provider
<HydraMessageProvider messageId={messageId} initialProps={initialData}>
  <EmailComponent />
</HydraMessageProvider>
```

### 3. Message Options

When sending messages, you can configure various options:

```typescript
interface ThreadMessageOptions {
  // Enable/disable streaming responses
  stream?: boolean;
  // Cancel ongoing generations
  abortSignal?: AbortSignal;
  // Streaming progress updates
  onProgress?: (message: Partial<HydraThreadMessage>) => void;
  // Error handling
  onError?: (error: Error) => void;
  // Completion callback
  onFinish?: (message: HydraThreadMessage) => void;
}

// Usage
const { handleSubmit } = useHydraThreadMessages(threadId);

await handleSubmit("Hello", {
  stream: true,
  temperature: 0.7,
  onProgress: (partial) => console.log("Streaming:", partial),
  onFinish: (message) => console.log("Complete:", message),
});
```

### 4. Thread Management

Hydra provides comprehensive thread management capabilities:

```typescript
// Core thread operations
const { operations, state } = useHydraThreadCore();

// Individual hooks for granular control
const threads = useHydraThreads();
const createThread = useHydraCreateThread();
const deleteThread = useHydraDeleteThread();
const updateThread = useHydraUpdateThread();
const generateMessage = useHydraGenerateThreadMessage();

// Specialized hooks for common patterns
const { messages, generate, clear } = useHydraThreadMessages(threadId);
const { component, props, updateProps } = useHydraThreadComponent(messageId);
```

### 5. Suggestion System

Hydra includes a built-in suggestion system:

```typescript
// Using suggestions in a thread
const { suggestions, accept, dismiss } = useThreadSuggestions(threadId);

// Suggestion structure
interface HydraSuggestion {
  title: string;
  detailedSuggestion: string;
  suggestedTools?: string[];
  components?: string[];
}
```

### 6. Personality Configuration

Configure AI behavior with personality settings:

```typescript
// Using personality hooks
const { personality, updatePersonality, updateField } = usePersonality();

// Update specific aspects
const updateRole = usePersonalityField("role");
await updateRole("I am a helpful coding assistant");

// Full personality structure
interface HydraPersonality {
  role: string;
  style: string;
  rules: string[];
}
```

### 7. Profile Management

Manage user profiles for personalized interactions:

```typescript
// Profile hooks
const { profile, updateProfile, deleteProfile } = useHydraProfile(userId);
const { profiles, refresh } = useHydraProfiles();

// Profile operations
const operations = useHydraProfileOperations();
const profile = await operations.getProfile(userId);
```

### 8. System Configuration

Manage system-wide settings:

```typescript
const { systemMessage, prompt, updateSystemMessage, updatePrompt } =
  useHydraSystemConfig();

// Context management
const context = useHydraContext();
if (context) {
  await context.updateSystemMessage("New system message");
  await context.updatePrompt("New prompt");
  await context.updatePersonality(newPersonality);
}
```

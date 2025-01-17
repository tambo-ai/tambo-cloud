# ChatContext Documentation

## Overview

The `ChatContext` provides a centralized state management system for handling chat interactions, AI responses, and data visualization components in the application. It uses React's Context API to make chat functionality available throughout the component tree.

## Table of Contents

- [Core Components](#core-components)
- [State Management](#state-management)
- [Types and Interfaces](#types-and-interfaces)
- [Key Functions](#key-functions)
- [Integration with External Services](#integration-with-external-services)
- [Usage Examples](#usage-examples)

## Core Components

### ChatContext

```typescript
const ChatContext = createContext<ChatContextType | undefined>(undefined);
```

The base context object that holds all chat-related state and functions.

### ChatProvider

```typescript
export function ChatProvider({ children }: { children: React.ReactNode });
```

A wrapper component that provides chat functionality to all child components.

### useChatContext Hook

```typescript
export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};
```

A custom hook for accessing chat context values in components.

## State Management

### Core State Variables

- `messages`: Array of chat messages
- `input`: Current input field value
- `isLoading`: Loading state indicator

### Message Structure

```typescript
interface ChatMessageProps {
  id: string;
  role: "user" | "ai";
  content: string;
  graph?: CanvasComponentType;
}
```

## Key Functions

### Input Handling

#### handleInputChange

```typescript
handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
```

Updates the input field value as the user types.

#### handleKeyDown

```typescript
handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
```

Handles keyboard shortcuts (Cmd/Ctrl + Enter) for message submission.

#### handleSubmit

```typescript
handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
```

Processes form submission:

1. Creates a user message
2. Sends request to Hydra AI
3. Handles AI response
4. Updates message list
5. Manages error states

### Utility Functions

#### handleSuggestionClick

```typescript
handleSuggestionClick: (suggestion: string) => void
```

Populates the input field with suggested messages.

#### addAnalyticsMessage

```typescript
addAnalyticsMessage: () => void
```

Adds example analytics messages with visualization components.

#### createExampleGraph

```typescript
createExampleGraph: (id: string) => CanvasComponentType;
```

Generates example visualization components for demonstration purposes.

## Integration with External Services

### Hydra AI Integration

The context integrates with the Hydra AI service for:

- Message generation
- Component creation
- Data visualization

### Message Format for Hydra

```typescript
interface ChatMessage {
  sender: "user" | "hydra";
  message: string;
}
```

## Usage Examples

### Basic Usage

```typescript
function ChatComponent() {
  const { messages, input, handleSubmit, isLoading } = useChatContext();

  return (
    <form onSubmit={handleSubmit}>
      {/* Component implementation */}
    </form>
  );
}
```

### Accessing Messages

```typescript
function MessageList() {
  const { messages } = useChatContext();

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>
          {message.content}
          {message.graph && <VisualizationComponent {...message.graph} />}
        </div>
      ))}
    </div>
  );
}
```

### Handling Input

```typescript
function ChatInput() {
  const {
    input,
    handleInputChange,
    handleKeyDown,
    isLoading
  } = useChatContext();

  return (
    <input
      value={input}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      disabled={isLoading}
    />
  );
}
```

## Best Practices

1. Always use the `useChatContext` hook within components wrapped by `ChatProvider`
2. Handle loading states appropriately to provide good UX
3. Implement error handling for failed API calls
4. Consider message persistence if needed
5. Monitor performance with large message lists

## Error Handling

The context includes built-in error handling for:

- API call failures
- Context usage outside provider
- Invalid message formats

## Performance Considerations

1. Message List Management

   - Consider pagination for long chat histories
   - Implement virtualization for large message lists

2. State Updates

   - Uses optimized state updates with functional updates
   - Batches related state changes

3. API Calls
   - Implements loading states
   - Handles errors gracefully
   - Provides feedback to users

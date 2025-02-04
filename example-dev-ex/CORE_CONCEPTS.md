# Hydra AI Core Concepts

Hydra allows developers to build AI-powered applications with ease. Developers just register their data, tools, and components and Hydra translates users' natural language requests into UI components that solve their problems.

## Use Hydra to build an AI-powered data analysis assistant

Below is a quick guide to building an AI-powered data analysis assistant using Hydra AI React. This is a chat example, but Hydra can be used **anywhere you want to support your user natural language requests.**

- Data analysis
- Settings/Configuration
- CRM
- etc.

**Why not generate the UI components directly?** We've tried that and its really hard to get a predictable, consistent experience, manage state, and fix bugs. This approach gives you control over the UI components, behavior, and experience of using the app while still using AI to power it. Feel differently? [Let us know](mailto:magan@usehydra.ai)

## 1. Basic Message Thread

The foundation of any Hydra AI application is the message thread. Think of it like a chat interface, but designed to do more than just show text.

### 1.1 Add Context Provider to Your App

What's happening here?

- `HydraProvider` - Provides the Hydra context to your app
- `HydraPersonality` - Configures AI behavior and communication style

```tsx
// src/config/hydraConfig.ts
import {
  createHydraComponentRegistry,
  createHydraToolRegistry,
  type HydraInitConfig,
  type HydraPersonality,
} from "hydra-ai-react";

// Define personality
const personality: HydraPersonality = {
  role: `You are a friendly personal finance assistant focused on helping users manage their money better. You specialize in budgeting, savings goals, and making financial concepts easy to understand.`,

  style: `You communicate in a friendly and encouraging way, avoiding complex financial jargon. You celebrate user progress and provide gentle suggestions for improvement.`,

  rules: [
    "Never make specific investment recommendations",
    "Always encourage responsible financial habits",
    "Keep suggestions within user's stated budget",
    "Focus on educational guidance over direct advice",
  ],
};

// Define registries
export const toolRegistry = createHydraToolRegistry({
  // Tool definitions here
});

export const componentRegistry = createHydraComponentRegistry({
  // Component definitions here
});

export const initializeHydra = (): HydraInitConfig => {
  if (!process.env.NEXT_PUBLIC_HYDRA_API_KEY) {
    throw new Error("NEXT_PUBLIC_HYDRA_API_KEY is not set");
  }

  return {
    apiKey: process.env.NEXT_PUBLIC_HYDRA_API_KEY,
    toolRegistry,
    componentRegistry,
    personality,
  };
};

// src/App.tsx
import { HydraProvider } from "hydra-ai-react";
import { type ReactElement } from "react";
import { MessageThread } from "./components/MessageThread";
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

The personality configuration provides three main ways to control Hydra's behavior:

- `role`: Defines the AI's expertise and purpose
- `style`: Controls communication tone and approach
- `rules`: Sets specific guidelines for behavior

### 1.2 Messages with Threads

What's happening here?

- `useHydraThreadMessages` - Provides chat-like interface for message handling
- `messages` - Array of all messages in thread with components
- `handleSubmit` - Sends message to AI with streaming support
- `HydraThreadMessage` - Type with content, components, and status

```tsx
import {
  useHydraThreadMessages,
  type HydraThreadMessage,
} from "hydra-ai-react";

export const MessageThread = () => {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    isStreaming,
    abort,
    clear,
  } = useHydraThreadMessages("my-thread");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    try {
      await handleSubmit(input, {
        stream: true,
        onProgress: (partial) => {
          console.log("Streaming progress:", partial);
        },
        onFinish: (message) => {
          console.log("Complete:", message);
        },
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="thread">
      {/* Messages */}
      <div className="messages">
        {messages.map((message: HydraThreadMessage) => (
          <div key={message.id} className={`message ${message.type}`}>
            {/* Message content */}
            <div className="content">{message.content}</div>

            {/* Status updates */}
            {message.status?.map((status, i) => (
              <div key={i} className="status">
                <strong>{status.state}:</strong> {status.message}
              </div>
            ))}

            {/* Generated components */}
            {message.interactiveComponent && (
              <message.interactiveComponent.component
                {...message.interactiveComponent.generatedProps}
              />
            )}
          </div>
        ))}
        {isLoading && <div className="loading">Loading...</div>}
      </div>

      {/* Input */}
      <form onSubmit={handleSend}>
        <input
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send"}
        </button>
        {isStreaming && (
          <button type="button" onClick={abort}>
            Stop
          </button>
        )}
      </form>
    </div>
  );
};
```

The thread now provides:

- Controlled input management
- Loading and streaming states
- Progress tracking
- Error handling
- Abort functionality

### 1.3 Message Options

You can configure how messages are handled using options:

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

// Usage example
await handleSubmit(message, {
  stream: true,
  onProgress: (partial) => {
    console.log("Streaming:", partial);
  },
  onFinish: (message) => {
    console.log("Complete:", message);
  },
});
```

Ok now you have a chat interface that you can use to talk to Hydra, but hydra has no access to your data or ui components, yet. Let's add that next.

## 2. Adding Tools and Components

Let's add a tool to fetch time series data from an API.

### 2.1 Adding a Component

What's happening here?

- `ChartSchema` - Defines the props interface for the chart using Zod
- `componentRegistry.Chart` - Registers a component that:
  1. Accepts data and type props matching the schema
  2. Uses associatedTools to fetch required data
  3. Can be rendered by Hydra when visualization is needed

```tsx
// src/config/hydraConfig.ts
import { z } from "zod";
import type { HydraComponentDefinition } from "hydra-ai-react";

// Define what data our chart expects
const ChartSchema = z.object({
  data: z.array(
    z.object({
      date: z.string(),
      value: z.number(),
    }),
  ),
  type: z.enum(["line", "bar"]),
});

// Register chart component with proper typing
export const componentRegistry = createHydraComponentRegistry<
  typeof toolRegistry.tools
>({
  Chart: {
    component: ChartView,
    propsSchema: ChartSchema,
    description: "Interactive chart for visualizing time series data",
    associatedTools: ["fetchTimeSeries"] as const,
  } satisfies HydraComponentDefinition<typeof toolRegistry.tools>,
});
```

### 2.2 Data Tool Setup

What's happening here?

- `TimeSeriesSchema` - Defines the shape of data returned by the tool
- `toolRegistry.fetchTimeSeries` - Registers a tool that:
  1. Takes metric, timeRange, and interval as input
  2. Returns time series data
  3. Can be called by Hydra when users request data

```tsx
// src/config/hydraConfig.ts
import { z } from "zod";
import type { HydraToolDefinition } from "hydra-ai-react";

const TimeSeriesInputSchema = z.object({
  metric: z.string(),
  timeRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
  interval: z.enum(["1h", "1d", "1w", "1m"]),
});

// Register data fetching tool with proper typing
export const toolRegistry = createHydraToolRegistry({
  fetchTimeSeries: {
    description: "Fetch time series data for analysis",
    inputSchema: TimeSeriesInputSchema,
  } satisfies HydraToolDefinition<typeof TimeSeriesInputSchema>,
});

// Implementation of the tool
toolRegistry.registerTool("fetchTimeSeries", async (input) => {
  // Type-safe input thanks to Zod schema
  const { metric, timeRange, interval } = input;
  // Fetch and return data
  return fetchTimeSeriesData({ metric, timeRange, interval });
});
```

### 2.3 Chart Component

What's happening here?

- Component receives props directly from Hydra
- No internal state management
- Pure presentational component

```tsx
// src/components/ChartView.tsx
import { LineChart, BarChart, Line, Bar, XAxis, YAxis } from "recharts";
import type { z } from "zod";
import type { ChartSchema } from "../config/hydra";

type ChartProps = z.infer<typeof ChartSchema>;

export const ChartView = ({ data, type }: Readonly<ChartProps>) => {
  // Pick chart based on type
  const Chart = type === "line" ? LineChart : BarChart;
  const DataElement = type === "line" ? Line : Bar;

  return (
    <Chart data={data} width={400} height={300}>
      <XAxis dataKey="date" />
      <YAxis />
      <DataElement dataKey="value" />
    </Chart>
  );
};
```

Now Hydra has 1 component and 1 tool in its registries. The chart component is stateless and receives its props directly from the thread. Hydra will not know if the user interacts with the chart component, so we need to add state management to the thread.

## 3. State Management

Now the user may want to edit the chart configuration to visualize the data in a different way. We want to update hydra state to reflect the new chart configuration.

#### Benefits

1. State is managed by Hydra (woo hoo)
2. State is automatically saved to the message thread
3. State is automatically passed to hydra upon future message generation

To acomplish this you need:

1. `useHydraMessageState` hook to manage state
2. `HydraMessageProvider` to pass state to the component

Here's how to wrap the message with context and manage state:

```tsx
// MessageThread.tsx - Where messages are rendered
import { HydraMessageProvider } from "hydra-ai-react";
import type { HydraThreadMessage } from "hydra-ai-react";

export const MessageThread = () => {
  return (
    <div className="message-thread">
      {messages.map((message: HydraThreadMessage) => (
        <div key={message.id} className="message">
          {/* Text content */}
          <div className="content">{message.content}</div>

          {/* Generated components (can be Chart, Table, Form etc) */}
          {message.generatedComponents?.map((component, index) => (
            <HydraMessageProvider
              key={`${message.id}-${index}`}
              messageId={message.id}
              initialProps={component.initialProps}
            >
              <component.Component />
            </HydraMessageProvider>
          ))}
        </div>
      ))}
    </div>
  );
};

// ChartView.tsx - Example of one component type with state management
import { useHydraMessageState } from "hydra-ai-react";

export const ChartView = ({ messageId }: { messageId: string }) => {
  const { state, setState } = useHydraMessageState<ChartProps>(messageId);
  const { data, type } = state;

  const toggleChartType = () => {
    setState({ type: type === "line" ? "bar" : "line" });
  };

  return (
    <div>
      <button onClick={toggleChartType}>Toggle Chart Type</button>
      <Chart data={data} type={type} />
    </div>
  );
};
```

This pattern ensures that component state is properly managed and preserved within the message thread context, regardless of how many or what type of components Hydra generates.

## 4. Hydra Status

What do we show the user when the AI is processing their request, calling tools, or generating a component?

Hydra provides real-time status updates during AI processing through the `HydraAIProcessStatus` and `HydraStreamingState` interfaces. This allows you to show users what the AI is doing at each step.

### Implementation

```tsx
// MessageThread.tsx - Showing AI process status
function MessageThread() {
  return (
    <div className="message-thread">
      {messages.map((message: HydraThreadMessage) => (
        <div key={message.id} className="message">
          {/* Message content */}
          <div className="content">{message.content}</div>

          {/* AI Process Status */}
          {message.status?.map((status, index) => (
            <div key={index} className="status">
              {status.message}
            </div>
          ))}
          {/* messages! */}
        </div>
      ))}
    </div>
  );
}

// Example status flow:
const exampleMessage = {
  ...
  status: [
    {
      state: "evaluating",
      message: "Analyzing your request for time series visualization",
    },
    {
      state: "tools",
      message: "Fetching time series data for the last 7 days",
    },
    {
      state: "generating",
      message: "Creating chart visualization",
    },
  ],
  ...
};
```

The status system provides three types of updates:

- `evaluating`: AI is thinking/analyzing
- `tools`: AI is using tools
- `generating`: AI is creating content

## 5. Thread Management

Hydra provides thread management through three main patterns:

```tsx
// 1. Core Pattern - Full thread management
function ThreadManager() {
  const { operations, state } = useHydraThreadCore();

  return (
    <div>
      <button onClick={() => operations.create()}>New Thread</button>
      {state.threads.map((thread) => (
        <div key={thread.id}>
          <h3>{thread.title}</h3>
          <button onClick={() => operations.archive(thread.id)}>Archive</button>
        </div>
      ))}
    </div>
  );
}

// 2. Single Thread Pattern - Focus on one conversation
function ThreadView({ threadId }: { threadId: string }) {
  const { messages, generate } = useHydraThreadMessages(threadId);

  return (
    <div>
      {messages.map((message: HydraThreadMessage) => (
        <div key={message.id}>
          <div>{message.content}</div>
          {message.status?.map((status, index) => (
            <div key={index}>{status.message}</div>
          ))}
          {message.generatedComponent && (
            <message.generatedComponent.component
              {...message.generatedComponent.generatedProps}
            />
          )}
        </div>
      ))}
      <button onClick={() => generate("Analyze this data")}>Send</button>
    </div>
  );
}

// 3. Context Pattern - Group related threads
function AnalysisThreads() {
  const { state } = useHydraThreadCore();
  const threads = state.getByContext("data-analysis");

  return (
    <div>
      {threads.map((thread) => (
        <ThreadView key={thread.id} threadId={thread.id} />
      ))}
    </div>
  );
}
```

Key Features:

1. **Operations**: create, delete, archive, clear messages
2. **Properties**: title, contextId, userProfile
3. **Organization**: Group threads by context for different use cases
4. **State**: Maintains conversation history and component states

Best Practice: Use `contextId` to organize threads and `userProfile` for personalization.

### 7. Streaming Components

Coming soon!

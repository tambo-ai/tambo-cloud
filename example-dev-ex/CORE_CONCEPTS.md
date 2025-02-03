# Hydra AI Core Concepts

Hydra allows developers to build AI-powered applications with ease. Developers just register their data, tools, and components and Hydra translates users' natural language requests into UI components that solve their problems.

## Flow:

User Message/Context --> Hydra --> UI Components

## Core Registries

Hydra uses two main registries to manage your application's capabilities:

### Tool Registry

- Contains functions that Hydra can call (e.g., API calls, data fetching)
- Each tool must have:
  - Description: What the tool does
  - InputSchema: Expected parameters (using Zod)
  - Implementation: The actual function

### Component Registry

- Contains UI components Hydra can render
- Each component must have:
  - Component: The React component
  - PropsSchema: Expected props (using Zod)
  - AssociatedTools: Tools that help generate component props

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

```tsx
// src/config/hydra.ts
import {
  createHydraToolRegistry,
  createHydraComponentRegistry,
} from "hydra-ai-react";

// Start with empty registries - we'll add more later
export const toolRegistry = createHydraToolRegistry({});
export const componentRegistry = createHydraComponentRegistry({});

// src/App.tsx
import { HydraProvider } from "hydra-ai-react";
import { toolRegistry, componentRegistry } from "./config/hydra";
import { MessageThread } from "./components/MessageThread";

export const App = () => (
  <HydraProvider
    hydraInstance={{
      apiKey: process.env.NEXT_PUBLIC_HYDRA_API_KEY,
      toolRegistry,
      componentRegistry,
    }}
  >
    <MessageThread />
  </HydraProvider>
);
```

### 1.2 Messages with Threads

What's happening here?

- `useHydraThreadMessages` - Creates/manages message thread
- `messages` - Array of all messages in thread with components
- `generate` - Sends message to AI and gets response
- `HydraThreadMessage` - Type with content, components, and status

```tsx
import {
  useHydraThreadMessages,
  type HydraThreadMessage,
} from "hydra-ai-react";
import { useState } from "react";

export const MessageThread = () => {
  const { messages, generate } = useHydraThreadMessages("my-thread");
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;
    await generate(input);
    setInput("");
  };

  return (
    <div className="thread">
      {/* Messages */}
      <div className="messages">
        {messages.map((message: HydraThreadMessage) => (
          <div key={message.id} className={`message ${message.type}`}>
            {/* Message content */}
            <div className="content">{message.content}</div>

            {/* Generated components */}
            {/* Right now there are no components in the registry, so this will be 
            always undefined */}
            {message.interactiveComponent && (
              <message.interactiveComponent.component
                {...message.interactiveComponent.generatedProps}
              />
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};
```

Ok now you have a chat interface that you can use to talk to Hydra, but hydra has no access to your data or ui components, yet. Let's add that next.

## 2. Adding Tools and Components

Let's add a tool to fetch time series data from an API.

### 2.1 Data Tool Setup

What's happening here?

- `TimeSeriesSchema` - Defines the shape of data returned by the tool
- `toolRegistry.fetchTimeSeries` - Registers a tool that:
  1. Takes metric, timeRange, and interval as input
  2. Returns time series data
  3. Can be called by Hydra when users request data

```tsx
// src/config/hydra.ts
import { z } from "zod";

// Register data fetching tool
export const toolRegistry = createHydraToolRegistry({
  fetchTimeSeries: {
    description: "Fetch time series data for analysis",
    inputSchema: z.object({
      metric: z.string(),
      timeRange: z.object({
        start: z.string(),
        end: z.string(),
      }),
      interval: z.enum(["1h", "1d", "1w", "1m"]),
    }),
  },
});

// Mock API function (replace with your actual API)
const fetchTimeSeriesData = async (args: {
  metric: string;
  timeRange: { start: string; end: string };
  interval: string;
}) => {
  // fetch data from a database
};
```

### 2.2 Adding a Component

What's happening here?

- `ChartSchema` - Defines the props interface for the chart
- `componentRegistry.Chart` - Registers a component that:
  1. Accepts data and type props matching the schema
  2. Uses associatedTools to fetch required data
  3. Can be rendered by Hydra when visualization is needed

```tsx
// src/config/hydra.ts
import { z } from "zod";

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

// Register chart component
export const componentRegistry = createHydraComponentRegistry({
  Chart: {
    component: ChartView,
    propsSchema: ChartSchema,
    associatedTools: ["analyzeData"],
  },
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

## 5. Customize Hydra Behavior

Hydra allows you to customize its behavior through personality configuration and system messages. This helps tailor the AI's responses to your application's needs.

This is similar to how you might add system prompts to an LLM.

### Implementation

```tsx
// src/config/hydra.ts
import { type HydraInitConfig, type HydraPersonality } from "hydra-ai-react";

// Define the AI's personality
const personality: HydraPersonality = {
  role: "You are a data visualization expert focused on helping users understand their metrics.",
  style:
    "Professional but approachable. Use clear explanations and suggest data insights.",
  rules: [
    "Always explain chart patterns",
    "Suggest relevant metrics to compare",
    "Use appropriate chart types for data",
    "Highlight unusual data points",
  ],
};

// Initialize Hydra with custom behavior
export const initializeHydra = (): HydraInitConfig => ({
  ...personality,
});
```

The customization system provides three main ways to control Hydra's behavior:

### Personality Configuration

- `role`: Defines the AI's expertise and purpose
- `style`: Controls communication tone and approach
- `rules`: Sets specific guidelines for behavior

## 6. Thread Management

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

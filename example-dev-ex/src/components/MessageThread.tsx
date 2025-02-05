import {
  useHydraContext,
  useHydraThread,
  type HydraComponent,
  type HydraComponentInjectedProps,
  type HydraSuggestion,
  type HydraThread,
  type HydraThreadMessage,
} from "hydra-ai-react";
import { useState, type ReactElement } from "react";

// Suggestion component
const Suggestions = ({
  suggestions,
  onSelect,
}: {
  suggestions?: HydraSuggestion[];
  onSelect: (suggestion: HydraSuggestion) => void;
}): ReactElement | null => {
  if (!suggestions?.length) return null;

  return (
    <div>
      <h4>Suggested Next Steps:</h4>
      <div>
        {suggestions.map((suggestion, index) => (
          <div key={index}>
            <h5>{suggestion.title}</h5>
            <p>{suggestion.detailedSuggestion}</p>
            <button onClick={() => onSelect(suggestion)}>Try This</button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Message component with suggestions
const ThreadMessage = ({
  message,
  messageId,
  threadId,
  onSelectSuggestion,
}: {
  message: HydraThreadMessage;
  messageId: string;
  threadId: string;
  onSelectSuggestion: (suggestion: HydraSuggestion) => void;
}): ReactElement => {
  const renderComponent = (component: {
    type: string;
    Component: React.ComponentType<any>;
    props: Record<string, unknown>;
    state?: Record<string, unknown>;
  }) => {
    const Component = component.Component;
    const injectedProps: HydraComponentInjectedProps = {
      syncProp: <T,>(
        propName: keyof T,
        value: T[keyof T],
        metadata?: Record<string, unknown>,
      ) => {
        console.log("Syncing prop:", propName, value, metadata);
      },
      threadId,
      messageId,
    };

    // Create a properly typed HydraComponent
    const hydraComponent: HydraComponent = {
      type: component.type,
      Component: component.Component,
      props: {
        ...component.props,
        ...injectedProps,
      },
    };

    return <Component {...hydraComponent.props} />;
  };

  return (
    <div>
      <p>
        <strong>{message.type === "user" ? "User" : "AI"}:</strong>{" "}
        {message.content}
      </p>
      {message.status?.map((status, i) => (
        <p key={i}>
          <strong>{status.state}:</strong> {status.message}
        </p>
      ))}
      {message.streamState && (
        <div>
          <p>
            <strong>Streaming Status:</strong>
          </p>
          {Object.entries(message.streamState).map(([key, value]) => (
            <p key={key}>
              {key}: {value.isStreaming ? "Streaming" : "Complete"}
              {value.progress && ` (${Math.round(value.progress * 100)}%)`}
              {value.error && <span className="error">{value.error}</span>}
            </p>
          ))}
        </div>
      )}
      {message.component && <div>{renderComponent(message.component)}</div>}
      {message.type === "hydra" && (
        <Suggestions
          suggestions={message.suggestions}
          onSelect={onSelectSuggestion}
        />
      )}
    </div>
  );
};

// Updated Thread component using new hooks
const Thread = ({ thread }: { thread: HydraThread }): ReactElement => {
  const { messages, operations } = useHydraThread(thread.id);
  const { messages: messageManager } = useHydraContext();
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<HydraSuggestion>();
  const [input, setInput] = useState("");

  const handleSend = async (message: string) => {
    try {
      await messageManager.generate(thread.id, message, {
        stream: true,
        onProgress: (partial) => {
          console.log("Streaming progress:", partial);
        },
        onFinish: () => {
          setSelectedSuggestion(undefined);
          setInput("");
        },
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleSuggestionSelect = (suggestion: HydraSuggestion) => {
    setSelectedSuggestion(suggestion);
  };

  return (
    <div>
      <div>
        <h2>{thread.title}</h2>
        <button onClick={() => operations.delete(thread.id)}>
          Clear Messages
        </button>
        {messageManager.status.isStreaming && (
          <button
            onClick={() => operations.delete(thread.id)}
            title="Stop generating"
          >
            Stop
          </button>
        )}
      </div>
      <div>
        {messages.map((msg, index) => (
          <ThreadMessage
            key={index}
            message={msg}
            messageId={`${thread.id}-${index}`}
            threadId={thread.id}
            onSelectSuggestion={handleSuggestionSelect}
          />
        ))}
        {messageManager.status.isLoading && <div>Loading...</div>}
      </div>
      <ThreadInput
        input={input}
        onInputChange={setInput}
        onSubmit={handleSend}
        selectedSuggestion={selectedSuggestion}
        onCancelSuggestion={() => setSelectedSuggestion(undefined)}
        isLoading={messageManager.status.isLoading}
      />
    </div>
  );
};

// Updated input component with controlled input
const ThreadInput = ({
  input,
  onInputChange,
  onSubmit,
  selectedSuggestion,
  onCancelSuggestion,
  isLoading,
}: {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (message: string) => Promise<void>;
  selectedSuggestion?: HydraSuggestion;
  onCancelSuggestion: () => void;
  isLoading: boolean;
}): ReactElement => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    await onSubmit(input);
    onInputChange("");
  };

  return (
    <div>
      {selectedSuggestion && (
        <div>
          <div>
            <h4>Selected Action: {selectedSuggestion.title}</h4>
            <button onClick={onCancelSuggestion} title="Cancel suggestion">
              ×
            </button>
          </div>
          <p>{selectedSuggestion.detailedSuggestion}</p>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={
            selectedSuggestion
              ? "Add any additional context..."
              : "Type your message..."
          }
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
};

// Main component using unified context
export const MessageThread = (): ReactElement => {
  const { threads } = useHydraContext();

  return (
    <div>
      <div>
        <h1>Message Threads</h1>
        <button onClick={() => threads.operations.create()}>New Thread</button>
      </div>
      <div>
        {threads.all.map((thread) => (
          <Thread key={thread.id} thread={thread} />
        ))}
      </div>
    </div>
  );
};

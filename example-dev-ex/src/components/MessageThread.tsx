import {
  HydraMessageProvider,
  useHydraThreadCore,
  useHydraThreadMessages,
  type HydraStreamingState,
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
  onSelectSuggestion,
}: {
  message: HydraThreadMessage;
  messageId: string;
  onSelectSuggestion: (suggestion: HydraSuggestion) => void;
}): ReactElement => {
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
              {key}:{" "}
              {(value as HydraStreamingState).isStreaming
                ? "Streaming"
                : "Complete"}
            </p>
          ))}
        </div>
      )}
      {message.interactiveComponent?.component && (
        <div>
          <h4>Interacted Component:</h4>
          <HydraMessageProvider
            messageId={messageId}
            initialProps={message.interactiveComponent.generatedProps}
          >
            <message.interactiveComponent.component
              // The note component doesn't use hydra for state so needs props.
              {...message.interactiveComponent.generatedProps}
            />
          </HydraMessageProvider>
        </div>
      )}
      {message.type === "hydra" && (
        <Suggestions
          suggestions={message.suggestions}
          onSelect={onSelectSuggestion}
        />
      )}
    </div>
  );
};

// New input component with suggestion context
const ThreadInput = ({
  onSend,
  selectedSuggestion,
  onCancelSuggestion,
}: {
  onSend: (message: string, suggestion?: HydraSuggestion) => Promise<void>;
  selectedSuggestion?: HydraSuggestion;
  onCancelSuggestion: () => void;
}): ReactElement => {
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    await onSend(message, selectedSuggestion);
    setMessage("");
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
          {(selectedSuggestion.suggestedTools?.length ?? 0) > 0 && (
            <div>
              <span>Using: </span>
              {selectedSuggestion.suggestedTools?.join(", ")}
            </div>
          )}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            selectedSuggestion
              ? "Add any additional context..."
              : "Type your message..."
          }
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

// Updated Thread component
const Thread = ({ thread }: { thread: HydraThread }): ReactElement => {
  const { messages, generate, clear } = useHydraThreadMessages(thread.id);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<HydraSuggestion>();

  const handleSend = async (message: string, suggestion?: HydraSuggestion) => {
    await generate(message, { suggestion });
    setSelectedSuggestion(undefined);
  };

  const handleSuggestionSelect = (suggestion: HydraSuggestion) => {
    setSelectedSuggestion(suggestion);
  };

  return (
    <div>
      <div>
        <h2>{thread.title}</h2>
        <button onClick={() => clear()}>Clear Messages</button>
      </div>
      <div>
        {messages.map((msg, index) => (
          <ThreadMessage
            key={index}
            message={msg}
            messageId={`${thread.id}-${index}`}
            onSelectSuggestion={handleSuggestionSelect}
          />
        ))}
      </div>
      <ThreadInput
        onSend={handleSend}
        selectedSuggestion={selectedSuggestion}
        onCancelSuggestion={() => setSelectedSuggestion(undefined)}
      />
    </div>
  );
};

// Main component using core hook for global operations
export const MessageThread = (): ReactElement => {
  const { operations, state } = useHydraThreadCore();

  return (
    <div>
      <div>
        <h1>Message Threads</h1>
        <button onClick={() => operations.create()}>New Thread</button>
      </div>
      <div>
        {state.threads.map((thread) => (
          <Thread key={thread.id} thread={thread} />
        ))}
      </div>
    </div>
  );
};

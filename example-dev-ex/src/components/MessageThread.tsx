import {
  useThreadCore,
  useThreadMessages,
  type HydraStreamingState,
  type HydraThread,
  type HydraThreadMessage,
} from "hydra-ai-react";
import { type ReactElement } from "react";

// Separate message component for better organization
const ThreadMessage = ({
  message,
}: {
  message: HydraThreadMessage;
}): ReactElement => {
  return (
    <div className="message">
      <p>
        <strong>{message.role === "user" ? "User" : "AI"}:</strong>{" "}
        {message.message}
      </p>
      {message.aiStatus?.map((status, i) => (
        <p key={i} className="status">
          <strong>{status.state}:</strong> {status.message}
        </p>
      ))}
      {message.streamingState && (
        <div className="streaming-status">
          <p>
            <strong>Streaming Status:</strong>
          </p>
          {Object.entries(message.streamingState).map(([key, value]) => (
            <p key={key}>
              {key}:{" "}
              {(value as HydraStreamingState).isStreaming
                ? "Streaming"
                : "Complete"}
            </p>
          ))}
        </div>
      )}
      {message.generatedComponent?.component && (
        <div className="generated-component">
          <h4>Generated Component:</h4>
          <message.generatedComponent.component
            {...message.generatedComponent.interactiveProps}
          />
        </div>
      )}
      {message.interactedComponent?.component && (
        <div className="interacted-component">
          <h4>Interacted Component:</h4>
          <message.interactedComponent.component
            {...message.interactedComponent.interactiveProps}
          />
        </div>
      )}
    </div>
  );
};

// Individual thread component using specialized hooks
const Thread = ({ thread }: { thread: HydraThread }): ReactElement => {
  const { messages, send, clear } = useThreadMessages(thread.id);

  return (
    <div className="thread">
      <div className="thread-header">
        <h2>{thread.title}</h2>
        <button onClick={() => clear()}>Clear Messages</button>
      </div>
      <div className="messages">
        {messages.map((msg, index) => (
          <ThreadMessage key={index} message={msg} />
        ))}
      </div>
      <div className="thread-actions">
        <button onClick={() => send("New message")}>Send Message</button>
      </div>
    </div>
  );
};

// Main component using core hook for global operations
export const MessageThread = (): ReactElement => {
  const { operations, state } = useThreadCore();

  return (
    <div className="message-thread">
      <div className="thread-controls">
        <h1>Message Threads</h1>
        <button onClick={() => operations.create()}>New Thread</button>
      </div>
      <div className="threads">
        {state.threads.map((thread) => (
          <Thread key={thread.id} thread={thread} />
        ))}
      </div>
    </div>
  );
};

import {
  useSendThreadMessage,
  useThreads,
  useThreadState,
} from "hydra-ai-react";
import { type ReactElement } from "react";

export const MessageThread = (): ReactElement => {
  const threads = useThreads();
  const threadState = useThreadState();
  const sendThreadMessage = useSendThreadMessage();

  return (
    <div>
      <h1>Message Threads</h1>
      {threads.map((thread) => (
        <div key={thread.id}>
          <h2>{thread.title}</h2>
          <div>
            {threadState[thread.id]?.messages.map((msg, index) => (
              <div key={index}>
                <p>
                  <strong>{msg.role === "user" ? "User" : "AI"}:</strong>{" "}
                  {msg.message}
                </p>
                {msg.aiStatus?.map((status, i) => (
                  <p key={i}>
                    <strong>{status.state}:</strong> {status.message}
                  </p>
                ))}
                {msg.streamingState && (
                  <div>
                    <p>
                      <strong>Streaming Status:</strong>
                    </p>
                    {Object.entries(msg.streamingState).map(([key, value]) => (
                      <p key={key}>
                        {key}: {value.isStreaming ? "Streaming" : "Complete"}
                      </p>
                    ))}
                  </div>
                )}
                {msg.generatedComponent?.component && (
                  <div>
                    <h4>Generated Component:</h4>
                    <msg.generatedComponent.component
                      {...msg.generatedComponent.interactiveProps}
                    />
                  </div>
                )}
                {msg.interactedComponent?.component && (
                  <div>
                    <h4>Interacted Component:</h4>
                    <msg.interactedComponent.component
                      {...msg.interactedComponent.interactiveProps}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => sendThreadMessage(thread.id, "New message")}>
            Send Message
          </button>
        </div>
      ))}
    </div>
  );
};

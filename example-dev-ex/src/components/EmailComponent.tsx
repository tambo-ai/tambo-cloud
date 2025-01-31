import { useHydraMessage } from "hydra-ai-react";
import { type ReactElement } from "react";
import { type EmailData } from "../schemas/componentSchemas";

export const EmailComponent = (): ReactElement => {
  const [message, setMessage] = useHydraMessage<EmailData>();

  const handleToChange = (value: string) => {
    setMessage({
      to: value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  return (
    <div>
      <div>
        <label>To:</label>
        <input
          value={message.to.join(", ")}
          onChange={(e) => handleToChange(e.target.value)}
          placeholder="Enter email addresses..."
        />
      </div>

      <div>
        <label>Subject:</label>
        <input
          value={message.subject}
          onChange={(e) => setMessage({ subject: e.target.value })}
          placeholder="Enter subject..."
        />
      </div>

      <div>
        <label>Message:</label>
        <textarea
          value={message.content}
          onChange={(e) => setMessage({ content: e.target.value })}
          placeholder="Enter message..."
        />
      </div>
    </div>
  );
};

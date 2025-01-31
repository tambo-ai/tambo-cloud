import { useHydraCurrentMessage } from "hydra-ai-react";
import { type ReactElement } from "react";
import { type EmailData } from "../schemas/componentSchemas";

export const EmailComponent = (): ReactElement => {
  const { state, setState } = useHydraCurrentMessage<EmailData>();

  const handleToChange = (value: string) => {
    setState({
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
          value={state.to.join(", ")}
          onChange={(e) => handleToChange(e.target.value)}
          placeholder="Enter email addresses..."
        />
      </div>

      <div>
        <label>Subject:</label>
        <input
          value={state.subject}
          onChange={(e) => setState({ subject: e.target.value })}
          placeholder="Enter subject..."
        />
      </div>

      <div>
        <label>Message:</label>
        <textarea
          value={state.content}
          onChange={(e) => setState({ content: e.target.value })}
          placeholder="Enter message..."
        />
      </div>
    </div>
  );
};

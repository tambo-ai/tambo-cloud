import { type ReactElement } from "react";
import { type EmailData } from "../schemas/componentSchemas";

interface EmailComponentProps extends Readonly<EmailData> {
  onChange: (updates: Partial<EmailData>) => void;
}

export const EmailComponent = ({
  to = [],
  subject = "",
  content = "",
  onChange,
}: EmailComponentProps): ReactElement => {
  const handleToChange = (value: string) => {
    onChange({
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
          value={to.join(", ")}
          onChange={(e) => handleToChange(e.target.value)}
          placeholder="Enter email addresses..."
        />
      </div>

      <div>
        <label>Subject:</label>
        <input
          value={subject}
          onChange={(e) => onChange({ subject: e.target.value })}
          placeholder="Enter subject..."
        />
      </div>

      <div>
        <label>Message:</label>
        <textarea
          value={content}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="Enter message..."
        />
      </div>
    </div>
  );
};

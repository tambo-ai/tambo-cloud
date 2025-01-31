import { type ReactElement } from "react";
import { type EmailData } from "../schemas/componentSchemas";

interface EmailProps {
  to: string[];
  subject: string;
  content: string;
  onUpdate?: (updates: Partial<EmailData>) => void;
}

export const EmailComponent = ({
  to,
  subject,
  content,
  onUpdate,
}: Readonly<EmailProps>): ReactElement => {
  const handleToChange = (value: string) => {
    onUpdate?.({
      to: value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  const handleSubjectChange = (value: string) => {
    onUpdate?.({ subject: value });
  };

  const handleContentChange = (value: string) => {
    onUpdate?.({ content: value });
  };

  return (
    <div>
      <div>
        <label>To:</label>
        <input
          value={to.join(", ")}
          onChange={(e) => handleToChange(e.target.value)}
        />
      </div>

      <div>
        <label>Subject:</label>
        <input
          value={subject}
          onChange={(e) => handleSubjectChange(e.target.value)}
        />
      </div>

      <div>
        <label>Message:</label>
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
        />
      </div>
    </div>
  );
};

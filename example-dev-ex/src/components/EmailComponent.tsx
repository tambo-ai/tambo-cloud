import { type ReactElement } from "react";
import { type EmailProps } from "../schemas/componentSchemas";

export const EmailComponent = ({
  subject,
  body,
  recipients,
}: Readonly<EmailProps>): ReactElement => {
  return (
    <div>
      <div>
        <div>
          <h3>Subject</h3>
          <p>{subject}</p>
        </div>

        <div>
          <h3>Recipients</h3>
          <div>
            {recipients.map((email) => (
              <span key={email}>{email}</span>
            ))}
          </div>
        </div>

        <div>
          <h3>Message</h3>
          <p>{body}</p>
        </div>
      </div>
    </div>
  );
};

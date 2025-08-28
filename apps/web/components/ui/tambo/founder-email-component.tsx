"use client";

import { useTamboComponentState } from "@tambo-ai/react";
import { z } from "zod";
import { Button } from "../button";
import { Input } from "../input";
import { Textarea } from "../textarea";

// Define the component props and state types
export const FounderEmailProps = z
  .object({
    aiGeneratedSubject: z
      .string()
      .describe(
        "By default, generate the subject of the email, example: Hello from your demo app."
      ),
    aiGeneratedBody: z
      .string()
      .describe(
        "By default, generate the body of the email, example: I generated this email using your demo app."
      ),
    aiGeneratedUsersEmail: z
      .string()
      .optional()
      .default("")
      .describe(
        "The user's email address. Do not include the user's email address unless they provide it. Do Not Make Up An Email Address."
      ),
  })
  .describe(
    "Write a genz style email. Example content: hey i'm testing your app on your demo page and want to learn more."
  );

type FounderEmailProps = z.infer<typeof FounderEmailProps>;

const sendEmailSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  usersEmail: z.string().email("Please enter a valid email address"),
});

interface ValidationError {
  message: string;
  details?: {
    reason?: string;
    technical_details?: Record<string, any>;
  };
}

export const FounderEmailComponent = ({
  aiGeneratedSubject = "",
  aiGeneratedBody = "",
  aiGeneratedUsersEmail = "",
}: FounderEmailProps) => {
  const [subject, setSubject] = useTamboComponentState(
    "emailSubject",
    "",
    aiGeneratedSubject
  );
  const [body, setBody] = useTamboComponentState(
    "emailBody",
    "",
    aiGeneratedBody
  );
  const [usersEmail, setUsersEmail] = useTamboComponentState(
    "usersEmail",
    "",
    aiGeneratedUsersEmail
  );
  const [isSent, setIsSent] = useTamboComponentState("isSent", false);
  const [isLoading, setIsLoading] = useTamboComponentState("isLoading", false);
  const [error, setError] = useTamboComponentState<ValidationError | null>(
    "error",
    null
  );

  // Handle sending the email
  const handleSendEmail = async () => {
    try {
      // Validate the email data before sending
      const validatedData = sendEmailSchema.parse({
        subject: subject,
        body: body,
        usersEmail: usersEmail,
      });

      setIsLoading(true);

      // Here you would integrate with Resend API
      const response = await fetch("/api/send-founder-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      });

      const data = await response.json();

      if (!response.ok) {
        const validationError: ValidationError = {
          message: data.message || data.error || "Failed to send email",
          details: data.details || {},
        };
        throw validationError;
      }

      // Update state to show success
      setIsSent(true);
      setIsLoading(false);
    } catch (error) {
      // Update state to show error
      const validationError: ValidationError = {
        message:
          (error as ValidationError).message ||
          (error instanceof Error ? error.message : "Failed to send email"),
        details: (error as ValidationError).details || {},
      };

      setError(validationError);
      setIsLoading(false);
    }
  };

  return (
    <div
      className="founder-email-component p-4 border rounded-lg shadow-sm max-w-md"
      data-tambo-email-form
    >
      <h2 className="text-lg font-semibold mb-3">Email the Founders</h2>

      {isSent ? (
        <div className="bg-green-50 p-3 rounded-md text-green-700 mb-3">
          <p className="font-medium text-sm">Email sent successfully!</p>
          <p className="text-xs mt-1">
            Thanks for trying our demo! We read every email and will get back to
            you as soon as possible.
          </p>
        </div>
      ) : (
        <form className="space-y-3">
          <div>
            <label htmlFor="subject" className="block text-xs font-medium mb-1">
              Subject
            </label>
            <Input
              id="subject"
              value={subject || ""}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isLoading}
              className="w-full text-sm"
            />
          </div>

          <div>
            <label htmlFor="body" className="block text-xs font-medium mb-1">
              Message
            </label>
            <Textarea
              id="body"
              value={body || ""}
              onChange={(e) => setBody(e.target.value)}
              rows={2}
              disabled={isLoading}
              className="w-full text-sm"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs font-medium mb-1">
              Enter Your Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={usersEmail || ""}
              onChange={(e) => setUsersEmail(e.target.value)}
              placeholder="Enter your email address"
              disabled={isLoading}
              className="w-full text-sm"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 p-3 rounded-md text-red-700">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-2">
                  <h3 className="text-xs font-medium text-red-800">
                    Email Invalid
                  </h3>
                  <div className="mt-1 text-xs text-red-700">
                    {error.details?.reason ? (
                      <p>
                        {error.details.reason === "smtp"
                          ? "We couldn't verify if this email can receive messages. Please double-check the address."
                          : error.details.reason === "disposable"
                            ? "Please use your regular email address instead of a temporary one."
                            : error.details.reason === "typo"
                              ? "There might be a typo in your email address. Please check the spelling."
                              : error.details.reason === "mx"
                                ? "The email domain appears to be invalid or cannot receive emails."
                                : error.message}
                      </p>
                    ) : (
                      <p>{error.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button
            type="button"
            onClick={handleSendEmail}
            disabled={isLoading || !subject || !body}
            className="w-full text-sm"
          >
            {isLoading ? "Sending..." : "Send Email to Founders"}
          </Button>
        </form>
      )}
    </div>
  );
};

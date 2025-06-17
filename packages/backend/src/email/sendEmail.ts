import { Resend } from "resend";
import { render } from "@react-email/render";
import React from "react";

export interface SendEmailOptions<P extends Record<string, unknown>> {
  to: string | string[];
  component: React.ComponentType<P>;
  props: P;
  /** Optional custom subject. Falls back to component name. */
  subject?: string;
  /** Optional from address. Falls back to env var or default. */
  from?: string;
}

export interface SendEmailResult {
  id: string | null;
  success: boolean;
  error?: unknown;
}

/**
 * Renders a React-Email component to HTML and sends it via Resend.
 */
export async function sendEmail<P extends Record<string, unknown>>(
  opts: SendEmailOptions<P>,
): Promise<SendEmailResult> {
  const { to, component: Component, props, subject, from } = opts;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY env variable is required");

  const resend = new Resend(apiKey);

  // Use createElement to avoid JSX in .ts file
  const html = render(React.createElement(Component, props));

  try {
    const { id } = await resend.emails.send({
      from: from ?? process.env.RESEND_FROM_ADDR ?? "noreply@tambo.ai", // eslint-disable-line turbo/no-undeclared-env-vars
      to,
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      subject: subject ?? Component.displayName ?? Component.name ?? "Email",
      html,
    });

    return { id, success: true };
  } catch (error) {
    return { id: null, success: false, error };
  }
}

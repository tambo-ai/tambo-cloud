import React from "react";
import { Body, Container, Hr, Html, Link, Preview, Text } from "@react-email/components";

export interface SignupEmailProps {
  firstName?: string | null;
  docsUrl: string;
  unsubscribeUrl: string;
}

/*
 This component renders both HTML and plain-text automatically via @react-email/render.
 The test suite renders the component to verify the markup doesn’t unexpectedly change.
*/
export default function SignupEmail({
  firstName,
  docsUrl,
  unsubscribeUrl,
}: SignupEmailProps) {
  const greetingName = firstName?.trim() || "there";

  return (
    <Html>
      <Preview>Welcome to tambo – let’s get building</Preview>
      <Body
        style={{
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
          margin: 0,
          padding: 0,
          backgroundColor: "#ffffff",
        }}
      >
        <Container style={{ maxWidth: "600px", margin: "0 auto", padding: "24px" }}>
          <Text style={{ fontSize: 18, marginBottom: 16 }}>welcome, {greetingName}!</Text>

          <Text style={{ fontSize: 16, margin: "16px 0" }}>
            Thanks for signing up!
          </Text>

          <Text style={{ fontSize: 16 }}>1) run: <code>npx create-tambo@latest</code></Text>
          <Text style={{ fontSize: 16 }}>
            2) quick-start guide: <Link href={docsUrl}>{docsUrl}</Link>
          </Text>

          <Text style={{ fontSize: 16, margin: "24px 0" }}>
            questions? reply to this email.
          </Text>

          <Text style={{ fontSize: 16, marginTop: 24 }}>— michael & the tambo team</Text>

          <Hr style={{ margin: "32px 0", borderColor: "#e5e7eb" }} />

          <Text style={{ fontSize: 12, color: "#6b7280" }}>
            Don’t want these emails?
            {" "}
            <Link href={unsubscribeUrl}>Unsubscribe</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Helper to generate the plain-text version, exported for convenience.
export function renderSignupEmailText({ firstName, docsUrl, unsubscribeUrl }: SignupEmailProps) {
  const greetingName = firstName?.trim() || "there";
  return `welcome, ${greetingName}!\n\nThanks for signing up!\n\n1) run: npx create-tambo@latest\n2) quick-start guide: ${docsUrl}\n\nquestions? reply to this email.\n\n— michael & the tambo team\n\nUnsubscribe: ${unsubscribeUrl}\n`;
}

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";

interface DemoRequestEmailProps {
  userEmail: string;
}

export const DemoRequestEmail = ({ userEmail }: DemoRequestEmailProps) => (
  <Html>
    <Head />
    <Preview>Thanks for your interest in Hydra AI</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Thanks for requesting a demo!</Heading>
        <Text style={text}>Hi there,</Text>
        <Text style={text}>
          Thanks for your interest in Hydra AI. We're excited to show you how
          our platform can help you build powerful AI-powered UIs.
        </Text>
        <Text style={text}>
          I'll personally reach out shortly to schedule a time that works best
          for you. In the meantime, feel free to check out our{" "}
          <Link href="https://usehydra.ai/docs">documentation</Link> to learn
          more about what's possible with Hydra.
        </Text>
        <Text style={text}>
          Best regards,
          <br />
          Michael Magán
          <br />
          Founder, Hydra AI
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "40px",
  margin: "0 0 20px",
};

const text = {
  color: "#1a1a1a",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
};

import { render } from "@react-email/render";
import { SignupEmail, renderSignupEmailText } from "../emails/SignupEmail";
import { EmailService } from "../common/services/email.service";

export interface WelcomeEmailUser {
  id: string;
  email: string;
  firstName?: string | null;
}

export async function sendWelcomeEmail(
  emailService: EmailService,
  user: WelcomeEmailUser,
  options: { docsUrl?: string } = {},
) {
  const docsUrl = options.docsUrl ?? "https://docs.tambo.co/quick-start";
  const unsubscribeUrl = `https://tambo.co/unsubscribe?userId=${user.id}`;

  // Render both html and text variants from the same React template
  const emailProps = {
    firstName: user.firstName ?? null,
    docsUrl,
    unsubscribeUrl,
  } as const;

  // `render` currently returns a Promise<string>
  const html = await render(<SignupEmail {...emailProps} />);
  const text = renderSignupEmailText(emailProps);

  await emailService.sendEmail({
    to: user.email,
    subject: "Welcome to tambo – let’s get building",
    html,
    text,
    replyTo: "magan@tambo.co",
  });
}

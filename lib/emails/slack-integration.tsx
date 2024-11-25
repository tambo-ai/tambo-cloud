import { Resend } from "resend";

const getEmailText = () => {
  return `Hey there! It's Michael from Hydra.

I just sent you an invite to connect your Slack workspace to Hydra.

Feel free to reply to this email if you have any questions.
`;
};

const resend = new Resend(process.env.RESEND_API_KEY);
export async function sendWelcomeEmail(email: string[]) {
  console.log("Sending welcome email to", email);
  const scheduledTime = new Date();
  scheduledTime.setMinutes(scheduledTime.getMinutes() + 90);
  console.log("Scheduled time:", scheduledTime);

  const result = await resend.emails.send({
    from: "Michael Magán <support@updates.usehydra.ai>",
    replyTo: "Michael Magán <magan@usehydra.ai>",
    to: email,
    subject: "Howdy from Michael",
    text: getEmailText(),
    scheduledAt: scheduledTime.toISOString(),
  });
  console.log("Email sent", result);
}

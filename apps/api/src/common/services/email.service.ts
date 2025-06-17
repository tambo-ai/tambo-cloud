import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import { FREE_MESSAGE_LIMIT } from "../../threads/types/errors";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly fromEmail = "tambo-ai <noreply@updates.tambo.co>";

  constructor(private readonly configService: ConfigService) {
    const resendApiKey = this.configService.get<string>("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    this.resend = new Resend(resendApiKey);
  }

  /**
   * Generic helper that sends an email via Resend.
   * Swallows any errors to avoid failing the caller during non-critical flows.
   */
  async sendEmail({
    to,
    subject,
    html,
    text,
    replyTo,
  }: SendEmailOptions): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
        text,
        replyTo,
      });
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  }

  async sendMessageLimitNotification(
    projectId: string,
    userEmail: string,
    projectName: string,
  ) {
    const subject = "tambo ai- Free Message Limit Reached";
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>tambo ai - Message Limit Notification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="padding: 20px; background-color: white;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; width: 100%;">
                  <tr>
                    <td style="padding-bottom: 20px;">
                      <img src="https://tambo.co/logo/lockup/Tambo-Lockup.png" alt="tambo" style="width: 150px; height: auto;">
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <h1 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 20px;">Message Limit Reached</h1>
                      <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                        You've reached your free message limit of ${FREE_MESSAGE_LIMIT} messages for your project:
                      </p>
                      <div style="background-color: #F3F4F6; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px;">
                        <strong style="color: #111827; font-size: 18px;">${projectName}</strong>
                        <span style="color: #6B7280; font-size: 14px; margin-left: 8px;">(${projectId})</span>
                      </div>
                      <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                        To continue using the service, you have two options:
                      </p>
                      <ol style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px; padding-left: 20px;">
                        <li style="margin-bottom: 10px;">
                          Add your own LLM provider (like OpenAI) to your project
                        </li>
                        <li>
                          Contact us at <a href="mailto:support@tambo.co" style="color: #2563eb; text-decoration: underline;">support@tambo.co</a> to discuss enterprise options
                        </li>
                      </ol>
                      <div style="margin: 40px 0;">
                        <a href="https://tambo.co/dashboard/${projectId}" 
                           style="background-color: #7FFFC4; color: #023A41; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: block; text-align: center; width: 100%; box-sizing: border-box;">
                          Go to Your Project
                        </a>
                      </div>
                      <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 40px 0 20px;">
                        Thank you for using tambo!
                      </p>
                      <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 0;">
                        Best regards,<br>
                        The tambo-ai team
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px; text-align: center; background-color: #f9fafb;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                  Fractal Dynamics Inc © 2024
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: userEmail,
      subject,
      html,
      replyTo: "support@tambo.co",
    });
  }
}

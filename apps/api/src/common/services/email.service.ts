import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly fromEmail = "Tambo AI <noreply@updates.tambo.co>";

  constructor(private readonly configService: ConfigService) {
    const resendApiKey = this.configService.get<string>("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    this.resend = new Resend(resendApiKey);
  }

  async sendMessageLimitNotification(projectId: string, userEmail: string) {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: userEmail,
        subject: "tambo - Free Message Limit Reached",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>tambo - Message Limit Notification</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 20px 0; text-align: center; background-color: white;">
                    <img src="https://tambo.co/logo/lockup/Tambo-Lockup.png" alt="tambo" style="width: 200px; height: auto;">
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 20px; background-color: white;">
                    <table role="presentation" style="max-width: 600px; margin: 0 auto; width: 100%;">
                      <tr>
                        <td>
                          <h1 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 20px;">Message Limit Reached</h1>
                          <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                            You have reached your free message limit of 500 messages for project ${projectId}.
                          </p>
                          <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                            To continue using the service, you have two options:
                          </p>
                          <ol style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px; padding-left: 20px;">
                            <li style="margin-bottom: 10px;">
                              <a href="https://tambo.co/dashboard" style="color: #2563eb; text-decoration: underline;">Set up your own OpenAI API key</a>
                            </li>
                            <li>
                              Contact our support team to discuss enterprise options
                            </li>
                          </ol>
                          <div style="margin: 40px 0; text-align: center;">
                            <a href="https://tambo.co/dashboard" 
                               style="background-color: #7FFFC4; color: #023A41; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                              Go to Dashboard
                            </a>
                          </div>
                          <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 40px 0 20px;">
                            Thank you for using tambo!
                          </p>
                          <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 0;">
                            Best regards,<br>
                            tambo Team
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
        `,
      });
    } catch (error) {
      console.error("Failed to send message limit notification email:", error);
      // Don't throw the error as this is a non-critical operation
    }
  }
}

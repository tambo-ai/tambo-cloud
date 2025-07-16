import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import { FREE_MESSAGE_LIMIT } from "../../threads/types/errors";
import { firstMessageEmail } from "../emails/first-message";
import { messageLimitEmail } from "../emails/message-limit";
import { reactivationEmail } from "../emails/reactivation";
import { welcomeEmail } from "../emails/welcome";

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

  async sendMessageLimitNotification(
    projectId: string,
    userEmail: string,
    projectName: string,
  ) {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: userEmail,
        replyTo: "support@tambo.co",
        subject: messageLimitEmail.subject,
        html: messageLimitEmail.html({
          projectId,
          projectName,
          messageLimit: FREE_MESSAGE_LIMIT,
        }),
      });
    } catch (error) {
      console.error("Failed to send message limit notification email:", error);
      // Don't throw the error as this is a non-critical operation
    }
  }

  async sendWelcomeEmail(
    userEmail: string,
    firstName?: string | null,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.resend.emails.send({
        from: "Michael Magán <magan@updates.tambo.co>",
        to: userEmail,
        replyTo: "magan@tambo.co",
        subject: welcomeEmail.subject,
        html: welcomeEmail.html({
          firstName,
        }),
      });

      console.log(`Welcome email sent successfully to ${userEmail}`, result);

      return { success: true };
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendFirstMessageEmail(
    userEmail: string,
    firstName?: string | null,
    projectName: string = "your project",
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: userEmail,
        replyTo: "support@tambo.co",
        subject: firstMessageEmail.subject,
        html: firstMessageEmail.html({
          firstName,
          projectName,
        }),
      });

      console.log(
        `First message email sent successfully to ${userEmail}`,
        result,
      );

      return { success: true };
    } catch (error) {
      console.error("Failed to send first message email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendReactivationEmail(
    userEmail: string,
    daysSinceSignup: number,
    hasProject: boolean,
    firstName?: string | null,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.resend.emails.send({
        from: "Michael Magán <magan@updates.tambo.co>",
        to: userEmail,
        replyTo: "magan@tambo.co",
        subject: reactivationEmail.subject,
        html: reactivationEmail.html({
          firstName,
          daysSinceSignup,
          hasProject,
        }),
      });

      console.log(
        `Reactivation email sent successfully to ${userEmail}`,
        result,
      );

      return { success: true };
    } catch (error) {
      console.error("Failed to send reactivation email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

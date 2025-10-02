import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import { FREE_MESSAGE_LIMIT } from "../../threads/types/errors";
import { isResendEmailUnsubscribed, maskEmail } from "@tambo-ai-cloud/core";
import { firstMessageEmail } from "../emails/first-message";
import { messageLimitEmail } from "../emails/message-limit";
import { reactivationEmail } from "../emails/reactivation";
import { welcomeEmail } from "../emails/welcome";

@Injectable()
export class EmailService {
  private readonly resend?: Resend;
  private readonly fromEmailDefault?: string;
  private readonly fromEmailPersonal?: string;
  private readonly replyToSupport?: string;
  private readonly replyToPersonal?: string;
  private readonly resendAudienceId?: string;

  constructor(private readonly configService: ConfigService) {
    const missing: string[] = [];

    const resendApiKey = this.configService.get<string>("RESEND_API_KEY");
    if (!resendApiKey) {
      missing.push("RESEND_API_KEY");
    } else {
      this.resend = new Resend(resendApiKey);
    }

    this.fromEmailDefault =
      this.configService.get<string>("EMAIL_FROM_DEFAULT") || undefined;
    if (!this.fromEmailDefault) {
      missing.push("EMAIL_FROM_DEFAULT");
    }

    this.fromEmailPersonal =
      this.configService.get<string>("EMAIL_FROM_PERSONAL") || undefined;
    if (!this.fromEmailPersonal) {
      missing.push("EMAIL_FROM_PERSONAL");
    }

    this.replyToSupport =
      this.configService.get<string>("EMAIL_REPLY_TO_SUPPORT") || undefined;
    if (!this.replyToSupport) {
      missing.push("EMAIL_REPLY_TO_SUPPORT");
    }

    this.replyToPersonal =
      this.configService.get<string>("EMAIL_REPLY_TO_PERSONAL") || undefined;
    if (!this.replyToPersonal) {
      missing.push("EMAIL_REPLY_TO_PERSONAL");
    }

    const audienceId = this.configService.get<string>("RESEND_AUDIENCE_ID");
    this.resendAudienceId = audienceId || undefined;

    if (missing.length > 0) {
      console.warn(
        `EmailService: email notifications disabled (missing ${missing.join(", ")}).`,
      );
    }
  }

  private async isEmailUnsubscribed(userEmail: string): Promise<boolean> {
    const resend = this.resend;
    const audienceId = this.resendAudienceId;
    if (!resend || !audienceId) return false;
    return await isResendEmailUnsubscribed(
      resend.contacts,
      audienceId,
      userEmail,
    );
  }

  async sendMessageLimitNotification(
    projectId: string,
    userEmail: string,
    projectName: string,
  ) {
    const resend = this.resend;
    const fromEmailDefault = this.fromEmailDefault;
    const replyToSupport = this.replyToSupport;
    if (!resend || !fromEmailDefault || !replyToSupport) {
      console.warn(
        "EmailService: skipping message limit notification; email notifications disabled.",
      );
      return;
    }

    try {
      await resend.emails.send({
        from: fromEmailDefault,
        to: userEmail,
        replyTo: replyToSupport,
        subject: messageLimitEmail.subject,
        html: messageLimitEmail.html({
          projectId,
          projectName,
          messageLimit: FREE_MESSAGE_LIMIT,
        }),
      });
    } catch (error) {
      console.error("Failed to send message limit notification email:", error);
    }
  }

  async sendWelcomeEmail(
    userEmail: string,
    firstName?: string | null,
  ): Promise<{ success: boolean; error?: string }> {
    const resend = this.resend;
    const fromEmailPersonal = this.fromEmailPersonal;
    const replyToPersonal = this.replyToPersonal;
    if (!resend || !fromEmailPersonal || !replyToPersonal) {
      const error = "Email service not configured";
      console.warn(
        `EmailService: skipping welcome email for ${maskEmail(userEmail)}; ${error}.`,
      );
      return { success: false, error };
    }

    try {
      if (await this.isEmailUnsubscribed(userEmail)) {
        console.debug("Welcome email skipped: recipient is unsubscribed", {
          email: maskEmail(userEmail),
        });
        return { success: true };
      }
      const result = await resend.emails.send({
        from: fromEmailPersonal,
        to: userEmail,
        replyTo: replyToPersonal,
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
    const resend = this.resend;
    const fromEmailDefault = this.fromEmailDefault;
    const replyToSupport = this.replyToSupport;
    if (!resend || !fromEmailDefault || !replyToSupport) {
      const error = "Email service not configured";
      console.warn(
        `EmailService: skipping first message email for ${maskEmail(userEmail)}; ${error}.`,
      );
      return { success: false, error };
    }

    try {
      const result = await resend.emails.send({
        from: fromEmailDefault,
        to: userEmail,
        replyTo: replyToSupport,
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
    const resend = this.resend;
    const fromEmailPersonal = this.fromEmailPersonal;
    const replyToPersonal = this.replyToPersonal;
    if (!resend || !fromEmailPersonal || !replyToPersonal) {
      const error = "Email service not configured";
      console.warn(
        `EmailService: skipping reactivation email for ${maskEmail(userEmail)}; ${error}.`,
      );
      return { success: false, error };
    }

    try {
      if (await this.isEmailUnsubscribed(userEmail)) {
        console.debug("Reactivation email skipped: recipient is unsubscribed", {
          email: maskEmail(userEmail),
        });
        return { success: true };
      }
      const result = await resend.emails.send({
        from: fromEmailPersonal,
        to: userEmail,
        replyTo: replyToPersonal,
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

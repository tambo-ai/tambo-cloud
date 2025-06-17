import PgBoss from "pg-boss";
import { sendWelcomeEmail } from "../utils/sendWelcomeEmail";
import { EmailService } from "../common/services/email.service";
import { Inject, Injectable } from "@nestjs/common";
import type { HydraDatabase } from "@tambo-ai-cloud/db";
import { DATABASE } from "../common/middleware/db-transaction-middleware";

export const WELCOME_EMAIL_JOB = "welcome_email";

interface WelcomeEmailPayload {
  userId: string;
  email: string;
  firstName?: string | null;
}

@Injectable()
export class WelcomeEmailQueue {
  constructor(
    @Inject(DATABASE) private readonly db: HydraDatabase,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Register worker with provided PgBoss instance.
   */
  async work(boss: PgBoss) {
    await boss.work<WelcomeEmailPayload>(WELCOME_EMAIL_JOB, async (job) => {
      // `pg-boss` defines `data: unknown`; cast once for strong typing
      const { userId, email, firstName } = job.data as WelcomeEmailPayload;

      // Call the shared util to send the actual email
      await sendWelcomeEmail(this.emailService, {
        id: userId,
        email,
        firstName,
      });

      // Record the send event (very light for now, can be extended)
      await this.db.execute(
        `insert into email_events (user_id, event_type, created_at) values ($1, 'welcome_email', now())`,
        [userId],
      );
    });
  }
}

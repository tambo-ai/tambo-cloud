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
    await boss.work<WelcomeEmailPayload>(WELCOME_EMAIL_JOB, async (jobs) => {
      const job = Array.isArray(jobs) ? jobs[0] : (jobs as any);
      if (!job) return;
      const { userId, email, firstName } = job.data as WelcomeEmailPayload;

      await sendWelcomeEmail(this.emailService, {
        id: userId,
        email,
        firstName,
      });

      // Lightweight record into email_events; schema not yet in Drizzle types
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await (this.db as any).execute(
        `insert into email_events (user_id, event_type, created_at) values ($1, 'welcome_email', now())`,
        [userId],
      );
    });
  }
}

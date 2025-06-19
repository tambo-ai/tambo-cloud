import PgBoss from "pg-boss";
import { sendWelcomeEmail } from "../utils/sendWelcomeEmail";
import { EmailService } from "../common/services/email.service";
import { Inject, Injectable } from "@nestjs/common";
import type { HydraDatabase } from "@tambo-ai-cloud/db";
import { DATABASE } from "../common/middleware/db-transaction-middleware";
import { sql } from "drizzle-orm";

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
    await boss.work<WelcomeEmailPayload>(
      WELCOME_EMAIL_JOB,
      async (jobOrJobs) => {
        const jobs = Array.isArray(jobOrJobs) ? jobOrJobs : [jobOrJobs];

        for (const job of jobs) {
          const { userId, email, firstName } = job.data;

          await sendWelcomeEmail(this.emailService, {
            id: userId,
            email,
            firstName,
          });

          // Record send event – email_events table not yet in typed schema
          await this.db.execute(sql`
          insert into email_events (user_id, event_type, created_at)
          values (${userId}, 'welcome_email', now())
        `);
        }
      },
    );
  }
}

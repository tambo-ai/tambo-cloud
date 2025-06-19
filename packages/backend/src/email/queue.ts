import PgBoss from "pg-boss";

export interface EmailJobPayload {
  to: string | string[];
  componentName: string;
  props: Record<string, unknown>;
  subject?: string;
  from?: string;
}

export const EMAIL_JOB_NAME = "send-email" as const;

const connectionString = process.env.DATABASE_URL;

export const boss =
  connectionString && connectionString.length > 0
    ? new PgBoss({ connectionString })
    : undefined;

let started = false;

export async function initEmailQueue() {
  if (!boss || started) return;
  await boss.start();
  started = true;
}

export async function enqueueEmail(payload: EmailJobPayload) {
  if (!boss) throw new Error("pg-boss not initialised (missing DATABASE_URL?)");
  await boss.publish(EMAIL_JOB_NAME, payload);
}

export function attachEmailWorker(
  handler: (payload: EmailJobPayload) => Promise<void>,
) {
  if (!boss) return;
  boss.work<EmailJobPayload>(EMAIL_JOB_NAME, async (job: PgBoss.Job<EmailJobPayload>) => {
    await handler(job.data);
  });
}

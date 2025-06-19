import PgBoss from 'pg-boss';
import { EmailJobData } from './types';
import { sendEmailJob } from './send-email';

let boss: PgBoss | null = null;

export async function initializeEmailQueue(): Promise<PgBoss> {
  if (!boss) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required to initialize pg-boss');
    }
    
    boss = new PgBoss({
      connectionString: process.env.DATABASE_URL,
      // Schema for pg-boss tables (optional, defaults to 'pgboss')
      schema: 'pgboss',
    });

    await boss.start();

    // Set up the email worker
    await boss.work('send-email', { teamSize: 5, teamConcurrency: 2 }, async (job) => {
      console.log(`Processing email job ${job.id}`);
      await sendEmailJob(job.data as EmailJobData);
    });

    console.log('Email queue initialized');
  }

  return boss;
}

export async function addEmailJob(
  data: EmailJobData,
  options?: { delay?: number; priority?: number }
): Promise<string | null> {
  const queue = await initializeEmailQueue();
  
  return await queue.send('send-email', data, {
    startAfter: options?.delay ? new Date(Date.now() + options.delay) : undefined,
    priority: options?.priority,
  });
}

export async function getEmailQueue(): Promise<PgBoss> {
  return await initializeEmailQueue();
}

// Graceful shutdown
export async function stopEmailQueue(): Promise<void> {
  if (boss) {
    await boss.stop();
    boss = null;
  }
}
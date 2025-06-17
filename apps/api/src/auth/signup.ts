import PgBoss from "pg-boss";
import { WELCOME_EMAIL_JOB } from "../queue/welcomeEmail";

export interface SignupUser {
  id: string;
  email: string;
  firstName?: string | null;
}

/**
 * Minimal signup helper that persists a new user (mock) then enqueues a welcome_email job.
 * In production this would be wired into the real signup flow or Supabase hook.
 */
export async function handleSignup(boss: PgBoss, user: SignupUser) {
  // Persist user elsewhere – omitted (depends on actual data layer)

  // Enqueue the welcome email job
  await boss.publish(WELCOME_EMAIL_JOB, {
    userId: user.id,
    email: user.email,
    firstName: user.firstName ?? null,
  });
}

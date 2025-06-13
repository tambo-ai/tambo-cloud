import { Resend } from "resend";

/**
 * Subscribe an email address to a Resend audience.
 *
 * If either RESEND_API_KEY or RESEND_AUDIENCE_ID is missing this is a no-op.
 * The function never throws – on any error it logs and resolves, ensuring it
 * will never block a user-facing flow (TAM-183).
 *
 * @param email – The email address to subscribe.
 * @param firstName – Optional first name (sent to Resend if provided).
 * @param lastName – Optional last name (sent to Resend if provided).
 */
export async function subscribeEmailToResendAudience(
  email: string,
  firstName?: string,
  lastName?: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    console.warn(
      "[subscribeEmailToResendAudience] RESEND_API_KEY or RESEND_AUDIENCE_ID not set – skipping subscription",
    );
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const response = await resend.contacts.create({
      audienceId,
      email,
      ...(firstName ? { firstName } : {}),
      ...(lastName ? { lastName } : {}),
      unsubscribed: false,
    });

    if (response.error) {
      console.error(
        "[subscribeEmailToResendAudience] Resend API error:",
        response.error,
      );
      // We intentionally do **not** throw – failures shouldn’t block signup.
    }
  } catch (error) {
    console.error(
      "[subscribeEmailToResendAudience] Unexpected error subscribing email:",
      error,
    );
    // Never throw.
  }
}

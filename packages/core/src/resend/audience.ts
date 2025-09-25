/**
 * Minimal helpers for working with Resend Audience contacts without importing
 * the Resend SDK. We model only the parts of the response we read so callers
 * can pass the real `resend.contacts` client directly and get strong typing.
 */

export interface ResendGetContactResponseLike {
  readonly data: { readonly unsubscribed?: boolean } | null;
  readonly error?: unknown;
}

export interface ResendContactsClientLike {
  get(options: {
    audienceId: string;
    email: string;
  }): Promise<ResendGetContactResponseLike>;
}

/**
 * Best‑effort unsubscribe check using Resend `contacts.get({ audienceId, email })`.
 *
 * Behavior:
 * - Trims the email; does not change case before lookup.
 * - Returns `true` only when the API clearly indicates `unsubscribed === true`.
 * - Returns `false` on not‑found or any indeterminate condition; callers should
 *   treat this as non‑blocking.
 */
export async function isResendEmailUnsubscribed(
  contacts: ResendContactsClientLike,
  audienceId: string,
  email: string,
): Promise<boolean> {
  const trimmed = email.trim();
  if (!trimmed) return false;
  try {
    const res = await contacts.get({ audienceId, email: trimmed });
    return res.data?.unsubscribed === true;
  } catch {
    // Non‑blocking on API error or network failure
    return false;
  }
}

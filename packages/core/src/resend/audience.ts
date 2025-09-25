/**
 * Minimal helpers for working with Resend Audience contacts without depending on
 * the Resend SDK types. Accepts a "contacts"-like client with a `get` method.
 *
 * These helpers are intentionally tiny and tolerate unknown SDK response shapes
 * by using runtime guards on `unknown` instead of `any`.
 */

export interface ResendContactsClientLike {
  get(options: { audienceId: string; email: string }): Promise<unknown>;
}

/**
 * Extracts the `unsubscribed` flag from a `contacts.get(...)` result.
 * Returns `undefined` when the shape doesn't match or the value is absent.
 */
export function readUnsubscribedFlag(result: unknown): boolean | undefined {
  if (!result || typeof result !== "object") return undefined;
  const r = result as Record<string, unknown>;
  const data = (r as { data?: unknown }).data;
  if (data && typeof data === "object") {
    const unsub = (data as Record<string, unknown>)["unsubscribed"];
    if (typeof unsub === "boolean") return unsub;
  }
  return undefined;
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
    return readUnsubscribedFlag(res) === true;
  } catch {
    // Non‑blocking on API error or network failure
    return false;
  }
}

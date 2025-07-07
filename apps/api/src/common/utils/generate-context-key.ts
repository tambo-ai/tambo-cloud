/**
 * Generates a unique context key for OAuth authentication based on the original
 * issuer, hosted domain (for Google Workspace), and subject claims.
 *
 * Context key formats:
 * - Google consumer: oauth:user:accounts.google.com:${sub}
 * - Google Workspace: oauth:user:accounts.google.com:${hd}:${sub}
 * - Other providers: oauth:user:${hostname}:${sub}
 * - Legacy fallback: oauth:user:${sub}
 *
 * @param originalIssuer - The original OAuth issuer URL from the token
 * @param originalHostedDomain - Google Workspace hosted domain (hd claim)
 * @param sub - The subject (user ID) from the token
 * @returns A unique context key string
 */
export function generateContextKey(
  originalIssuer: unknown,
  originalHostedDomain: unknown,
  sub: string,
): string {
  // Fallback to legacy format if original_iss is not available or invalid
  if (!originalIssuer || typeof originalIssuer !== "string") {
    return `oauth:user:${sub}`;
  }

  // Extract hostname from issuer URL
  let issuerHostname: string;
  try {
    issuerHostname = new URL(originalIssuer).hostname;
  } catch {
    // Fallback to legacy format if URL parsing fails
    return `oauth:user:${sub}`;
  }

  // Handle Google Workspace vs consumer accounts
  if (
    issuerHostname === "accounts.google.com" &&
    originalHostedDomain &&
    typeof originalHostedDomain === "string"
  ) {
    // Google Workspace account: include hosted domain to distinguish from consumer accounts
    // and to distinguish between different workspace domains
    return `oauth:user:${issuerHostname}:${originalHostedDomain}:${sub}`;
  }

  // Regular provider (including Google consumer accounts)
  return `oauth:user:${issuerHostname}:${sub}`;
}

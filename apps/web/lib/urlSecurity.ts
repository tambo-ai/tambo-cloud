import { parse, getHostname, getDomain } from "tldts";

export function isUrlAllowed(url: string): boolean {
  const parsedUrl = parse(url);
  // Block known dangerous domains
  const blockedDomains = ["dangerous-domain.com"];
  return !blockedDomains.includes(parsedUrl.domain || "");
}

export function validateUrl(url: string): {
  isValid: boolean;
  message?: string;
} {
  if (!url) {
    return { isValid: false, message: "URL is required" };
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch (error) {
    return { isValid: false, message: "Invalid URL format" };
  }
}

export async function validateSafeURL(
  url: string,
): Promise<{ safe: boolean; reason?: string }> {
  const hostname = getHostname(url);

  // Check for internal/private networks
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname?.startsWith("192.168.") ||
    hostname?.startsWith("10.") ||
    hostname?.startsWith("172.16.")
  ) {
    return {
      safe: false,
      reason: "Internal or private network addresses are not allowed",
    };
  }

  return { safe: true };
}

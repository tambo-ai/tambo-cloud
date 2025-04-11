// This is a temporary mock file to make the build pass
// It will be replaced with the actual implementation later

export function isUrlAllowed(url: string): boolean {
  // Simple mock implementation
  return !url.includes("dangerous-domain.com");
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
  // Mock implementation for the build
  return {
    safe:
      !url.includes("localhost") &&
      !url.includes("127.0.0.1") &&
      !url.includes("192.168.") &&
      !url.includes("10.") &&
      !url.includes("172.16."),
  };
}

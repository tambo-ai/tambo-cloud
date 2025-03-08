/**
 * Time in seconds before the window auto-closes after API key generation
 */
export const AUTO_CLOSE_DELAY = 30;

/**
 * Prefix for CLI-generated API keys
 */
export const CLI_KEY_PREFIX = "CLI Key";

/**
 * Maximum retries for API calls
 */
export const MAX_API_RETRIES = 3;

/**
 * Maximum delay (in ms) between retries
 */
export const MAX_RETRY_DELAY = 30000;

/**
 * Error messages used throughout the application
 */
export const ERROR_MESSAGES = {
  AUTH: "Failed to authenticate. Please try again.",
  PROJECT_CREATE: "Failed to create project. Please try again.",
  API_KEY_GENERATE: "Failed to generate API key. Please try again.",
  API_KEY_DELETE: "Failed to delete API key. Please try again.",
  LOGOUT: "Failed to sign out. Please try again.",
  WINDOW_CLOSE:
    "Unable to close window automatically. Please close it manually.",
} as const;

/**
 * Query configuration
 */
export const QUERY_CONFIG = {
  refetchOnWindowFocus: true,
  retry: MAX_API_RETRIES,
  retryDelay: (attemptIndex: number) =>
    Math.min(1000 * 2 ** attemptIndex, MAX_RETRY_DELAY),
} as const;

/**
 * Throttles a function to be called at most once every `updateIntervalMs` milliseconds.
 * @param callback - The function to throttle.
 * @param updateIntervalMs - The minimum time between function calls.
 * @returns A throttled function that will call the original function at most once every `updateIntervalMs` milliseconds.
 */
export function throttle<T extends never[], R>(
  callback: (...args: T) => Promise<R>,
  updateIntervalMs: number,
): (...args: T) => Promise<R | undefined> {
  let lastUpdateTime = 0;
  return async (...args: T): Promise<R | undefined> => {
    const currentTime = Date.now();
    if (currentTime - lastUpdateTime >= updateIntervalMs) {
      const result = await callback(...args);
      lastUpdateTime = currentTime;
      return result;
    }
  };
}

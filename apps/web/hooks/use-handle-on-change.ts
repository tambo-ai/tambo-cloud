import { useEffect, useRef } from "react";

/**
 * Custom hook that executes a callback when a value changes.
 * Tracks the previous value internally to prevent duplicate calls.
 *
 * @param value - The value to watch for changes
 * @param callback - The callback to execute when the value changes (and is not undefined)
 * @param resetWhen - Optional value that, when truthy, resets the internal tracking (useful for dialog close states)
 *
 * @example
 * ```tsx
 * const [deleteKeyId, setDeleteKeyId] = useState<string>();
 *
 * useHandleOnChange(deleteKeyId, (id) => {
 *   setAlertState({
 *     show: true,
 *     title: "Delete API Key",
 *     description: "Are you sure?",
 *     data: { id },
 *   });
 * });
 * ```
 */
export function useHandleOnChange<T>(
  value: T | undefined,
  callback: (value: T) => void,
  resetWhen?: boolean,
) {
  const lastValueRef = useRef<T | undefined>();

  useEffect(() => {
    if (value !== undefined && value !== lastValueRef.current) {
      lastValueRef.current = value;
      callback(value);
    }
  }, [value, callback]);

  useEffect(() => {
    if (resetWhen) {
      lastValueRef.current = undefined;
    }
  }, [resetWhen]);
}

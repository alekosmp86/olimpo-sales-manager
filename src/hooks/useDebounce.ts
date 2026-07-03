import { useState, useEffect } from "react";

/**
 * Returns a debounced version of `value` that updates only after
 * `delay` ms have passed without a new value arriving.
 * The pending timer is cancelled on unmount automatically.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

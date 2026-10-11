import { useState, useEffect } from 'react';

/**
 * Custom hook that debounces a rapidly changing value (such as search input or slider state)
 * to prevent unnecessary re-renders and expensive recalculations.
 *
 * @param value The value to debounce
 * @param delayMs Debounce delay in milliseconds (default: 200ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delayMs: number = 200): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

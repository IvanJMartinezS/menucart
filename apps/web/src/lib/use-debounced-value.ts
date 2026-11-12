import { useEffect, useState } from 'react'

/**
 * Returns `value` only after it has stopped changing for `delay` milliseconds.
 * Used to ask the API for suggestions once the user pauses typing, not on every key.
 */
export function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timeout)
  }, [value, delay])

  return debounced
}

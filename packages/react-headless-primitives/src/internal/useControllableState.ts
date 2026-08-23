import { useCallback, useEffect, useRef, useState } from "react";

export interface UseControllableStateParams<T> {
  /** When provided, the state is controlled by the caller. */
  prop?: T;
  defaultProp: T;
  onChange?: (state: T) => void;
}

/**
 * The mechanism behind every controlled/uncontrolled prop pair in this
 * library (`open`/`defaultOpen`/`onOpenChange`, `value`/`defaultValue`/
 * `onValueChange`, ...). Falls back to internal state when `prop` is
 * `undefined`; otherwise `prop` always wins.
 */
export function useControllableState<T>({
  prop,
  defaultProp,
  onChange,
}: UseControllableStateParams<T>): [T, (next: T | ((prev: T) => T)) => void] {
  const [uncontrolledValue, setUncontrolledValue] = useState<T>(defaultProp);
  const isControlled = prop !== undefined;
  const value = isControlled ? (prop as T) : uncontrolledValue;

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const setValue = useCallback(
    (nextValue: T | ((prev: T) => T)) => {
      setUncontrolledValue((prevValue) => {
        const current = isControlled ? (prop as T) : prevValue;
        const next =
          typeof nextValue === "function"
            ? (nextValue as (prev: T) => T)(current)
            : nextValue;
        if (next !== current) {
          onChangeRef.current?.(next);
        }
        return next;
      });
    },
    [isControlled, prop],
  );

  return [value, setValue];
}

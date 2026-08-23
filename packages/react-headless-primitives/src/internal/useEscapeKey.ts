import { useEffect, useRef } from "react";

/**
 * Calls `handler` with the keyboard event when Escape is pressed while
 * `active`. Kept as a ref internally so callers can pass an inline
 * function without re-subscribing the listener every render.
 */
export function useEscapeKey(
  handler: (event: KeyboardEvent) => void,
  active = true,
) {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!active) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handlerRef.current(event);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active]);
}

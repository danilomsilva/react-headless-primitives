import { useEffect } from "react";

/** Locks page scroll (`document.body` overflow) for as long as `active`. */
export function useScrollLock(active = true) {
  useEffect(() => {
    if (!active) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);
}

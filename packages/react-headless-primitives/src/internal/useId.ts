import { useId as useReactId } from "react";

/**
 * Wraps React's built-in `useId`, letting a caller-supplied id override
 * the generated one — used to derive the aria id pairs (`-title`,
 * `-description`, ...) each component instance needs.
 */
export function useId(providedId?: string): string {
  const generatedId = useReactId();
  return providedId ?? generatedId;
}

import * as React from "react";
import { createPortal } from "react-dom";

export interface PortalProps {
  /** Defaults to `document.body`. */
  container?: HTMLElement | null;
  children?: React.ReactNode;
}

/**
 * Renders `children` into a different part of the DOM. Waits for mount
 * before portaling so it's safe to import in SSR environments, where
 * `document` isn't available during the initial render.
 */
const emptySubscribe = () => () => {};

/** True once mounted on the client; false during SSR and the initial hydration pass. */
function useIsMounted(): boolean {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function Portal({ container, children }: PortalProps) {
  const mounted = useIsMounted();

  if (!mounted) return null;

  const target = container ?? document.body;
  return createPortal(children, target);
}

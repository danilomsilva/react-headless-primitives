import * as React from "react";
import { Slot } from "../../internal/Slot";
import { Portal, type PortalProps } from "../../internal/Portal";
import { composeEventHandlers } from "../../internal/composeEventHandlers";
import { useControllableState } from "../../internal/useControllableState";

let toastIdCounter = 0;
function generateToastId(): string {
  toastIdCounter += 1;
  return `toast-${toastIdCounter}`;
}

export interface ToastData {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  /** Milliseconds before auto-dismiss. `Infinity` disables it. Defaults to 5000. */
  duration?: number;
  /** `"polite"` (role="status", default) or `"assertive"` (role="alert"). */
  priority?: "polite" | "assertive";
}

interface ToastContextValue {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, "id"> & { id?: string }) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export interface ToastProviderProps {
  toasts?: ToastData[];
  onToastsChange?: (toasts: ToastData[]) => void;
  children?: React.ReactNode;
}

function ToastProvider({
  toasts: toastsProp,
  onToastsChange,
  children,
}: ToastProviderProps) {
  const [toasts, setToasts] = useControllableState<ToastData[]>({
    prop: toastsProp,
    defaultProp: [],
    onChange: onToastsChange,
  });

  const addToast = React.useCallback(
    (toast: Omit<ToastData, "id"> & { id?: string }) => {
      const id = toast.id ?? generateToastId();
      setToasts((current) => [...current, { duration: 5000, ...toast, id }]);
      return id;
    },
    [setToasts],
  );

  const dismissToast = React.useCallback(
    (id: string) => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    },
    [setToasts],
  );

  const value = React.useMemo(
    () => ({ toasts, addToast, dismissToast }),
    [toasts, addToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

/**
 * The imperative queue API: `toast(...)` enqueues, `dismiss(id)` removes,
 * `toasts` is the current queue for rendering. Must be called under
 * `Toast.Provider`.
 */
export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within Toast.Provider");
  }
  return {
    toasts: context.toasts,
    toast: context.addToast,
    dismiss: context.dismissToast,
  };
}

export interface ToastViewportProps extends React.HTMLAttributes<HTMLDivElement> {
  container?: PortalProps["container"];
}

// A `<div>`, not a list: `role="region"`/`role="status"`/`role="alert"`
// aren't in the ARIA-in-HTML allowed-roles list for `<ol>`/`<li>`.
const ToastViewport = React.forwardRef<HTMLDivElement, ToastViewportProps>(
  function ToastViewport(
    { container, children, "aria-label": ariaLabel, ...props },
    forwardedRef,
  ) {
    return (
      <Portal container={container}>
        <div
          {...props}
          ref={forwardedRef}
          role="region"
          aria-label={ariaLabel ?? "Notifications"}
        >
          {children}
        </div>
      </Portal>
    );
  },
);

export interface ToastRootProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  toast: ToastData;
  onDismiss: () => void;
}

const ToastRoot = React.forwardRef<HTMLDivElement, ToastRootProps>(
  function ToastRoot(
    {
      asChild = false,
      toast,
      onDismiss,
      onPointerEnter,
      onPointerLeave,
      onFocus,
      onBlur,
      children,
      ...props
    },
    forwardedRef,
  ) {
    const [paused, setPaused] = React.useState(false);
    const onDismissRef = React.useRef(onDismiss);
    React.useEffect(() => {
      onDismissRef.current = onDismiss;
    });

    React.useEffect(() => {
      if (paused) return;
      const duration = toast.duration ?? 5000;
      if (!Number.isFinite(duration)) return;
      const timer = window.setTimeout(() => onDismissRef.current(), duration);
      return () => window.clearTimeout(timer);
    }, [paused, toast.duration]);

    const Comp = asChild ? Slot : "div";

    return (
      <Comp
        {...props}
        ref={forwardedRef}
        role={toast.priority === "assertive" ? "alert" : "status"}
        data-state="open"
        onPointerEnter={composeEventHandlers(onPointerEnter, () =>
          setPaused(true),
        )}
        onPointerLeave={composeEventHandlers(onPointerLeave, () =>
          setPaused(false),
        )}
        onFocus={composeEventHandlers(onFocus, () => setPaused(true))}
        onBlur={composeEventHandlers(onBlur, () => setPaused(false))}
      >
        {children}
      </Comp>
    );
  },
);

export const Toast = {
  Provider: ToastProvider,
  Viewport: ToastViewport,
  Root: ToastRoot,
};

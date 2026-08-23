import { Toast, useToast } from "react-headless-primitives";

export function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <Toast.Viewport className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((toast) => (
        <Toast.Root
          key={toast.id}
          toast={toast}
          onDismiss={() => dismiss(toast.id)}
          className="flex items-center justify-between gap-3 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg"
        >
          <span>{toast.title}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => dismiss(toast.id)}
            className="text-white/70 hover:text-white"
          >
            &times;
          </button>
        </Toast.Root>
      ))}
    </Toast.Viewport>
  );
}

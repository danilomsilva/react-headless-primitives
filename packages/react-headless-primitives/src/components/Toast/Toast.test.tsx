import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Toast, useToast } from "./Toast";

function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <Toast.Viewport>
      {toasts.map((toast) => (
        <Toast.Root
          key={toast.id}
          toast={toast}
          onDismiss={() => dismiss(toast.id)}
        >
          {toast.title}
          <button type="button" onClick={() => dismiss(toast.id)}>
            Dismiss
          </button>
        </Toast.Root>
      ))}
    </Toast.Viewport>
  );
}

function AddToastButton({ label = "Notify" }: { label?: string }) {
  const { toast } = useToast();
  return (
    <button type="button" onClick={() => toast({ title: `${label} message` })}>
      {label}
    </button>
  );
}

describe("useToast", () => {
  it("throws when used outside Toast.Provider", () => {
    const { result } = renderHook(() => {
      try {
        return useToast();
      } catch (error) {
        return error;
      }
    });
    expect(result.current).toBeInstanceOf(Error);
  });
});

describe("Toast", () => {
  it("enqueues a toast via toast() and renders it in the viewport", async () => {
    const user = userEvent.setup();
    render(
      <Toast.Provider>
        <AddToastButton />
        <Toaster />
      </Toast.Provider>,
    );

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Notify" }));
    expect(screen.getByRole("status")).toHaveTextContent("Notify message");
  });

  it("dismisses a toast when dismiss() is called", async () => {
    const user = userEvent.setup();
    render(
      <Toast.Provider>
        <AddToastButton />
        <Toaster />
      </Toast.Provider>,
    );

    await user.click(screen.getByRole("button", { name: "Notify" }));
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("supports multiple simultaneous toasts", async () => {
    const user = userEvent.setup();
    render(
      <Toast.Provider>
        <AddToastButton label="First" />
        <AddToastButton label="Second" />
        <Toaster />
      </Toast.Provider>,
    );

    await user.click(screen.getByRole("button", { name: "First" }));
    await user.click(screen.getByRole("button", { name: "Second" }));
    expect(screen.getAllByRole("status")).toHaveLength(2);
  });

  it("uses role=alert for assertive-priority toasts", async () => {
    function AssertiveButton() {
      const { toast } = useToast();
      return (
        <button
          type="button"
          onClick={() => toast({ title: "Urgent", priority: "assertive" })}
        >
          Notify urgent
        </button>
      );
    }
    const user = userEvent.setup();
    render(
      <Toast.Provider>
        <AssertiveButton />
        <Toaster />
      </Toast.Provider>,
    );
    await user.click(screen.getByRole("button", { name: "Notify urgent" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Urgent");
  });

  describe("auto-dismiss", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("auto-dismisses after the toast's duration", () => {
      function ShortToastButton() {
        const { toast } = useToast();
        return (
          <button
            type="button"
            onClick={() => toast({ title: "Short-lived", duration: 1000 })}
          >
            Notify
          </button>
        );
      }

      render(
        <Toast.Provider>
          <ShortToastButton />
          <Toaster />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Notify" }));
      expect(screen.getByRole("status")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("pauses auto-dismiss while hovered, and resumes after", () => {
      function ShortToastButton() {
        const { toast } = useToast();
        return (
          <button
            type="button"
            onClick={() => toast({ title: "Short-lived", duration: 1000 })}
          >
            Notify
          </button>
        );
      }

      render(
        <Toast.Provider>
          <ShortToastButton />
          <Toaster />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Notify" }));
      const toast = screen.getByRole("status");

      fireEvent.pointerEnter(toast);
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.getByRole("status")).toBeInTheDocument();

      fireEvent.pointerLeave(toast);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("does not auto-dismiss when duration is Infinity", () => {
      function PersistentToastButton() {
        const { toast } = useToast();
        return (
          <button
            type="button"
            onClick={() => toast({ title: "Persistent", duration: Infinity })}
          >
            Notify
          </button>
        );
      }

      render(
        <Toast.Provider>
          <PersistentToastButton />
          <Toaster />
        </Toast.Provider>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Notify" }));
      act(() => {
        vi.advanceTimersByTime(60_000);
      });
      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });

  it("supports controlled toasts", () => {
    const onToastsChange = vi.fn();
    const toasts = [{ id: "1", title: "Controlled toast" }];
    render(
      <Toast.Provider toasts={toasts} onToastsChange={onToastsChange}>
        <Toaster />
      </Toast.Provider>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Controlled toast");
  });

  it("has no axe violations with an active toast", async () => {
    const user = userEvent.setup();
    const { baseElement } = render(
      <Toast.Provider>
        <AddToastButton />
        <Toaster />
      </Toast.Provider>,
    );
    await user.click(screen.getByRole("button", { name: "Notify" }));
    expect(await axe(baseElement)).toHaveNoViolations();
  });
});

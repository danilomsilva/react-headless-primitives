import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Toast, useToast, type ToastData } from "./Toast";

// This library ships zero CSS — these rules exist only to make the toast
// queue legible inside Storybook, they are not part of the library itself.
const demoStyles = `
  [role="region"] {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: min(90vw, 320px);
  }
  [role="status"], [role="alert"] {
    background: #111827;
    color: white;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }
  [role="alert"] { background: #b91c1c; }
  .toast-dismiss {
    background: transparent;
    color: inherit;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
  }
  .notify-button {
    font: inherit;
    border-radius: 6px;
    padding: 0.5em 1em;
    border: 1px solid #8884;
    cursor: pointer;
  }
`;

function Toaster({ label }: { label?: string }) {
  const { toasts, dismiss } = useToast();
  return (
    <Toast.Viewport aria-label={label}>
      {toasts.map((toast) => (
        <Toast.Root
          key={toast.id}
          toast={toast}
          onDismiss={() => dismiss(toast.id)}
        >
          <span>{toast.title}</span>
          <button
            type="button"
            className="toast-dismiss"
            aria-label="Dismiss notification"
            onClick={() => dismiss(toast.id)}
          >
            &times;
          </button>
        </Toast.Root>
      ))}
    </Toast.Viewport>
  );
}

function NotifyButton({
  label = "Show toast",
  toast: toastOptions,
}: {
  label?: string;
  toast?: Omit<ToastData, "id">;
}) {
  const { toast } = useToast();
  return (
    <button
      type="button"
      className="notify-button"
      onClick={() => toast({ title: "Saved successfully", ...toastOptions })}
    >
      {label}
    </button>
  );
}

const meta: Meta<typeof Toast.Provider> = {
  title: "Components/Toast",
  component: Toast.Provider,
  decorators: [
    (Story) => (
      <>
        <style>{demoStyles}</style>
        <Story />
      </>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof Toast.Provider>;

export const Default: Story = {
  render: () => (
    <Toast.Provider>
      <NotifyButton />
      <Toaster />
    </Toast.Provider>
  ),
};

export const Variants: Story = {
  name: "Variants (queue, priority, controlled)",
  render: function VariantsDemo() {
    const [controlledToasts, setControlledToasts] = useState<ToastData[]>([]);
    return (
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <Toast.Provider>
          <NotifyButton label="Polite toast" />
          <NotifyButton
            label="Assertive toast"
            toast={{ title: "Something went wrong", priority: "assertive" }}
          />
          <NotifyButton label="Show another toast" />
          <Toaster label="Uncontrolled notifications" />
        </Toast.Provider>

        <Toast.Provider
          toasts={controlledToasts}
          onToastsChange={setControlledToasts}
        >
          <button
            type="button"
            className="notify-button"
            onClick={() =>
              setControlledToasts((current) => [
                ...current,
                { id: `c-${current.length}`, title: "Controlled toast" },
              ])
            }
          >
            Controlled toast
          </button>
          <Toaster label="Controlled notifications" />
        </Toast.Provider>
      </div>
    );
  },
};

export const Keyboard: Story = {
  name: "Keyboard (dismiss button is focusable)",
  render: () => (
    <Toast.Provider>
      <NotifyButton />
      <Toaster />
    </Toast.Provider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Show toast" }));

    const body = within(canvasElement.ownerDocument.body);
    const dismissButton = await body.findByRole("button", {
      name: "Dismiss notification",
    });

    dismissButton.focus();
    await expect(dismissButton).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() =>
      expect(body.queryByRole("status")).not.toBeInTheDocument(),
    );
  },
};

export const Accessibility: Story = {
  name: "Accessibility (live region roles)",
  render: () => (
    <Toast.Provider>
      <NotifyButton label="Polite toast" />
      <NotifyButton
        label="Assertive toast"
        toast={{ title: "Something went wrong", priority: "assertive" }}
      />
      <Toaster />
    </Toast.Provider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole("button", { name: "Polite toast" }));
    await expect(await body.findByRole("status")).toBeInTheDocument();

    await userEvent.click(
      canvas.getByRole("button", { name: "Assertive toast" }),
    );
    await expect(await body.findByRole("alert")).toBeInTheDocument();

    await expect(
      body.getByRole("region", { name: "Notifications" }),
    ).toBeInTheDocument();
  },
};

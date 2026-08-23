import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Dialog } from "./Dialog";

// This library ships zero CSS — these rules exist only to make the dialog
// legible inside Storybook, they are not part of the library itself.
const demoStyles = `
  [data-testid="overlay"] {
    position: fixed;
    inset: 0;
    background: rgb(0 0 0 / 0.5);
  }
  [role="dialog"] {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    color: #111827;
    padding: 1.5rem;
    border-radius: 8px;
    width: min(90vw, 360px);
  }
  [role="dialog"] h2 { margin: 0 0 0.5rem; }
  [role="dialog"] p { margin: 0 0 1rem; color: #4b5563; }
  .dialog-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
  .dialog-actions button {
    font: inherit;
    border-radius: 6px;
    padding: 0.4em 0.9em;
    border: 1px solid #8884;
    cursor: pointer;
  }
`;

const meta: Meta<typeof Dialog.Root> = {
  title: "Components/Dialog",
  component: Dialog.Root,
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

type Story = StoryObj<typeof Dialog.Root>;

export const Default: Story = {
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger>Delete item</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay data-testid="overlay" />
        <Dialog.Content>
          <Dialog.Title>Delete item</Dialog.Title>
          <Dialog.Description>This action cannot be undone.</Dialog.Description>
          <div className="dialog-actions">
            <Dialog.Close>Cancel</Dialog.Close>
            <button type="button">Confirm</button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  ),
};

export const Variants: Story = {
  name: "Variants (controlled vs. uncontrolled)",
  render: function ControlledAndUncontrolled() {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <Dialog.Root>
          <Dialog.Trigger>Uncontrolled dialog</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay data-testid="overlay" />
            <Dialog.Content>
              <Dialog.Title>Uncontrolled</Dialog.Title>
              <Dialog.Description>
                Manages its own open state internally via `defaultOpen`.
              </Dialog.Description>
              <div className="dialog-actions">
                <Dialog.Close>Close</Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger>Controlled dialog</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay data-testid="overlay" />
            <Dialog.Content>
              <Dialog.Title>Controlled</Dialog.Title>
              <Dialog.Description>
                Open state is owned by the parent via `open`/`onOpenChange`.
              </Dialog.Description>
              <div className="dialog-actions">
                <Dialog.Close>Close</Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    );
  },
};

export const Keyboard: Story = {
  name: "Keyboard (Escape closes, focus is trapped)",
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger>Open dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay data-testid="overlay" />
        <Dialog.Content>
          <Dialog.Title>Keyboard demo</Dialog.Title>
          <Dialog.Description>
            Tab cycles between Confirm and Cancel only; Escape closes.
          </Dialog.Description>
          <div className="dialog-actions">
            <Dialog.Close>Cancel</Dialog.Close>
            <button type="button">Confirm</button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Open dialog" });
    await userEvent.click(trigger);

    const body = within(canvasElement.ownerDocument.body);
    const cancel = await body.findByRole("button", { name: "Cancel" });
    const confirm = body.getByRole("button", { name: "Confirm" });
    // Cancel is first in DOM order, so it receives the initial trap focus.
    await waitFor(() => expect(cancel).toHaveFocus());

    await userEvent.tab();
    await expect(confirm).toHaveFocus();
    await userEvent.tab();
    await expect(cancel).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(body.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await expect(trigger).toHaveFocus();
  },
};

export const Accessibility: Story = {
  name: "Accessibility (labelled dialog, no axe violations)",
  render: () => (
    <Dialog.Root defaultOpen>
      <Dialog.Trigger>Open dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay data-testid="overlay" />
        <Dialog.Content>
          <Dialog.Title>Accessible by default</Dialog.Title>
          <Dialog.Description>
            `role=&quot;dialog&quot;`, `aria-modal`, `aria-labelledby` and
            `aria-describedby` are wired automatically from Title/Description.
          </Dialog.Description>
          <div className="dialog-actions">
            <Dialog.Close>Close</Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const dialog = await body.findByRole("dialog", {
      name: "Accessible by default",
    });
    await expect(dialog).toHaveAccessibleDescription(/wired automatically/);
  },
};

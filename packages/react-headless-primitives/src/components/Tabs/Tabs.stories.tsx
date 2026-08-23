import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Tabs } from "./Tabs";

// This library ships zero CSS — these rules exist only to make the tabs
// legible inside Storybook, they are not part of the library itself.
const demoStyles = `
  [role="tablist"] { display: flex; gap: 0.25rem; border-bottom: 1px solid #8884; }
  [role="tablist"][aria-orientation="vertical"] { flex-direction: column; border-bottom: none; border-right: 1px solid #8884; width: fit-content; }
  [role="tab"] {
    font: inherit;
    background: transparent;
    border: none;
    padding: 0.5em 1em;
    cursor: pointer;
    border-bottom: 2px solid transparent;
  }
  [role="tab"][aria-selected="true"] { border-bottom-color: #4338ca; font-weight: 600; }
  [role="tab"][disabled] { opacity: 0.4; cursor: not-allowed; }
  [role="tabpanel"] { padding: 1rem 0; }
`;

const meta: Meta<typeof Tabs.Root> = {
  title: "Components/Tabs",
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

type Story = StoryObj<typeof Tabs.Root>;

export const Default: Story = {
  render: () => (
    <Tabs.Root defaultValue="profile">
      <Tabs.List aria-label="Account settings">
        <Tabs.Trigger value="profile">Profile</Tabs.Trigger>
        <Tabs.Trigger value="account">Account</Tabs.Trigger>
        <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="profile">Profile settings go here.</Tabs.Content>
      <Tabs.Content value="account">Account settings go here.</Tabs.Content>
      <Tabs.Content value="billing">Billing settings go here.</Tabs.Content>
    </Tabs.Root>
  ),
};

export const Variants: Story = {
  name: "Variants (vertical, disabled tab, lazy vs. eager panels)",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <Tabs.Root defaultValue="profile" orientation="vertical">
        <Tabs.List aria-label="Vertical settings">
          <Tabs.Trigger value="profile">Profile</Tabs.Trigger>
          <Tabs.Trigger value="account">Account</Tabs.Trigger>
          <Tabs.Trigger value="billing" disabled>
            Billing (disabled)
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="profile">Profile settings.</Tabs.Content>
        <Tabs.Content value="account">Account settings.</Tabs.Content>
        <Tabs.Content value="billing">Billing settings.</Tabs.Content>
      </Tabs.Root>

      <Tabs.Root defaultValue="lazy">
        <Tabs.List aria-label="Mount strategy">
          <Tabs.Trigger value="lazy">Lazy</Tabs.Trigger>
          <Tabs.Trigger value="eager">Eager (forceMount)</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="lazy">
          Only mounted once this tab is first activated.
        </Tabs.Content>
        <Tabs.Content value="eager" forceMount>
          Always mounted in the DOM, hidden via the `hidden` attribute while
          inactive.
        </Tabs.Content>
      </Tabs.Root>
    </div>
  ),
};

export const Keyboard: Story = {
  name: "Keyboard (arrow keys, Home/End, roving tabindex)",
  render: () => (
    <Tabs.Root defaultValue="profile">
      <Tabs.List aria-label="Account settings">
        <Tabs.Trigger value="profile">Profile</Tabs.Trigger>
        <Tabs.Trigger value="account">Account</Tabs.Trigger>
        <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="profile">Profile settings go here.</Tabs.Content>
      <Tabs.Content value="account">Account settings go here.</Tabs.Content>
      <Tabs.Content value="billing">Billing settings go here.</Tabs.Content>
    </Tabs.Root>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const profile = canvas.getByRole("tab", { name: "Profile" });
    const account = canvas.getByRole("tab", { name: "Account" });
    const billing = canvas.getByRole("tab", { name: "Billing" });

    profile.focus();
    await expect(profile).toHaveAttribute("tabindex", "0");
    await expect(account).toHaveAttribute("tabindex", "-1");

    await userEvent.keyboard("{ArrowRight}");
    await expect(account).toHaveFocus();
    await expect(
      canvas.getByText("Account settings go here."),
    ).toBeInTheDocument();

    await userEvent.keyboard("{End}");
    await expect(billing).toHaveFocus();
    await expect(billing).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{Home}");
    await expect(profile).toHaveFocus();
  },
};

export const Accessibility: Story = {
  name: "Accessibility (tab/tabpanel wiring, no axe violations)",
  render: () => (
    <Tabs.Root defaultValue="profile">
      <Tabs.List aria-label="Account settings">
        <Tabs.Trigger value="profile">Profile</Tabs.Trigger>
        <Tabs.Trigger value="account">Account</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="profile">Profile settings go here.</Tabs.Content>
      <Tabs.Content value="account">Account settings go here.</Tabs.Content>
    </Tabs.Root>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const profile = canvas.getByRole("tab", { name: "Profile" });
    const panel = canvas.getByRole("tabpanel");

    await expect(panel).toHaveAttribute("aria-labelledby", profile.id);
    await expect(profile).toHaveAttribute("aria-controls", panel.id);
    await expect(
      canvas.getByRole("tablist", { name: "Account settings" }),
    ).toBeInTheDocument();
  },
};

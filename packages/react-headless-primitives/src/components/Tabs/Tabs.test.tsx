import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Tabs } from "./Tabs";

function BasicTabs(props: Partial<ComponentProps<typeof Tabs.Root>> = {}) {
  return (
    <Tabs.Root defaultValue="profile" {...props}>
      <Tabs.List aria-label="Account settings">
        <Tabs.Trigger value="profile">Profile</Tabs.Trigger>
        <Tabs.Trigger value="account">Account</Tabs.Trigger>
        <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="profile">Profile settings</Tabs.Content>
      <Tabs.Content value="account">Account settings</Tabs.Content>
      <Tabs.Content value="billing">Billing settings</Tabs.Content>
    </Tabs.Root>
  );
}

describe("Tabs", () => {
  it("shows the default tab's content and hides the rest from the DOM", () => {
    render(<BasicTabs />);
    expect(screen.getByText("Profile settings")).toBeInTheDocument();
    expect(screen.queryByText("Account settings")).not.toBeInTheDocument();
    expect(screen.queryByText("Billing settings")).not.toBeInTheDocument();
  });

  it("switches tabs on click", async () => {
    const user = userEvent.setup();
    render(<BasicTabs />);
    await user.click(screen.getByRole("tab", { name: "Account" }));
    expect(screen.getByText("Account settings")).toBeInTheDocument();
    expect(screen.queryByText("Profile settings")).not.toBeInTheDocument();
  });

  it("wires aria-selected, aria-controls and roving tabindex", () => {
    render(<BasicTabs />);
    const profile = screen.getByRole("tab", { name: "Profile" });
    const account = screen.getByRole("tab", { name: "Account" });

    expect(profile).toHaveAttribute("aria-selected", "true");
    expect(profile).toHaveAttribute("tabindex", "0");
    expect(account).toHaveAttribute("aria-selected", "false");
    expect(account).toHaveAttribute("tabindex", "-1");

    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAttribute("aria-labelledby", profile.id);
    expect(profile).toHaveAttribute("aria-controls", panel.id);
  });

  it("navigates with ArrowRight/ArrowLeft and wraps around", async () => {
    const user = userEvent.setup();
    render(<BasicTabs />);
    const profile = screen.getByRole("tab", { name: "Profile" });
    const account = screen.getByRole("tab", { name: "Account" });
    const billing = screen.getByRole("tab", { name: "Billing" });

    profile.focus();
    await user.keyboard("{ArrowRight}");
    expect(account).toHaveFocus();
    expect(account).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowRight}");
    expect(billing).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(profile).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(billing).toHaveFocus();
  });

  it("jumps to the first/last tab with Home/End", async () => {
    const user = userEvent.setup();
    render(<BasicTabs />);
    const profile = screen.getByRole("tab", { name: "Profile" });
    const billing = screen.getByRole("tab", { name: "Billing" });

    profile.focus();
    await user.keyboard("{End}");
    expect(billing).toHaveFocus();
    expect(billing).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Home}");
    expect(profile).toHaveFocus();
  });

  it("uses ArrowUp/ArrowDown when orientation is vertical", async () => {
    const user = userEvent.setup();
    render(<BasicTabs orientation="vertical" />);
    const profile = screen.getByRole("tab", { name: "Profile" });
    const account = screen.getByRole("tab", { name: "Account" });

    profile.focus();
    await user.keyboard("{ArrowDown}");
    expect(account).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(profile).toHaveFocus();
  });

  it("keeps inactive content mounted and hidden with forceMount", async () => {
    const user = userEvent.setup();
    render(
      <Tabs.Root defaultValue="profile">
        <Tabs.List aria-label="Account settings">
          <Tabs.Trigger value="profile">Profile</Tabs.Trigger>
          <Tabs.Trigger value="account">Account</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="profile" forceMount>
          Profile settings
        </Tabs.Content>
        <Tabs.Content value="account" forceMount>
          Account settings
        </Tabs.Content>
      </Tabs.Root>,
    );

    const accountPanel = screen.getByText("Account settings");
    expect(accountPanel).toBeInTheDocument();
    expect(accountPanel).not.toBeVisible();

    await user.click(screen.getByRole("tab", { name: "Account" }));
    expect(accountPanel).toBeVisible();
  });

  it("supports controlled value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(
      <BasicTabs value="profile" onValueChange={onValueChange} />,
    );

    await user.click(screen.getByRole("tab", { name: "Billing" }));
    expect(onValueChange).toHaveBeenCalledWith("billing");
    expect(screen.getByText("Profile settings")).toBeInTheDocument();

    rerender(<BasicTabs value="billing" onValueChange={onValueChange} />);
    expect(screen.getByText("Billing settings")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<BasicTabs />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import {
  Accordion,
  type AccordionMultipleProps,
  type AccordionSingleProps,
} from "./Accordion";

function Item({
  value,
  title,
  disabled,
}: {
  value: string;
  title: string;
  disabled?: boolean;
}) {
  return (
    <Accordion.Item value={value} disabled={disabled}>
      <Accordion.Header>
        <Accordion.Trigger>{title}</Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content>{title} content</Accordion.Content>
    </Accordion.Item>
  );
}

function SingleAccordion(
  props: Partial<Omit<AccordionSingleProps, "type">> = {},
) {
  return (
    <Accordion.Root type="single" {...props}>
      <Item value="a" title="Section A" />
      <Item value="b" title="Section B" />
      <Item value="c" title="Section C" />
    </Accordion.Root>
  );
}

describe("Accordion (single)", () => {
  it("opens an item on click and hides its content otherwise", async () => {
    const user = userEvent.setup();
    render(<SingleAccordion />);

    expect(screen.queryByText("Section A content")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Section A" }));
    expect(screen.getByText("Section A content")).toBeVisible();
  });

  it("closes the previously open item when another opens", async () => {
    const user = userEvent.setup();
    render(<SingleAccordion />);

    await user.click(screen.getByRole("button", { name: "Section A" }));
    await user.click(screen.getByRole("button", { name: "Section B" }));

    expect(screen.queryByText("Section A content")).not.toBeInTheDocument();
    expect(screen.getByText("Section B content")).toBeVisible();
  });

  it("does not close the open item on re-activation by default (not collapsible)", async () => {
    const user = userEvent.setup();
    render(<SingleAccordion defaultValue="a" />);

    await user.click(screen.getByRole("button", { name: "Section A" }));
    expect(screen.getByText("Section A content")).toBeVisible();
  });

  it("collapses the open item on re-activation when collapsible", async () => {
    const user = userEvent.setup();
    render(<SingleAccordion defaultValue="a" collapsible />);

    await user.click(screen.getByRole("button", { name: "Section A" }));
    expect(screen.queryByText("Section A content")).not.toBeInTheDocument();
  });

  it("wires aria-expanded, aria-controls and the region's aria-labelledby", async () => {
    const user = userEvent.setup();
    render(<SingleAccordion />);
    const trigger = screen.getByRole("button", { name: "Section A" });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    const region = screen.getByRole("region", { name: "Section A" });
    expect(region).toHaveAttribute("aria-labelledby", trigger.id);
    expect(trigger).toHaveAttribute("aria-controls", region.id);
  });

  it("moves focus with ArrowDown/ArrowUp without toggling", async () => {
    const user = userEvent.setup();
    render(<SingleAccordion />);
    const a = screen.getByRole("button", { name: "Section A" });
    const b = screen.getByRole("button", { name: "Section B" });
    const c = screen.getByRole("button", { name: "Section C" });

    a.focus();
    await user.keyboard("{ArrowDown}");
    expect(b).toHaveFocus();
    expect(b).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{ArrowDown}");
    expect(c).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(a).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(c).toHaveFocus();
  });

  it("jumps to first/last trigger with Home/End", async () => {
    const user = userEvent.setup();
    render(<SingleAccordion />);
    const a = screen.getByRole("button", { name: "Section A" });
    const c = screen.getByRole("button", { name: "Section C" });

    a.focus();
    await user.keyboard("{End}");
    expect(c).toHaveFocus();
    await user.keyboard("{Home}");
    expect(a).toHaveFocus();
  });

  it("disables a specific item's trigger and excludes it from navigation", async () => {
    const user = userEvent.setup();
    render(
      <Accordion.Root type="single">
        <Item value="a" title="Section A" />
        <Item value="b" title="Section B" disabled />
        <Item value="c" title="Section C" />
      </Accordion.Root>,
    );
    const a = screen.getByRole("button", { name: "Section A" });
    const b = screen.getByRole("button", { name: "Section B" });
    const c = screen.getByRole("button", { name: "Section C" });

    expect(b).toBeDisabled();
    a.focus();
    await user.keyboard("{ArrowDown}");
    expect(c).toHaveFocus();
  });

  it("supports controlled value (empty string represents 'nothing open')", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(
      <SingleAccordion value="" onValueChange={onValueChange} />,
    );

    await user.click(screen.getByRole("button", { name: "Section A" }));
    expect(onValueChange).toHaveBeenCalledWith("a");
    expect(screen.queryByText("Section A content")).not.toBeInTheDocument();

    rerender(<SingleAccordion value="a" onValueChange={onValueChange} />);
    expect(screen.getByText("Section A content")).toBeVisible();
  });

  it("keeps closed content mounted and hidden with forceMount", () => {
    render(
      <Accordion.Root type="single">
        <Accordion.Item value="a">
          <Accordion.Header>
            <Accordion.Trigger>Section A</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content forceMount>Section A content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const content = screen.getByText("Section A content");
    expect(content).toBeInTheDocument();
    expect(content).not.toBeVisible();
  });

  it("has no axe violations", async () => {
    const user = userEvent.setup();
    const { container } = render(<SingleAccordion />);
    await user.click(screen.getByRole("button", { name: "Section A" }));
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Accordion (multiple)", () => {
  function MultipleAccordion(
    props: Partial<Omit<AccordionMultipleProps, "type">> = {},
  ) {
    return (
      <Accordion.Root type="multiple" {...props}>
        <Item value="a" title="Section A" />
        <Item value="b" title="Section B" />
      </Accordion.Root>
    );
  }

  it("allows more than one item open at once", async () => {
    const user = userEvent.setup();
    render(<MultipleAccordion />);

    await user.click(screen.getByRole("button", { name: "Section A" }));
    await user.click(screen.getByRole("button", { name: "Section B" }));

    expect(screen.getByText("Section A content")).toBeVisible();
    expect(screen.getByText("Section B content")).toBeVisible();
  });

  it("toggles each item independently", async () => {
    const user = userEvent.setup();
    render(<MultipleAccordion defaultValue={["a", "b"]} />);

    await user.click(screen.getByRole("button", { name: "Section A" }));
    expect(screen.queryByText("Section A content")).not.toBeInTheDocument();
    expect(screen.getByText("Section B content")).toBeVisible();
  });

  it("supports controlled array value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<MultipleAccordion value={[]} onValueChange={onValueChange} />);

    await user.click(screen.getByRole("button", { name: "Section A" }));
    expect(onValueChange).toHaveBeenCalledWith(["a"]);
  });
});

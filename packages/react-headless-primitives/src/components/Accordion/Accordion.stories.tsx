import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Accordion } from "./Accordion";

// This library ships zero CSS — these rules exist only to make the
// accordion legible inside Storybook, they are not part of the library.
const demoStyles = `
  [data-accordion-root] { border-top: 1px solid #8884; max-width: 420px; }
  [data-accordion-root] > div { border-bottom: 1px solid #8884; }
  h3 { margin: 0; }
  [data-accordion-trigger] {
    font: inherit;
    font-weight: 600;
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    padding: 0.75em 0.25em;
    cursor: pointer;
  }
  [data-accordion-trigger][disabled] { opacity: 0.4; cursor: not-allowed; }
  [data-accordion-trigger]::after { content: "+"; float: right; }
  [data-accordion-trigger][aria-expanded="true"]::after { content: "−"; }
  [role="region"] { padding: 0 0.25em 0.75em; color: #4b5563; }
`;

// `id` namespaces both the item values and the trigger labels — needed so
// multiple accordion instances rendered on one page (see Variants below)
// never produce two `role="region"` landmarks with the same accessible
// name, which axe's landmark-unique rule (correctly) flags.
function BasicItems({ id = "" }: { id?: string }) {
  const suffix = id ? `-${id}` : "";
  const label = (text: string) => (id ? `${text} (${id})` : text);
  return (
    <>
      <Accordion.Item value={`shipping${suffix}`}>
        <Accordion.Header>
          <Accordion.Trigger>{label("Shipping")}</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content>
          Orders ship within 2 business days.
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value={`returns${suffix}`}>
        <Accordion.Header>
          <Accordion.Trigger>{label("Returns")}</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content>
          Items can be returned within 30 days of delivery.
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value={`warranty${suffix}`} disabled>
        <Accordion.Header>
          <Accordion.Trigger>{label("Warranty (disabled)")}</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content>Not available for this item.</Accordion.Content>
      </Accordion.Item>
    </>
  );
}

const meta: Meta<typeof Accordion.Root> = {
  title: "Components/Accordion",
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

type Story = StoryObj<typeof Accordion.Root>;

export const Default: Story = {
  render: () => (
    <Accordion.Root type="single" defaultValue="shipping">
      <BasicItems />
    </Accordion.Root>
  ),
};

export const Variants: Story = {
  name: "Variants (single non-collapsible, single collapsible, multiple)",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <p>
          <strong>Single, not collapsible</strong> — one open item can&apos;t be
          closed by re-activating it.
        </p>
        <Accordion.Root type="single" defaultValue="shipping-single">
          <BasicItems id="single" />
        </Accordion.Root>
      </div>
      <div>
        <p>
          <strong>Single, collapsible</strong> — re-activating the open item
          closes it.
        </p>
        <Accordion.Root
          type="single"
          defaultValue="shipping-collapsible"
          collapsible
        >
          <BasicItems id="collapsible" />
        </Accordion.Root>
      </div>
      <div>
        <p>
          <strong>Multiple</strong> — any number of items can be open at once.
        </p>
        <Accordion.Root
          type="multiple"
          defaultValue={["shipping-multiple", "returns-multiple"]}
        >
          <BasicItems id="multiple" />
        </Accordion.Root>
      </div>
    </div>
  ),
};

export const Keyboard: Story = {
  name: "Keyboard (arrow keys move focus, Enter/Space toggles)",
  render: () => (
    <Accordion.Root type="single">
      <BasicItems />
    </Accordion.Root>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const shipping = canvas.getByRole("button", { name: "Shipping" });
    const returns = canvas.getByRole("button", { name: "Returns" });

    shipping.focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(returns).toHaveFocus();
    // Moving focus alone must not toggle anything.
    await expect(returns).toHaveAttribute("aria-expanded", "false");

    await userEvent.keyboard("{Enter}");
    await expect(returns).toHaveAttribute("aria-expanded", "true");
    await expect(
      canvas.getByText("Items can be returned within 30 days of delivery."),
    ).toBeVisible();

    await userEvent.keyboard("{ArrowUp}");
    await expect(shipping).toHaveFocus();
  },
};

export const Accessibility: Story = {
  name: "Accessibility (heading/region wiring, disabled item, no axe violations)",
  render: () => (
    <Accordion.Root type="single" defaultValue="shipping">
      <BasicItems />
    </Accordion.Root>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Shipping" });
    const region = canvas.getByRole("region", { name: "Shipping" });

    await expect(region).toHaveAttribute("aria-labelledby", trigger.id);
    await expect(trigger).toHaveAttribute("aria-controls", region.id);
    await expect(
      canvas.getByRole("button", { name: "Warranty (disabled)" }),
    ).toBeDisabled();
    await expect(
      canvas.getByRole("heading", { level: 3, name: "Shipping" }),
    ).toBeInTheDocument();
  },
};

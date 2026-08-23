import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Button } from "./Button";

// This library ships zero CSS — these attribute selectors exist only to
// make the headless `data-variant`/`data-size`/`data-loading` hooks
// visible inside Storybook, they are not part of the library itself.
const demoStyles = `
  [data-variant] {
    font: inherit;
    border-radius: 6px;
    padding: 0.5em 1em;
    cursor: pointer;
    border: 1px solid #8884;
  }
  [data-variant="primary"] { background: #4338ca; color: white; border-color: transparent; }
  [data-variant="secondary"] { background: #e5e7eb; color: #111827; border-color: transparent; }
  [data-variant="ghost"] { background: transparent; color: #111827; }
  [data-variant="destructive"] { background: #b91c1c; color: white; border-color: transparent; }
  [data-size="sm"] { font-size: 0.8em; }
  [data-size="lg"] { font-size: 1.15em; }
  [data-disabled] { opacity: 0.5; cursor: not-allowed; }
`;

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  decorators: [
    (Story) => (
      <>
        <style>{demoStyles}</style>
        <Story />
      </>
    ),
  ],
  args: {
    onClick: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: "Save changes",
  },
};

export const Variants: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
      <Button {...args} variant="primary">
        Primary
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="destructive">
        Destructive
      </Button>
      <Button {...args} variant="primary" size="sm">
        Small
      </Button>
      <Button {...args} variant="primary" size="lg">
        Large
      </Button>
    </div>
  ),
};

export const Keyboard: Story = {
  args: {
    children: "Press Enter or Space",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", {
      name: "Press Enter or Space",
    });

    button.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};

export const Accessibility: Story = {
  name: "Accessibility (disabled & loading)",
  render: (args) => (
    <div style={{ display: "flex", gap: "0.75rem" }}>
      <Button {...args} disabled>
        Disabled
      </Button>
      <Button {...args} loading>
        Loading
      </Button>
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const disabledButton = canvas.getByRole("button", { name: "Disabled" });
    const loadingButton = canvas.getByRole("button", { name: "Loading" });

    await expect(disabledButton).toBeDisabled();
    await expect(loadingButton).toHaveAttribute("aria-busy", "true");

    await userEvent.click(disabledButton);
    await userEvent.click(loadingButton);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

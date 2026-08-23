import type { Meta, StoryObj } from "@storybook/react-vite";

function Placeholder() {
  return <p>Storybook is wired up. Real component stories land next.</p>;
}

const meta: Meta<typeof Placeholder> = {
  title: "Placeholder",
  component: Placeholder,
};

export default meta;

type Story = StoryObj<typeof Placeholder>;

export const Default: Story = {};

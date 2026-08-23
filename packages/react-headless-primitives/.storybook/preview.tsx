import type { Preview } from "@storybook/react-vite";

// The library ships zero CSS, so the canvas iframe otherwise falls back to
// the browser's default serif font. This is Storybook-only presentation —
// it doesn't affect the published package or apps/demo.
const DEMO_FONT_STACK = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;

const preview: Preview = {
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <>
        <style>{`body { font-family: ${DEMO_FONT_STACK}; }`}</style>
        <Story />
      </>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "error",
    },
  },
};

export default preview;

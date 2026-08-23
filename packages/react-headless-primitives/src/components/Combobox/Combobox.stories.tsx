import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Combobox, useCombobox } from "./Combobox";

interface Language {
  code: string;
  name: string;
}

const LANGUAGES: Language[] = [
  { code: "en", name: "English" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ja", name: "Japanese" },
  { code: "pt", name: "Portuguese" },
  { code: "es", name: "Spanish" },
];

function fakeServerSearch(query: string): Promise<Language[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const q = query.toLowerCase();
      resolve(LANGUAGES.filter((lang) => lang.name.toLowerCase().includes(q)));
    }, 400);
  });
}

// This library ships zero CSS — these rules exist only to make the combobox
// legible inside Storybook, they are not part of the library itself.
const demoStyles = `
  .combobox { position: relative; width: 260px; }
  [role="combobox"] {
    font: inherit;
    width: 100%;
    box-sizing: border-box;
    padding: 0.5em 0.75em;
    border: 1px solid #8884;
    border-radius: 6px;
  }
  [role="listbox"] {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: white;
    color: #111827;
    border: 1px solid #8884;
    border-radius: 6px;
    max-height: 220px;
    overflow-y: auto;
    padding: 0.25rem;
    z-index: 1;
  }
  [role="option"] { padding: 0.4em 0.6em; border-radius: 4px; cursor: pointer; }
  [role="option"][data-highlighted] { background: #4338ca; color: white; }
  [role="option"][data-selected] { font-weight: 600; }
  .combobox-empty { padding: 0.4em 0.6em; color: #6b7280; }
`;

function LanguageOptions() {
  const { items, loading, error } = useCombobox<Language>();
  if (loading) return <div className="combobox-empty">Loading…</div>;
  if (error) return <div className="combobox-empty">Something went wrong.</div>;
  if (items.length === 0)
    return <div className="combobox-empty">No matches.</div>;
  return (
    <>
      {items.map((language) => (
        <Combobox.Item key={language.code} item={language} />
      ))}
    </>
  );
}

const meta: Meta<typeof Combobox.Root<Language>> = {
  title: "Components/Combobox",
  component: Combobox.Root,
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

type Story = StoryObj<typeof Combobox.Root<Language>>;

export const Default: Story = {
  render: () => (
    <div className="combobox">
      <Combobox.Root
        items={LANGUAGES}
        itemToString={(lang) => lang.name}
        itemToKey={(lang) => lang.code}
      >
        <Combobox.Input aria-label="Language" placeholder="Search language…" />
        <Combobox.Content>
          <LanguageOptions />
        </Combobox.Content>
      </Combobox.Root>
    </div>
  ),
};

export const Variants: Story = {
  name: "Variants (static vs. async, controlled)",
  render: function VariantsDemo() {
    const [value, setValue] = useState<Language | undefined>(LANGUAGES[0]);
    return (
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
        <div>
          <p>Static list, client-side filtered</p>
          <div className="combobox">
            <Combobox.Root
              items={LANGUAGES}
              itemToString={(lang) => lang.name}
              itemToKey={(lang) => lang.code}
            >
              <Combobox.Input aria-label="Static language" />
              <Combobox.Content>
                <LanguageOptions />
              </Combobox.Content>
            </Combobox.Root>
          </div>
        </div>
        <div>
          <p>Async `loadOptions`, debounced 400ms</p>
          <div className="combobox">
            <Combobox.Root
              loadOptions={fakeServerSearch}
              itemToString={(lang) => lang.name}
              itemToKey={(lang) => lang.code}
            >
              <Combobox.Input aria-label="Async language" />
              <Combobox.Content>
                <LanguageOptions />
              </Combobox.Content>
            </Combobox.Root>
          </div>
        </div>
        <div>
          <p>Controlled value: {value?.name ?? "none"}</p>
          <div className="combobox">
            <Combobox.Root
              items={LANGUAGES}
              itemToString={(lang) => lang.name}
              itemToKey={(lang) => lang.code}
              value={value}
              onValueChange={setValue}
            >
              <Combobox.Input aria-label="Controlled language" />
              <Combobox.Content>
                <LanguageOptions />
              </Combobox.Content>
            </Combobox.Root>
          </div>
        </div>
      </div>
    );
  },
};

export const Keyboard: Story = {
  name: "Keyboard (arrow keys, Enter selects, Escape closes)",
  render: () => (
    <div className="combobox">
      <Combobox.Root
        items={LANGUAGES}
        itemToString={(lang) => lang.name}
        itemToKey={(lang) => lang.code}
      >
        <Combobox.Input aria-label="Language" />
        <Combobox.Content>
          <LanguageOptions />
        </Combobox.Content>
      </Combobox.Root>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Language" });

    await userEvent.click(input);
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowDown}");
    const french = canvas.getByRole("option", { name: "French" });
    await expect(french).toHaveAttribute("data-highlighted", "true");
    await expect(input).toHaveAttribute("aria-activedescendant", french.id);

    await userEvent.keyboard("{Enter}");
    await expect(input).toHaveValue("French");
    await expect(canvas.queryByRole("listbox")).not.toBeInTheDocument();
  },
};

export const Accessibility: Story = {
  name: "Accessibility (combobox/listbox roles, no axe violations)",
  render: () => (
    <div className="combobox">
      <Combobox.Root
        items={LANGUAGES}
        itemToString={(lang) => lang.name}
        itemToKey={(lang) => lang.code}
      >
        <Combobox.Input aria-label="Language" />
        <Combobox.Content>
          <LanguageOptions />
        </Combobox.Content>
      </Combobox.Root>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Language" });

    await expect(input).toHaveAttribute("aria-autocomplete", "list");
    await expect(input).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(input);
    await expect(input).toHaveAttribute("aria-expanded", "true");
    await waitFor(() =>
      expect(canvas.getByRole("listbox")).toBeInTheDocument(),
    );
    await expect(canvas.getByRole("listbox")).toHaveAttribute(
      "aria-labelledby",
      input.id,
    );
  },
};

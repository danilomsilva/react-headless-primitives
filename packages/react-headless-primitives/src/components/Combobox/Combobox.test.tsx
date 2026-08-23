import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Combobox, useCombobox, type ComboboxRootProps } from "./Combobox";

interface Fruit {
  id: string;
  name: string;
}

const FRUITS: Fruit[] = [
  { id: "apple", name: "Apple" },
  { id: "banana", name: "Banana" },
  { id: "cherry", name: "Cherry" },
];

function FruitOptions() {
  const { items } = useCombobox<Fruit>();
  return (
    <>
      {items.map((fruit) => (
        <Combobox.Item key={fruit.id} item={fruit} />
      ))}
    </>
  );
}

function FruitCombobox(
  props: Partial<
    Omit<ComboboxRootProps<Fruit>, "itemToString" | "itemToKey">
  > = {},
) {
  return (
    <Combobox.Root
      items={FRUITS}
      itemToString={(fruit) => fruit.name}
      itemToKey={(fruit) => fruit.id}
      {...props}
    >
      <Combobox.Trigger aria-label="Toggle" />
      <Combobox.Input aria-label="Fruit" />
      <Combobox.Content>
        <FruitOptions />
      </Combobox.Content>
    </Combobox.Root>
  );
}

describe("Combobox (static items)", () => {
  it("opens on focus and lists all items", async () => {
    const user = userEvent.setup();
    render(<FruitCombobox />);
    await user.click(screen.getByRole("combobox", { name: "Fruit" }));
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("filters items as the user types", async () => {
    const user = userEvent.setup();
    render(<FruitCombobox />);
    await user.type(screen.getByRole("combobox", { name: "Fruit" }), "ban");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option", { name: "Banana" })).toBeInTheDocument();
  });

  it("selects an item on click, closes, and updates the input text", async () => {
    const user = userEvent.setup();
    render(<FruitCombobox />);
    const input = screen.getByRole("combobox", { name: "Fruit" });
    await user.click(input);
    await user.click(screen.getByRole("option", { name: "Banana" }));

    expect(input).toHaveValue("Banana");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("navigates with ArrowDown/ArrowUp and selects the highlighted item with Enter", async () => {
    const user = userEvent.setup();
    render(<FruitCombobox />);
    const input = screen.getByRole("combobox", { name: "Fruit" });
    await user.click(input);

    await user.keyboard("{ArrowDown}");
    const apple = screen.getByRole("option", { name: "Apple" });
    expect(apple).toHaveAttribute("data-highlighted", "true");
    expect(input).toHaveAttribute("aria-activedescendant", apple.id);

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: "Banana" })).toHaveAttribute(
      "data-highlighted",
      "true",
    );

    await user.keyboard("{Enter}");
    expect(input).toHaveValue("Banana");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes on Escape without selecting", async () => {
    const user = userEvent.setup();
    render(<FruitCombobox />);
    await user.click(screen.getByRole("combobox", { name: "Fruit" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("marks the selected item with aria-selected", async () => {
    const user = userEvent.setup();
    render(<FruitCombobox defaultValue={FRUITS[1]} />);
    await user.click(screen.getByRole("combobox", { name: "Fruit" }));
    expect(screen.getByRole("option", { name: "Banana" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("option", { name: "Apple" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("supports a trigger button that toggles the popup", async () => {
    const user = userEvent.setup();
    render(<FruitCombobox />);
    const trigger = screen.getByRole("button", { name: "Toggle" });
    await user.click(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.click(trigger);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("supports controlled value and open state", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <FruitCombobox
        open={true}
        onOpenChange={onOpenChange}
        value={undefined}
        onValueChange={onValueChange}
      />,
    );
    await user.click(screen.getByRole("option", { name: "Cherry" }));
    expect(onValueChange).toHaveBeenCalledWith(FRUITS[2]);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("has no axe violations while open", async () => {
    const user = userEvent.setup();
    const { container } = render(<FruitCombobox />);
    await user.click(screen.getByRole("combobox", { name: "Fruit" }));
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Combobox (async loadOptions)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function AsyncCombobox(
    props: Partial<
      Omit<ComboboxRootProps<Fruit>, "itemToString" | "itemToKey">
    >,
  ) {
    return (
      <Combobox.Root
        itemToString={(f: Fruit) => f.name}
        itemToKey={(f: Fruit) => f.id}
        {...props}
      >
        <Combobox.Input aria-label="Fruit" />
        <Combobox.Content>
          <FruitOptions />
        </Combobox.Content>
      </Combobox.Root>
    );
  }

  it("debounces loadOptions and shows results once it resolves", async () => {
    const loadOptions = vi.fn(
      (query: string) =>
        new Promise<Fruit[]>((resolve) => {
          setTimeout(
            () => resolve(FRUITS.filter((f) => f.name.includes(query))),
            10,
          );
        }),
    );

    render(<AsyncCombobox loadOptions={loadOptions} debounceMs={200} />);

    const input = screen.getByRole("combobox", { name: "Fruit" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "an" } });

    expect(loadOptions).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(loadOptions).toHaveBeenCalledWith("an");

    await act(async () => {
      vi.advanceTimersByTime(10);
      await Promise.resolve();
    });

    expect(screen.getByRole("option", { name: "Banana" })).toBeInTheDocument();
  });

  it("ignores a stale response that resolves after a newer request", async () => {
    const resolvers: Array<(fruits: Fruit[]) => void> = [];
    const loadOptions = vi.fn(
      () =>
        new Promise<Fruit[]>((resolve) => {
          resolvers.push(resolve);
        }),
    );

    render(<AsyncCombobox loadOptions={loadOptions} debounceMs={0} />);

    const input = screen.getByRole("combobox", { name: "Fruit" });
    fireEvent.focus(input);

    fireEvent.change(input, { target: { value: "a" } });
    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    fireEvent.change(input, { target: { value: "ab" } });
    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(resolvers).toHaveLength(2);

    // Resolve the newer request first, then the stale one — the stale
    // result must not clobber the newer one.
    await act(async () => {
      resolvers[1]?.([FRUITS[1]!]);
    });
    await act(async () => {
      resolvers[0]?.([FRUITS[0]!]);
    });

    expect(screen.getByRole("option", { name: "Banana" })).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Apple" }),
    ).not.toBeInTheDocument();
  });
});

import * as React from "react";
import { Slot } from "../../internal/Slot";
import { composeEventHandlers } from "../../internal/composeEventHandlers";
import { useControllableState } from "../../internal/useControllableState";
import { useId } from "../../internal/useId";

interface ComboboxContextValue<T> {
  open: boolean;
  setOpen: (open: boolean) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  items: T[];
  loading: boolean;
  error: unknown;
  value: T | undefined;
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;
  selectItem: (item: T) => void;
  itemToString: (item: T) => string;
  itemToKey: (item: T) => string;
  getItemId: (key: string) => string;
  listboxId: string;
  inputId: string;
}

// Context is necessarily type-erased (a single React context can't carry a
// different `T` per Provider instance); each part re-asserts the specific
// `T` it was written against when reading it back out.
const ComboboxContext =
  React.createContext<ComboboxContextValue<unknown> | null>(null);

function useComboboxContext<T>(name: string): ComboboxContextValue<T> {
  const context = React.useContext(ComboboxContext);
  if (!context) {
    throw new Error(`${name} must be rendered inside Combobox.Root`);
  }
  return context as ComboboxContextValue<T>;
}

/** The combobox's current state and actions — useful for rendering loading/empty states or custom controls around `Combobox.Content`. */
export function useCombobox<T>() {
  return useComboboxContext<T>("useCombobox");
}

function sanitizeForId(key: string): string {
  return key.replace(/[^a-zA-Z0-9_-]/g, "-");
}

export interface ComboboxRootProps<T> {
  /** Static, synchronous option list. Filtered client-side against `inputValue`. Mutually exclusive with `loadOptions`. */
  items?: T[];
  /** Async option loader, called (debounced) whenever `inputValue` changes. Mutually exclusive with `items`. */
  loadOptions?: (query: string) => Promise<T[]>;
  /** Debounce, in ms, before calling `loadOptions` after typing stops. Defaults to 200. */
  debounceMs?: number;
  itemToString: (item: T) => string;
  /** Defaults to `itemToString` — must be unique per item. */
  itemToKey?: (item: T) => string;
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T | undefined) => void;
  inputValue?: string;
  defaultInputValue?: string;
  onInputValueChange?: (value: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function ComboboxRoot<T>({
  items: staticItems,
  loadOptions,
  debounceMs = 200,
  itemToString,
  itemToKey = itemToString,
  value: valueProp,
  defaultValue,
  onValueChange,
  inputValue: inputValueProp,
  defaultInputValue,
  onInputValueChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
}: ComboboxRootProps<T>) {
  const idPrefix = useId();
  const listboxId = `${idPrefix}-listbox`;
  const inputId = `${idPrefix}-input`;

  const [value, setValue] = useControllableState<T | undefined>({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange: onValueChange,
  });
  const [inputValue, setInputValue] = useControllableState<string>({
    prop: inputValueProp,
    defaultProp: defaultInputValue ?? "",
    onChange: onInputValueChange,
  });
  const [open, setOpen] = useControllableState<boolean>({
    prop: openProp,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
  });
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  // `query` is the input value whose results `items`/`error` currently
  // reflect. Comparing it against the live `inputValue` derives `loading`
  // without a separate setState call at the top of the effect below.
  const [asyncState, setAsyncState] = React.useState<{
    query: string | null;
    items: T[];
    error: unknown;
  }>({ query: null, items: [], error: null });

  React.useEffect(() => {
    if (!loadOptions) return;
    let cancelled = false;

    const timer = window.setTimeout(() => {
      loadOptions(inputValue)
        .then((result) => {
          if (cancelled) return;
          setAsyncState({ query: inputValue, items: result, error: null });
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setAsyncState({ query: inputValue, items: [], error: err });
        });
    }, debounceMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [inputValue, loadOptions, debounceMs]);

  const filteredStaticItems = React.useMemo(() => {
    if (!staticItems) return undefined;
    if (!inputValue) return staticItems;
    const query = inputValue.toLowerCase();
    return staticItems.filter((item) =>
      itemToString(item).toLowerCase().includes(query),
    );
  }, [staticItems, inputValue, itemToString]);

  const items = React.useMemo(
    () => (loadOptions ? asyncState.items : (filteredStaticItems ?? [])),
    [loadOptions, asyncState.items, filteredStaticItems],
  );
  const loading = Boolean(loadOptions) && asyncState.query !== inputValue;
  const error = loadOptions ? asyncState.error : null;

  const selectItem = React.useCallback(
    (item: T) => {
      setValue(item);
      setInputValue(itemToString(item));
      setOpen(false);
      setHighlightedIndex(-1);
    },
    [setValue, setInputValue, itemToString, setOpen],
  );

  const getItemId = React.useCallback(
    (key: string) => `${listboxId}-option-${sanitizeForId(key)}`,
    [listboxId],
  );

  const contextValue = React.useMemo<ComboboxContextValue<T>>(
    () => ({
      open,
      setOpen,
      inputValue,
      setInputValue,
      items,
      loading,
      error,
      value,
      highlightedIndex,
      setHighlightedIndex,
      selectItem,
      itemToString,
      itemToKey,
      getItemId,
      listboxId,
      inputId,
    }),
    [
      open,
      setOpen,
      inputValue,
      setInputValue,
      items,
      loading,
      error,
      value,
      highlightedIndex,
      selectItem,
      itemToString,
      itemToKey,
      getItemId,
      listboxId,
      inputId,
    ],
  );

  return (
    <ComboboxContext.Provider
      value={contextValue as ComboboxContextValue<unknown>}
    >
      {children}
    </ComboboxContext.Provider>
  );
}

export interface ComboboxTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const ComboboxTrigger = React.forwardRef<
  HTMLButtonElement,
  ComboboxTriggerProps
>(function ComboboxTrigger(
  { asChild = false, onClick, ...props },
  forwardedRef,
) {
  const { open, setOpen, inputId } = useComboboxContext("Combobox.Trigger");
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      {...props}
      ref={forwardedRef}
      type={asChild ? undefined : "button"}
      tabIndex={-1}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={inputId}
      onClick={composeEventHandlers(onClick, () => setOpen(!open))}
    />
  );
});

export interface ComboboxInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value"
> {
  asChild?: boolean;
}

const ComboboxInput = React.forwardRef<HTMLInputElement, ComboboxInputProps>(
  function ComboboxInput(
    { asChild = false, onChange, onKeyDown, onFocus, ...props },
    forwardedRef,
  ) {
    const {
      open,
      setOpen,
      inputValue,
      setInputValue,
      items,
      highlightedIndex,
      setHighlightedIndex,
      selectItem,
      itemToKey,
      getItemId,
      listboxId,
      inputId,
    } = useComboboxContext<unknown>("Combobox.Input");

    const activeDescendant =
      open && highlightedIndex >= 0 && items[highlightedIndex] !== undefined
        ? getItemId(itemToKey(items[highlightedIndex]))
        : undefined;

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
      event,
    ) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setOpen(true);
          setHighlightedIndex(Math.min(highlightedIndex + 1, items.length - 1));
          break;
        case "ArrowUp":
          event.preventDefault();
          setOpen(true);
          setHighlightedIndex(Math.max(highlightedIndex - 1, 0));
          break;
        case "Home":
          if (open) {
            event.preventDefault();
            setHighlightedIndex(0);
          }
          break;
        case "End":
          if (open) {
            event.preventDefault();
            setHighlightedIndex(items.length - 1);
          }
          break;
        case "Enter":
          if (open && items[highlightedIndex] !== undefined) {
            event.preventDefault();
            selectItem(items[highlightedIndex]);
          }
          break;
        case "Escape":
          if (open) {
            event.preventDefault();
            setOpen(false);
          }
          break;
        default:
          break;
      }
    };

    const Comp = asChild ? Slot : "input";

    return (
      <Comp
        {...props}
        ref={forwardedRef}
        id={inputId}
        role="combobox"
        type={asChild ? undefined : "text"}
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={activeDescendant}
        value={inputValue}
        onChange={composeEventHandlers(onChange, (event) => {
          setInputValue((event.target as HTMLInputElement).value);
          setOpen(true);
          setHighlightedIndex(-1);
        })}
        onFocus={composeEventHandlers(onFocus, () => setOpen(true))}
        onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
      />
    );
  },
);

export interface ComboboxContentProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const ComboboxContent = React.forwardRef<HTMLDivElement, ComboboxContentProps>(
  function ComboboxContent({ asChild = false, ...props }, forwardedRef) {
    const { open, listboxId, inputId } = useComboboxContext("Combobox.Content");
    if (!open) return null;

    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        {...props}
        ref={forwardedRef}
        role="listbox"
        id={listboxId}
        aria-labelledby={inputId}
      />
    );
  },
);

export interface ComboboxItemProps<T> extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  item: T;
  asChild?: boolean;
  children?: React.ReactNode;
}

function ComboboxItemImpl<T>(
  {
    item,
    asChild = false,
    children,
    onClick,
    onMouseEnter,
    ...props
  }: ComboboxItemProps<T>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    items,
    itemToKey,
    itemToString,
    value,
    highlightedIndex,
    setHighlightedIndex,
    selectItem,
    getItemId,
  } = useComboboxContext<T>("Combobox.Item");

  const key = itemToKey(item);
  const index = items.findIndex((candidate) => itemToKey(candidate) === key);
  const isHighlighted = index >= 0 && index === highlightedIndex;
  const isSelected = value !== undefined && itemToKey(value) === key;
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      {...props}
      ref={forwardedRef}
      role="option"
      id={getItemId(key)}
      aria-selected={isSelected}
      data-highlighted={isHighlighted || undefined}
      data-selected={isSelected || undefined}
      onClick={composeEventHandlers(onClick, () => selectItem(item))}
      onMouseEnter={composeEventHandlers(onMouseEnter, () => {
        if (index >= 0) setHighlightedIndex(index);
      })}
    >
      {children ?? itemToString(item)}
    </Comp>
  );
}

const ComboboxItem = React.forwardRef(ComboboxItemImpl) as <T>(
  props: ComboboxItemProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> },
) => React.ReactElement;

export const Combobox = {
  Root: ComboboxRoot,
  Trigger: ComboboxTrigger,
  Input: ComboboxInput,
  Content: ComboboxContent,
  Item: ComboboxItem,
};

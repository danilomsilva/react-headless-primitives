import * as React from "react";
import { Slot } from "../../internal/Slot";
import { composeEventHandlers } from "../../internal/composeEventHandlers";
import { useControllableState } from "../../internal/useControllableState";
import { useId } from "../../internal/useId";

interface AccordionContextValue {
  isOpen: (value: string) => boolean;
  toggle: (value: string) => void;
  idPrefix: string;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(
  null,
);

function useAccordionContext(part: string): AccordionContextValue {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error(`Accordion.${part} must be rendered inside Accordion.Root`);
  }
  return context;
}

interface AccordionItemContextValue {
  value: string;
  isOpen: boolean;
  disabled: boolean;
}

const AccordionItemContext =
  React.createContext<AccordionItemContextValue | null>(null);

function useAccordionItemContext(part: string): AccordionItemContextValue {
  const context = React.useContext(AccordionItemContext);
  if (!context) {
    throw new Error(`Accordion.${part} must be rendered inside Accordion.Item`);
  }
  return context;
}

export interface AccordionSingleProps {
  type: "single";
  /** Use `""` (not `undefined`) to control this as "nothing open" — `undefined` is the uncontrolled sentinel. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string | undefined) => void;
  /** Whether activating the currently-open item collapses it. Defaults to `false`. */
  collapsible?: boolean;
}

export interface AccordionMultipleProps {
  type: "multiple";
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

export type AccordionRootProps = (
  AccordionSingleProps | AccordionMultipleProps
) &
  Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> & {
    asChild?: boolean;
  };

const AccordionRoot = React.forwardRef<HTMLDivElement, AccordionRootProps>(
  function AccordionRoot(props, forwardedRef) {
    const { type, children, asChild = false, ...rest } = props;
    // value/defaultValue/onValueChange/collapsible are read from `props`
    // above (kept narrowed by `type`) — stripped here so they never leak
    // onto the rendered DOM element as invalid attributes.
    const {
      value: _value,
      defaultValue: _defaultValue,
      onValueChange: _onValueChange,
      collapsible: _collapsible,
      ...domProps
    } = rest as typeof rest & { collapsible?: boolean };
    const idPrefix = useId();

    const normalizedValueProp =
      type === "multiple"
        ? props.value
        : props.value !== undefined
          ? [props.value]
          : undefined;
    const normalizedDefaultProp =
      type === "multiple"
        ? (props.defaultValue ?? [])
        : props.defaultValue !== undefined
          ? [props.defaultValue]
          : [];
    const collapsible = type === "single" ? (props.collapsible ?? false) : true;

    const [openValues, setOpenValues] = useControllableState<string[]>({
      prop: normalizedValueProp,
      defaultProp: normalizedDefaultProp,
      onChange: (next) => {
        if (type === "multiple") {
          props.onValueChange?.(next);
        } else {
          props.onValueChange?.(next[0]);
        }
      },
    });

    const toggle = React.useCallback(
      (itemValue: string) => {
        setOpenValues((current) => {
          const isOpen = current.includes(itemValue);
          if (type === "multiple") {
            return isOpen
              ? current.filter((v) => v !== itemValue)
              : [...current, itemValue];
          }
          if (isOpen) return collapsible ? [] : current;
          return [itemValue];
        });
      },
      [type, collapsible, setOpenValues],
    );

    const contextValue = React.useMemo(
      () => ({
        isOpen: (v: string) => openValues.includes(v),
        toggle,
        idPrefix,
      }),
      [openValues, toggle, idPrefix],
    );

    const Comp = asChild ? Slot : "div";

    return (
      <AccordionContext.Provider value={contextValue}>
        <Comp {...domProps} ref={forwardedRef} data-accordion-root="">
          {children}
        </Comp>
      </AccordionContext.Provider>
    );
  },
);

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
  asChild?: boolean;
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  function AccordionItem(
    { value, disabled = false, asChild = false, children, ...props },
    forwardedRef,
  ) {
    const { isOpen } = useAccordionContext("Item");
    const itemIsOpen = isOpen(value);
    const Comp = asChild ? Slot : "div";

    const itemContextValue = React.useMemo(
      () => ({ value, isOpen: itemIsOpen, disabled }),
      [value, itemIsOpen, disabled],
    );

    return (
      <AccordionItemContext.Provider value={itemContextValue}>
        <Comp
          {...props}
          ref={forwardedRef}
          data-state={itemIsOpen ? "open" : "closed"}
          data-disabled={disabled || undefined}
        >
          {children}
        </Comp>
      </AccordionItemContext.Provider>
    );
  },
);

export interface AccordionHeaderProps extends React.HTMLAttributes<HTMLHeadingElement> {
  asChild?: boolean;
}

const AccordionHeader = React.forwardRef<
  HTMLHeadingElement,
  AccordionHeaderProps
>(function AccordionHeader({ asChild = false, ...props }, forwardedRef) {
  const { isOpen } = useAccordionItemContext("Header");
  const Comp = asChild ? Slot : "h3";
  return (
    <Comp
      {...props}
      ref={forwardedRef}
      data-state={isOpen ? "open" : "closed"}
    />
  );
});

export interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  AccordionTriggerProps
>(function AccordionTrigger(
  { asChild = false, disabled, onClick, onKeyDown, ...props },
  forwardedRef,
) {
  const { toggle, idPrefix } = useAccordionContext("Trigger");
  const {
    value,
    isOpen,
    disabled: itemDisabled,
  } = useAccordionItemContext("Trigger");
  const isDisabled = disabled ?? itemDisabled;
  const Comp = asChild ? Slot : "button";

  const handleKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (
    event,
  ) => {
    const navigationKeys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!navigationKeys.includes(event.key)) return;

    const root = event.currentTarget.closest<HTMLElement>(
      "[data-accordion-root]",
    );
    if (!root) return;
    const triggers = Array.from(
      root.querySelectorAll<HTMLElement>(
        "[data-accordion-trigger]:not([disabled])",
      ),
    );
    const currentIndex = triggers.indexOf(event.currentTarget);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    if (event.key === "ArrowDown")
      nextIndex = (currentIndex + 1) % triggers.length;
    else if (event.key === "ArrowUp")
      nextIndex = (currentIndex - 1 + triggers.length) % triggers.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = triggers.length - 1;

    event.preventDefault();
    triggers[nextIndex]?.focus();
  };

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    if (isDisabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    toggle(value);
  };

  return (
    <Comp
      {...props}
      ref={forwardedRef}
      type={asChild ? undefined : "button"}
      data-accordion-trigger=""
      id={`${idPrefix}-trigger-${value}`}
      aria-expanded={isOpen}
      aria-controls={`${idPrefix}-content-${value}`}
      disabled={asChild ? undefined : isDisabled}
      aria-disabled={asChild ? isDisabled || undefined : undefined}
      data-state={isOpen ? "open" : "closed"}
      onClick={composeEventHandlers(onClick, handleClick)}
      onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
    />
  );
});

export interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  /** Keep mounted (hidden via the `hidden` attribute) while closed, instead of unmounting. */
  forceMount?: boolean;
}

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  AccordionContentProps
>(function AccordionContent(
  { asChild = false, forceMount = false, ...props },
  forwardedRef,
) {
  const { idPrefix } = useAccordionContext("Content");
  const { value, isOpen } = useAccordionItemContext("Content");

  if (!isOpen && !forceMount) return null;

  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      {...props}
      ref={forwardedRef}
      role="region"
      id={`${idPrefix}-content-${value}`}
      aria-labelledby={`${idPrefix}-trigger-${value}`}
      hidden={!isOpen || undefined}
      data-state={isOpen ? "open" : "closed"}
    />
  );
});

export const Accordion = {
  Root: AccordionRoot,
  Item: AccordionItem,
  Header: AccordionHeader,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
};

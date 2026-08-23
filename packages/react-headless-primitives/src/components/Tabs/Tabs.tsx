import * as React from "react";
import { Slot } from "../../internal/Slot";
import { composeEventHandlers } from "../../internal/composeEventHandlers";
import { useControllableState } from "../../internal/useControllableState";
import { useId } from "../../internal/useId";

export type TabsOrientation = "horizontal" | "vertical";

interface TabsContextValue {
  value: string | undefined;
  onValueChange: (value: string) => void;
  orientation: TabsOrientation;
  idPrefix: string;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext(part: string): TabsContextValue {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error(`Tabs.${part} must be rendered inside Tabs.Root`);
  }
  return context;
}

export interface TabsRootProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: TabsOrientation;
  children?: React.ReactNode;
}

function TabsRoot({
  value: valueProp,
  defaultValue,
  onValueChange,
  orientation = "horizontal",
  children,
}: TabsRootProps) {
  const [value, setValue] = useControllableState<string | undefined>({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange: (next) => {
      if (next !== undefined) onValueChange?.(next);
    },
  });
  const idPrefix = useId();

  const contextValue = React.useMemo(
    () => ({ value, onValueChange: setValue, orientation, idPrefix }),
    [value, setValue, orientation, idPrefix],
  );

  return (
    <TabsContext.Provider value={contextValue}>{children}</TabsContext.Provider>
  );
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  function TabsList({ asChild = false, ...props }, forwardedRef) {
    const { orientation } = useTabsContext("List");
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        {...props}
        ref={forwardedRef}
        role="tablist"
        aria-orientation={orientation}
      />
    );
  },
);

export interface TabsTriggerProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "value"
> {
  value: string;
  asChild?: boolean;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  function TabsTrigger(
    { value, asChild = false, disabled, onClick, onKeyDown, ...props },
    forwardedRef,
  ) {
    const {
      value: activeValue,
      onValueChange,
      orientation,
      idPrefix,
    } = useTabsContext("Trigger");
    const isSelected = activeValue === value;
    const Comp = asChild ? Slot : "button";

    const handleKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (
      event,
    ) => {
      const nextKey = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
      const prevKey = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
      const navigationKeys = [nextKey, prevKey, "Home", "End"];
      if (!navigationKeys.includes(event.key)) return;

      const list = event.currentTarget.closest('[role="tablist"]');
      if (!list) return;
      const tabs = Array.from(
        list.querySelectorAll<HTMLElement>('[role="tab"]:not([disabled])'),
      );
      const currentIndex = tabs.indexOf(event.currentTarget);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;
      if (event.key === nextKey) nextIndex = (currentIndex + 1) % tabs.length;
      else if (event.key === prevKey)
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = tabs.length - 1;

      event.preventDefault();
      const nextTab = tabs[nextIndex];
      nextTab?.focus();
      const nextValue = nextTab?.dataset.value;
      if (nextValue !== undefined) onValueChange(nextValue);
    };

    return (
      <Comp
        {...props}
        ref={forwardedRef}
        type={asChild ? undefined : "button"}
        role="tab"
        id={`${idPrefix}-trigger-${value}`}
        data-value={value}
        disabled={disabled}
        aria-selected={isSelected}
        aria-controls={`${idPrefix}-content-${value}`}
        tabIndex={isSelected ? 0 : -1}
        data-state={isSelected ? "active" : "inactive"}
        onClick={composeEventHandlers(onClick, () => onValueChange(value))}
        onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
      />
    );
  },
);

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  asChild?: boolean;
  /** Keep mounted (hidden via the `hidden` attribute) while inactive, instead of unmounting. */
  forceMount?: boolean;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  function TabsContent(
    { value, asChild = false, forceMount = false, ...props },
    forwardedRef,
  ) {
    const { value: activeValue, idPrefix } = useTabsContext("Content");
    const isSelected = activeValue === value;

    if (!isSelected && !forceMount) return null;

    const Comp = asChild ? Slot : "div";

    return (
      <Comp
        {...props}
        ref={forwardedRef}
        role="tabpanel"
        id={`${idPrefix}-content-${value}`}
        aria-labelledby={`${idPrefix}-trigger-${value}`}
        hidden={!isSelected || undefined}
        tabIndex={0}
        data-state={isSelected ? "active" : "inactive"}
      />
    );
  },
);

export const Tabs = {
  Root: TabsRoot,
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
};

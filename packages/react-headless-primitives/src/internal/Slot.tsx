import * as React from "react";

type AnyProps = Record<string, unknown>;

function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref !== null && ref !== undefined) {
        (ref as React.RefObject<T | null>).current = node;
      }
    }
  };
}

function mergeProps(slotProps: AnyProps, childProps: AnyProps): AnyProps {
  const merged: AnyProps = { ...slotProps, ...childProps };

  for (const key in childProps) {
    const slotValue = slotProps[key];
    const childValue = childProps[key];
    const isHandler = /^on[A-Z]/.test(key);

    if (
      isHandler &&
      typeof slotValue === "function" &&
      typeof childValue === "function"
    ) {
      merged[key] = (...args: unknown[]) => {
        childValue(...args);
        slotValue(...args);
      };
    } else if (key === "className") {
      merged[key] = [slotValue, childValue].filter(Boolean).join(" ");
    } else if (key === "style") {
      merged[key] = { ...(slotValue as object), ...(childValue as object) };
    }
  }

  return merged;
}

export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

/**
 * Merges its props and ref onto its single child instead of rendering its
 * own element — the mechanism behind every `asChild` prop in this library.
 */
export const Slot = React.forwardRef<HTMLElement, SlotProps>(function Slot(
  { children, ...slotProps },
  forwardedRef,
) {
  if (!React.isValidElement(children)) {
    if (React.Children.count(children) > 1) {
      throw new Error("Slot expects a single React element child.");
    }
    return null;
  }

  const childElement = children as React.ReactElement<AnyProps> & {
    ref?: React.Ref<HTMLElement>;
  };

  return React.cloneElement(childElement, {
    ...mergeProps(slotProps, childElement.props),
    ref: forwardedRef
      ? mergeRefs(forwardedRef, childElement.ref)
      : childElement.ref,
  } as AnyProps);
});

import * as React from "react";
import { Slot } from "../../internal/Slot";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Render the single child element instead of a `<button>`, merging props onto it. */
  asChild?: boolean;
  /** Reflected as `data-variant` — carries no styling of its own. */
  variant?: ButtonVariant;
  /** Reflected as `data-size` — carries no styling of its own. */
  size?: ButtonSize;
  /** Marks the button busy: blocks activation and sets `aria-busy`/`data-loading`. */
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      asChild = false,
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      type = "button",
      onClick,
      children,
      ...props
    },
    forwardedRef,
  ) {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;

    const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
      if (isDisabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      onClick?.(event);
    };

    return (
      <Comp
        {...props}
        ref={forwardedRef}
        type={asChild ? undefined : type}
        disabled={asChild ? undefined : isDisabled}
        aria-disabled={asChild ? isDisabled || undefined : undefined}
        aria-busy={loading || undefined}
        data-variant={variant}
        data-size={size}
        data-loading={loading || undefined}
        data-disabled={isDisabled || undefined}
        onClick={handleClick}
      >
        {children}
      </Comp>
    );
  },
);

Button.displayName = "Button";

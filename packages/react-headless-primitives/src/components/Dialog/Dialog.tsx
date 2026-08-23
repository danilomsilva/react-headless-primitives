import * as React from "react";
import { Slot } from "../../internal/Slot";
import { Portal, type PortalProps } from "../../internal/Portal";
import { mergeRefs } from "../../internal/mergeRefs";
import { composeEventHandlers } from "../../internal/composeEventHandlers";
import { useControllableState } from "../../internal/useControllableState";
import { useId } from "../../internal/useId";
import { useFocusTrap } from "../../internal/useFocusTrap";
import { useEscapeKey } from "../../internal/useEscapeKey";
import { useScrollLock } from "../../internal/useScrollLock";

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  descriptionId: string | undefined;
  setDescriptionId: (id: string | undefined) => void;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext(part: string): DialogContextValue {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error(`Dialog.${part} must be rendered inside Dialog.Root`);
  }
  return context;
}

export interface DialogRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

function DialogRoot({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
}: DialogRootProps) {
  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
  });
  const titleId = useId();
  const [descriptionId, setDescriptionId] = React.useState<string | undefined>(
    undefined,
  );

  return (
    <DialogContext.Provider
      value={{
        open,
        onOpenChange: setOpen,
        titleId,
        descriptionId,
        setDescriptionId,
      }}
    >
      {children}
    </DialogContext.Provider>
  );
}

export interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  function DialogTrigger({ asChild = false, onClick, ...props }, forwardedRef) {
    const { open, onOpenChange } = useDialogContext("Trigger");
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        {...props}
        ref={forwardedRef}
        type={asChild ? undefined : "button"}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={composeEventHandlers(onClick, () => onOpenChange(true))}
      />
    );
  },
);

export type DialogPortalProps = PortalProps;

function DialogPortal({ children, container }: DialogPortalProps) {
  const { open } = useDialogContext("Portal");
  if (!open) return null;
  return <Portal container={container}>{children}</Portal>;
}

export type DialogOverlayProps = React.HTMLAttributes<HTMLDivElement>;

const DialogOverlay = React.forwardRef<HTMLDivElement, DialogOverlayProps>(
  function DialogOverlay({ onClick, ...props }, forwardedRef) {
    const { onOpenChange } = useDialogContext("Overlay");
    return (
      // The overlay is a decorative backdrop, not a keyboard-operable
      // control: it sits behind the focus-trapped Content, so it's
      // unreachable via Tab. Its keyboard equivalent is Escape, already
      // wired up in Dialog.Content.
      <div
        {...props}
        ref={forwardedRef}
        aria-hidden="true"
        data-state="open"
        onClick={composeEventHandlers(onClick, () => onOpenChange(false))}
      />
    );
  },
);

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  /** Called when Escape is pressed. Call `event.preventDefault()` to keep the dialog open. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  function DialogContent(
    { asChild = false, onEscapeKeyDown, children, ...props },
    forwardedRef,
  ) {
    const { onOpenChange, titleId, descriptionId } =
      useDialogContext("Content");
    const internalRef = React.useRef<HTMLDivElement>(null);

    useFocusTrap(internalRef);
    useEscapeKey((event) => {
      onEscapeKeyDown?.(event);
      if (!event.defaultPrevented) onOpenChange(false);
    });
    useScrollLock();

    const Comp = asChild ? Slot : "div";

    return (
      <Comp
        tabIndex={-1}
        {...props}
        ref={mergeRefs(forwardedRef, internalRef)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        data-state="open"
      >
        {children}
      </Comp>
    );
  },
);

export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  asChild?: boolean;
}

const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  function DialogTitle({ asChild = false, ...props }, forwardedRef) {
    const { titleId } = useDialogContext("Title");
    const Comp = asChild ? Slot : "h2";
    return <Comp {...props} ref={forwardedRef} id={titleId} />;
  },
);

export interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  asChild?: boolean;
}

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  DialogDescriptionProps
>(function DialogDescription({ asChild = false, id, ...props }, forwardedRef) {
  const { setDescriptionId } = useDialogContext("Description");
  const generatedId = useId();
  const descriptionId = id ?? generatedId;

  React.useEffect(() => {
    setDescriptionId(descriptionId);
    return () => setDescriptionId(undefined);
  }, [descriptionId, setDescriptionId]);

  const Comp = asChild ? Slot : "p";
  return <Comp {...props} ref={forwardedRef} id={descriptionId} />;
});

export interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const DialogClose = React.forwardRef<HTMLButtonElement, DialogCloseProps>(
  function DialogClose({ asChild = false, onClick, ...props }, forwardedRef) {
    const { onOpenChange } = useDialogContext("Close");
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        {...props}
        ref={forwardedRef}
        type={asChild ? undefined : "button"}
        onClick={composeEventHandlers(onClick, () => onOpenChange(false))}
      />
    );
  },
);

export const Dialog = {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Portal: DialogPortal,
  Overlay: DialogOverlay,
  Content: DialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
};

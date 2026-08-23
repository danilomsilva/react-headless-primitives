/**
 * Runs the consumer's handler first, then ours — unless the consumer
 * called `preventDefault()`, in which case ours is skipped.
 */
export function composeEventHandlers<E extends { defaultPrevented: boolean }>(
  originalHandler: ((event: E) => void) | undefined,
  ourHandler: (event: E) => void,
  {
    checkForDefaultPrevented = true,
  }: { checkForDefaultPrevented?: boolean } = {},
) {
  return function handleEvent(event: E) {
    originalHandler?.(event);
    if (!checkForDefaultPrevented || !event.defaultPrevented) {
      ourHandler(event);
    }
  };
}

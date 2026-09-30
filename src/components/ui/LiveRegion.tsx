/**
 * Visually hidden polite live region. Screen readers announce changes to
 * `message` without moving focus. Render once per concern.
 */
export function LiveRegion({ message, assertive }: { message: string; assertive?: boolean }) {
  return (
    <div
      className="sr-only"
      role="status"
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      {message}
    </div>
  );
}

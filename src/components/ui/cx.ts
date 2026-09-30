/** Joins truthy class names. Tiny stand-in for clsx. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

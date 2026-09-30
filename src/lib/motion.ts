/** Whether the user has asked the OS to minimise animation. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Scales an animation duration to zero when reduced motion is requested. */
export function motionDuration(ms: number): number {
  return prefersReducedMotion() ? 0 : ms;
}

/** easeOutCubic — fast start, gentle landing. Used for camera moves. */
export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/** easeInOutCubic — used for long fly-to arcs. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
}

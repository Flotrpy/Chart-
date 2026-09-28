/**
 * Serializes calls so that consecutive starts are at least `intervalMs`
 * apart. Waiting callers honour their AbortSignal, so a stale keystroke
 * never consumes a request slot.
 */
export function createRateLimiter(intervalMs: number, now: () => number = Date.now) {
  let nextSlot = 0;

  return async function schedule<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    const start = Math.max(now(), nextSlot);
    nextSlot = start + intervalMs;
    const wait = start - now();
    if (wait > 0) {
      await new Promise<void>((resolve, reject) => {
        const id = setTimeout(() => {
          signal?.removeEventListener('abort', onAbort);
          resolve();
        }, wait);
        const onAbort = () => {
          clearTimeout(id);
          reject(new DOMException('Aborted', 'AbortError'));
        };
        signal?.addEventListener('abort', onAbort, { once: true });
      });
    }
    signal?.throwIfAborted();
    return task();
  };
}

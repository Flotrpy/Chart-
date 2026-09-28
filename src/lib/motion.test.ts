import { afterEach, describe, expect, it, vi } from 'vitest';
import { easeInOutCubic, easeOutCubic, motionDuration } from './motion';

describe('easing', () => {
  it.each([easeOutCubic, easeInOutCubic])('%o maps 0→0 and 1→1 monotonically', (fn) => {
    expect(fn(0)).toBe(0);
    expect(fn(1)).toBe(1);
    let prev = -1;
    for (let t = 0; t <= 1; t += 0.05) {
      expect(fn(t)).toBeGreaterThanOrEqual(prev);
      prev = fn(t);
    }
  });
});

describe('motionDuration', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns 0 when reduced motion is requested', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce') }));
    expect(motionDuration(600)).toBe(0);
  });

  it('keeps the duration otherwise', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    expect(motionDuration(600)).toBe(600);
  });
});

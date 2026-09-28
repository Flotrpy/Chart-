import { describe, expect, it } from 'vitest';
import { getBuilding } from '../data';
import { floorScene } from './floorScene';
import { floorBottom, floorTop, shellHeight } from './floorMath';
import { growRing } from './geo';

const esb = getBuilding('empire-state-building');
if (!esb) throw new Error('fixture missing');

describe('floorScene', () => {
  it('leaves an exact gap in the shell for the highlighted floor', () => {
    const s = floorScene(esb, 10);
    expect(s.slab).toEqual({ base: floorBottom(esb, 10), height: floorTop(esb, 10) });
    expect(s.shellLower.height).toBe(s.slab?.base);
    expect(s.shellUpper.base).toBe(s.slab?.height);
    expect(s.shellUpper.height).toBe(shellHeight(esb));
  });

  it('covers multi-floor spans and clips spans at the roof', () => {
    expect(floorScene(esb, 61, 3).slab?.height).toBeCloseTo(floorTop(esb, 63));
    expect(floorScene(esb, 102, 3).slab?.height).toBeCloseTo(floorTop(esb, 102));
  });

  it('shows a full, stronger shell with no slab for the whole building', () => {
    const s = floorScene(esb, null);
    expect(s.slab).toBeNull();
    expect(s.shellLower).toEqual({ base: 0, height: shellHeight(esb) });
    expect(s.shellOpacity).toBeGreaterThan(floorScene(esb, 5).shellOpacity);
  });
});

describe('growRing', () => {
  it('pushes every vertex outward and keeps the ring closed', () => {
    const ring = esb.footprint.coordinates[0] ?? [];
    const grown = growRing(ring, 10);
    expect(grown[0]).toEqual(grown[grown.length - 1]);
    const span = (r: number[][]) =>
      Math.max(...r.map((p) => p[0] ?? 0)) - Math.min(...r.map((p) => p[0] ?? 0));
    expect(span(grown)).toBeGreaterThan(span(ring));
  });
});

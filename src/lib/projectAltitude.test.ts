import { describe, expect, it } from 'vitest';
import { projectToScreen, toMercator } from './projectAltitude';

describe('toMercator', () => {
  it('maps (0,0) to the world centre and scales altitude by latitude', () => {
    const [x, y, z] = toMercator([0, 0], 0);
    expect(x).toBeCloseTo(0.5);
    expect(y).toBeCloseTo(0.5);
    expect(z).toBe(0);
    const [, , zEq] = toMercator([0, 0], 100);
    const [, , zNyc] = toMercator([-74, 40.7], 100);
    expect(zNyc).toBeGreaterThan(zEq); // metres are "bigger" in mercator away from the equator
  });

  it('places NYC in the north-west quadrant', () => {
    const [x, y] = toMercator([-73.98, 40.75]);
    expect(x).toBeLessThan(0.5);
    expect(y).toBeLessThan(0.5);
  });
});

describe('projectToScreen', () => {
  const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

  it('maps clip space to CSS pixels with y pointing down', () => {
    expect(projectToScreen(identity, [0, 0, 0], 800, 600)).toEqual({ x: 400, y: 300 });
    expect(projectToScreen(identity, [1, 1, 0], 800, 600)).toEqual({ x: 800, y: 0 });
  });

  it('returns null for points behind the camera', () => {
    const flip = [...identity];
    flip[15] = -1;
    expect(projectToScreen(flip, [0, 0, 0], 800, 600)).toBeNull();
  });
});

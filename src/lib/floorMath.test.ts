import { describe, expect, it } from 'vitest';
import { BUILDINGS } from '../data';
import {
  clampFloor,
  floorAtHeight,
  floorBottom,
  floorMidpoint,
  floorRange,
  floorTop,
  shellHeight,
  type FloorGeometry,
} from './floorMath';

const tower: FloorGeometry = {
  totalFloors: 40,
  groundElevation: 0,
  floorHeightMeters: 3.9,
  lobbyHeightMeters: 6,
  heightMeters: 170,
};

describe('floorBottom / floorTop', () => {
  it('follows bottom = ground + lobby + (floor − 1) × height', () => {
    expect(floorBottom(tower, 1)).toBeCloseTo(6);
    expect(floorTop(tower, 1)).toBeCloseTo(9.9);
    expect(floorBottom(tower, 10)).toBeCloseTo(6 + 9 * 3.9);
    expect(floorTop(tower, 10)).toBeCloseTo(6 + 10 * 3.9);
  });

  it('offsets by ground elevation', () => {
    const raised = { ...tower, groundElevation: 12 };
    expect(floorBottom(raised, 1)).toBeCloseTo(18);
  });

  it('makes consecutive floors touch with no gaps', () => {
    for (let f = 1; f < tower.totalFloors; f++) {
      expect(floorTop(tower, f)).toBeCloseTo(floorBottom(tower, f + 1));
    }
  });

  it('uses the 3.9 m commercial default when floor height is missing', () => {
    const b: FloorGeometry = { totalFloors: 5, groundElevation: 0, lobbyHeightMeters: 0 };
    expect(floorTop(b, 2) - floorBottom(b, 2)).toBeCloseTo(3.9);
  });

  it.each([0, -1, 41, 2.5, Number.NaN])('rejects floor %s', (floor) => {
    expect(() => floorBottom(tower, floor)).toThrow(RangeError);
  });

  it('rejects non-positive floor heights', () => {
    expect(() => floorBottom({ ...tower, floorHeightMeters: 0 }, 1)).toThrow(RangeError);
  });
});

describe('floorRange', () => {
  it('covers multi-floor tenants from the lowest bottom to the highest top', () => {
    expect(floorRange(tower, 10, 3)).toEqual({
      bottom: floorBottom(tower, 10),
      top: floorTop(tower, 12),
    });
  });

  it('rejects spans running past the roof', () => {
    expect(() => floorRange(tower, 39, 3)).toThrow(RangeError);
    expect(() => floorRange(tower, 5, 0)).toThrow(RangeError);
  });
});

describe('floorMidpoint', () => {
  it('is halfway between bottom and top', () => {
    expect(floorMidpoint(tower, 1)).toBeCloseTo(7.95);
  });
});

describe('floorAtHeight', () => {
  it('inverts floorBottom for every floor', () => {
    for (let f = 1; f <= tower.totalFloors; f++) {
      expect(floorAtHeight(tower, floorBottom(tower, f) + 0.01)).toBe(f);
    }
  });

  it('returns 0 in the lobby and null outside the building', () => {
    expect(floorAtHeight(tower, 3)).toBe(0);
    expect(floorAtHeight(tower, -1)).toBeNull();
    expect(floorAtHeight(tower, 1000)).toBeNull();
  });
});

describe('shellHeight and clampFloor', () => {
  it('uses the roof height unless floors stack higher', () => {
    expect(shellHeight(tower)).toBe(170);
    expect(shellHeight({ ...tower, heightMeters: 50 })).toBeCloseTo(floorTop(tower, 40));
  });

  it('clamps into 1…totalFloors', () => {
    expect(clampFloor(tower, -3)).toBe(1);
    expect(clampFloor(tower, 99)).toBe(40);
    expect(clampFloor(tower, 7.4)).toBe(7);
  });
});

describe('seed buildings', () => {
  it.each(BUILDINGS.map((b) => [b.name, b] as const))(
    '%s: top floor stays under the roof',
    (_name, b) => {
      expect(floorTop(b, b.totalFloors)).toBeLessThanOrEqual(b.heightMeters);
    },
  );

  it('puts the Empire State 86th floor in the right band (~320 m)', () => {
    const esb = BUILDINGS.find((b) => b.id === 'empire-state-building');
    if (!esb) throw new Error('missing ESB');
    const mid = floorMidpoint(esb, 86);
    expect(mid).toBeGreaterThan(305);
    expect(mid).toBeLessThan(330);
  });
});

import { describe, expect, it } from 'vitest';
import { BUILDINGS, getBuilding } from './index';
import { validateBuildings } from '../lib/validateData';

describe('seed buildings', () => {
  it('passes validation', () => {
    expect(validateBuildings([...BUILDINGS])).toEqual([]);
  });

  it('includes the headline towers', () => {
    for (const id of ['empire-state-building', 'one-world-trade-center', 'chrysler-building']) {
      expect(getBuilding(id)).toBeDefined();
    }
  });

  it('places every centre inside New York City', () => {
    for (const b of BUILDINGS) {
      expect(b.center[0]).toBeGreaterThan(-74.26);
      expect(b.center[0]).toBeLessThan(-73.7);
      expect(b.center[1]).toBeGreaterThan(40.47);
      expect(b.center[1]).toBeLessThan(40.92);
    }
  });
});

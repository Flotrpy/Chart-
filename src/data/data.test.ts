import { describe, expect, it } from 'vitest';
import { BUILDINGS, TENANTS, getBuilding, occupiesFloor, tenantsInBuilding } from './index';
import { validateBuildings, validateTenants } from '../lib/validateData';

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

describe('seed tenants', () => {
  it('passes validation against the buildings', () => {
    expect(validateTenants([...TENANTS], [...BUILDINGS])).toEqual([]);
  });

  it('has about 25 tenants spread over at least 6 buildings', () => {
    expect(TENANTS.length).toBeGreaterThanOrEqual(24);
    expect(new Set(TENANTS.map((t) => t.buildingId)).size).toBeGreaterThanOrEqual(6);
  });

  it('uses only obviously fictional contact details', () => {
    for (const t of TENANTS) {
      if (t.phone) expect(t.phone).toMatch(/555/);
      if (t.website) expect(t.website).toMatch(/^https:\/\/example\.com\//);
    }
  });

  it('sorts building tenants by floor and handles multi-floor spans', () => {
    const floors = tenantsInBuilding('empire-state-building').map((t) => t.floor);
    expect(floors).toEqual([...floors].sort((a, b) => a - b));
    const acme = TENANTS.find((t) => t.id === 'acme-corp');
    expect(acme && occupiesFloor(acme, 11)).toBe(true);
    expect(acme && occupiesFloor(acme, 12)).toBe(false);
  });
});

describe('validators', () => {
  it('flag bad tenant floors and unknown buildings', () => {
    const base = TENANTS[0];
    if (!base) throw new Error('no tenants');
    const issues = validateTenants(
      [
        { ...base, id: 'too-high', floor: 500 },
        { ...base, id: 'nowhere', buildingId: 'missing' },
      ],
      [...BUILDINGS],
    );
    expect(issues.map((i) => i.id)).toEqual(['too-high', 'nowhere']);
  });
});

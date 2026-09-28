import { describe, expect, it } from 'vitest';
import { getBuilding, tenantsInBuilding } from '../data';
import { floorRows } from './floorList';

const esb = getBuilding('empire-state-building');
if (!esb) throw new Error('fixture missing');
const tenants = tenantsInBuilding(esb.id);

describe('floorRows', () => {
  it('lists every floor top-down by default', () => {
    const rows = floorRows(esb, tenants);
    expect(rows).toHaveLength(esb.totalFloors);
    expect(rows[0]?.floor).toBe(esb.totalFloors);
    expect(rows.at(-1)?.floor).toBe(1);
  });

  it('repeats multi-floor tenants on each floor they occupy', () => {
    const rows = floorRows(esb, tenants);
    const names = (f: number) => rows.find((r) => r.floor === f)?.tenants.map((t) => t.id);
    expect(names(10)).toEqual(['acme-corp']);
    expect(names(11)).toEqual(['acme-corp']);
    expect(names(12)).toEqual([]);
  });

  it('can hide empty floors but keeps the current one', () => {
    const rows = floorRows(esb, tenants, { occupiedOnly: true, keep: 50 });
    expect(rows.every((r) => r.tenants.length > 0 || r.floor === 50)).toBe(true);
    expect(rows.some((r) => r.floor === 50)).toBe(true);
  });
});

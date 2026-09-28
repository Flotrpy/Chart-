import { describe, expect, it } from 'vitest';
import { selectionReducer, type Selection } from './selection';

describe('selectionReducer', () => {
  it('selecting a tenant opens its building at its floor', () => {
    expect(selectionReducer(null, { type: 'selectTenant', tenantId: 'acme-corp' })).toEqual({
      buildingId: 'empire-state-building',
      floor: 10,
      tenantId: 'acme-corp',
    });
  });

  it('ignores unknown ids', () => {
    const state: Selection = { buildingId: 'chrysler-building', floor: null, tenantId: null };
    expect(selectionReducer(state, { type: 'selectTenant', tenantId: 'nope' })).toBe(state);
    expect(selectionReducer(null, { type: 'selectBuilding', buildingId: 'nope' })).toBeNull();
  });

  it('clamps floors into the building', () => {
    const s = selectionReducer(null, {
      type: 'selectBuilding',
      buildingId: 'flatiron-building',
      floor: 99,
    });
    expect(s?.floor).toBe(22);
  });

  it('keeps the tenant when moving within its floors, drops it otherwise', () => {
    const acme = selectionReducer(null, { type: 'selectTenant', tenantId: 'acme-corp' });
    expect(selectionReducer(acme, { type: 'selectFloor', floor: 11 })?.tenantId).toBe('acme-corp');
    expect(selectionReducer(acme, { type: 'selectFloor', floor: 30 })?.tenantId).toBeNull();
    expect(selectionReducer(acme, { type: 'selectFloor', floor: null })).toMatchObject({
      floor: null,
      tenantId: null,
    });
  });

  it('selectFloor without a building does nothing; clear resets', () => {
    expect(selectionReducer(null, { type: 'selectFloor', floor: 3 })).toBeNull();
    const s = selectionReducer(null, { type: 'selectTenant', tenantId: 'acme-corp' });
    expect(selectionReducer(s, { type: 'clear' })).toBeNull();
  });
});

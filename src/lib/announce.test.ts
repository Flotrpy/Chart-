import { describe, expect, it } from 'vitest';
import { describeSelection } from './announce';

describe('describeSelection', () => {
  it('describes a tenant with its floor span', () => {
    expect(
      describeSelection({ buildingId: 'empire-state-building', floor: 10, tenantId: 'acme-corp' }),
    ).toBe('Acme Corp, floors 10 to 11 of Empire State Building, highlighted.');
  });

  it('lists who is on a floor, or says it is empty', () => {
    expect(
      describeSelection({ buildingId: 'empire-state-building', floor: 21, tenantId: null }),
    ).toMatch(/Floor 21 of Empire State Building highlighted: Skyline Analytics/);
    expect(
      describeSelection({ buildingId: 'empire-state-building', floor: 50, tenantId: null }),
    ).toMatch(/no listed tenants/);
  });

  it('describes the whole-building view and nothing for no selection', () => {
    expect(
      describeSelection({ buildingId: 'flatiron-building', floor: null, tenantId: null }),
    ).toMatch(/Showing the whole building/);
    expect(describeSelection(null)).toBe('');
  });
});

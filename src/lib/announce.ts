import type { Selection } from './selection';
import { getBuilding, getTenant, tenantsInBuilding, occupiesFloor } from '../data';

/** Screen-reader sentence describing what the map is now showing. */
export function describeSelection(selection: Selection | null): string {
  if (!selection) return '';
  const building = getBuilding(selection.buildingId);
  if (!building) return '';
  const tenant = selection.tenantId ? getTenant(selection.tenantId) : undefined;
  if (tenant) {
    const span = tenant.floorsSpanned ?? 1;
    const floors =
      span > 1 ? `floors ${tenant.floor} to ${tenant.floor + span - 1}` : `floor ${tenant.floor}`;
    return `${tenant.name}, ${floors} of ${building.name}, highlighted.`;
  }
  if (selection.floor === null) {
    return `${building.name}, ${building.totalFloors} floors. Showing the whole building.`;
  }
  const on = tenantsInBuilding(building.id).filter((t) => occupiesFloor(t, selection.floor ?? 0));
  const who = on.length ? on.map((t) => t.name).join(', ') : 'no listed tenants';
  return `Floor ${selection.floor} of ${building.name} highlighted: ${who}.`;
}

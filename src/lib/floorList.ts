import type { Building, Tenant } from '../types/domain';

export interface FloorRow {
  floor: number;
  tenants: Tenant[];
}

/**
 * Floors top → bottom (like an elevator panel) with the tenants on each.
 * With `occupiedOnly`, empty floors are dropped except `keep` (the current
 * floor), so a 102-storey tower stays scannable.
 */
export function floorRows(
  building: Pick<Building, 'totalFloors'>,
  tenants: readonly Tenant[],
  { occupiedOnly = false, keep }: { occupiedOnly?: boolean; keep?: number | null } = {},
): FloorRow[] {
  const rows: FloorRow[] = [];
  for (let floor = building.totalFloors; floor >= 1; floor--) {
    const on = tenants.filter((t) => floor >= t.floor && floor < t.floor + (t.floorsSpanned ?? 1));
    if (occupiedOnly && on.length === 0 && floor !== keep) continue;
    rows.push({ floor, tenants: on });
  }
  return rows;
}

import { getBuilding, getTenant } from '../data';
import { clampFloor } from './floorMath';

/**
 * What the user is looking at. `floor` is null for the whole-building view;
 * `tenantId` is set when a specific tenant is open in the detail panel.
 */
export interface Selection {
  buildingId: string;
  floor: number | null;
  tenantId: string | null;
}

export type SelectionAction =
  | { type: 'selectTenant'; tenantId: string }
  | { type: 'selectBuilding'; buildingId: string; floor?: number | null }
  | { type: 'selectFloor'; floor: number | null }
  | { type: 'clear' };

/** Pure reducer; unknown ids leave state unchanged so bad deep links are harmless. */
export function selectionReducer(
  state: Selection | null,
  action: SelectionAction,
): Selection | null {
  switch (action.type) {
    case 'selectTenant': {
      const tenant = getTenant(action.tenantId);
      if (!tenant || !getBuilding(tenant.buildingId)) return state;
      return { buildingId: tenant.buildingId, floor: tenant.floor, tenantId: tenant.id };
    }
    case 'selectBuilding': {
      const building = getBuilding(action.buildingId);
      if (!building) return state;
      const floor =
        action.floor === undefined || action.floor === null
          ? null
          : clampFloor(building, action.floor);
      return { buildingId: building.id, floor, tenantId: null };
    }
    case 'selectFloor': {
      if (!state) return state;
      const building = getBuilding(state.buildingId);
      if (!building) return state;
      const floor = action.floor === null ? null : clampFloor(building, action.floor);
      const tenant = state.tenantId ? getTenant(state.tenantId) : undefined;
      // Keep the open tenant only if it is on the newly chosen floor.
      const keepTenant =
        tenant &&
        floor !== null &&
        floor >= tenant.floor &&
        floor < tenant.floor + (tenant.floorsSpanned ?? 1);
      return { ...state, floor, tenantId: keepTenant ? state.tenantId : null };
    }
    case 'clear':
      return null;
    default:
      return state;
  }
}

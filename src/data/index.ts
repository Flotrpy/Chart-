import type { Building, Tenant } from '../types/domain';
import buildingsJson from './buildings.json';
import tenantsJson from './tenants.json';

/**
 * Seed dataset. Buildings are real (public facts; footprints are simplified
 * approximations on the Manhattan grid). See README → "Adding data".
 */
export const BUILDINGS: readonly Building[] = buildingsJson as Building[];

const buildingsById = new Map(BUILDINGS.map((b) => [b.id, b]));

export function getBuilding(id: string): Building | undefined {
  return buildingsById.get(id);
}

/**
 * FICTIONAL tenants for demonstration. Names, phone numbers (555) and
 * websites (example.com) are invented and do not describe real occupants.
 */
export const TENANTS: readonly Tenant[] = tenantsJson as Tenant[];

const tenantsById = new Map(TENANTS.map((t) => [t.id, t]));

export function getTenant(id: string): Tenant | undefined {
  return tenantsById.get(id);
}

/** Tenants in a building, ordered bottom floor first. */
export function tenantsInBuilding(buildingId: string): Tenant[] {
  return TENANTS.filter((t) => t.buildingId === buildingId).sort((a, b) => a.floor - b.floor);
}

/** Whether a tenant occupies a floor (accounts for multi-floor tenants). */
export function occupiesFloor(tenant: Tenant, floor: number): boolean {
  return floor >= tenant.floor && floor < tenant.floor + (tenant.floorsSpanned ?? 1);
}

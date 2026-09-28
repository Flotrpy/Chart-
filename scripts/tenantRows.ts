import type { Building, Tenant, TenantCategory } from '../src/types/domain';
import { slugify } from './csv';

export interface RowError {
  row: number;
  message: string;
}

const optional = (v: string | undefined) => (v ? v : undefined);

/**
 * Converts CSV records to Tenant objects. Address and coordinates default to
 * the building's when omitted. Row numbers in errors are 1-based and count
 * the header, matching what spreadsheet apps show.
 */
export function rowsToTenants(
  records: Record<string, string>[],
  buildings: readonly Building[],
): { tenants: Tenant[]; errors: RowError[] } {
  const byId = new Map(buildings.map((b) => [b.id, b]));
  const tenants: Tenant[] = [];
  const errors: RowError[] = [];

  records.forEach((r, i) => {
    const row = i + 2;
    const name = r.name?.trim();
    if (!name) {
      errors.push({ row, message: 'missing name' });
      return;
    }
    const building = byId.get(r.buildingId ?? '');
    if (!building) {
      errors.push({ row, message: `unknown buildingId "${r.buildingId ?? ''}"` });
      return;
    }
    const floor = Number(r.floor);
    if (!Number.isInteger(floor)) {
      errors.push({ row, message: `floor "${r.floor ?? ''}" is not an integer` });
      return;
    }
    const spanned = r.floorsSpanned ? Number(r.floorsSpanned) : undefined;
    const lat = r.lat ? Number(r.lat) : building.center[1];
    const lng = r.lng ? Number(r.lng) : building.center[0];

    const tenant: Tenant = {
      id: r.id ? slugify(r.id) : slugify(name),
      name,
      category: (r.category || 'Consulting') as TenantCategory,
      buildingId: building.id,
      address: r.address || building.address,
      lat,
      lng,
      floor,
    };
    if (spanned && spanned > 1) tenant.floorsSpanned = spanned;
    const extras = {
      hours: optional(r.hours),
      phone: optional(r.phone),
      website: optional(r.website),
      description: optional(r.description),
      logo: optional(r.logo),
      unitId: optional(r.unitId),
    };
    for (const [k, v] of Object.entries(extras)) {
      if (v !== undefined) Object.assign(tenant, { [k]: v });
    }
    tenants.push(tenant);
  });

  return { tenants, errors };
}

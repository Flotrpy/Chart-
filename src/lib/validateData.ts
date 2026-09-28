import type { Building, Tenant } from '../types/domain';
import { TENANT_CATEGORIES } from '../types/domain';

export interface ValidationIssue {
  id: string;
  message: string;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isRing(ring: unknown): boolean {
  return (
    Array.isArray(ring) &&
    ring.length >= 4 &&
    ring.every((p) => Array.isArray(p) && p.length >= 2 && p.every((n) => typeof n === 'number')) &&
    JSON.stringify(ring[0]) === JSON.stringify(ring[ring.length - 1])
  );
}

/** Checks the building dataset for shape and internal consistency. */
export function validateBuildings(buildings: Building[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  for (const b of buildings) {
    if (!SLUG.test(b.id)) issues.push({ id: b.id, message: 'id must be a kebab-case slug' });
    if (seen.has(b.id)) issues.push({ id: b.id, message: 'duplicate building id' });
    seen.add(b.id);
    if (b.footprint?.type !== 'Polygon' || !isRing(b.footprint.coordinates?.[0])) {
      issues.push({ id: b.id, message: 'footprint must be a closed GeoJSON Polygon' });
    }
    if (!(b.totalFloors >= 1)) issues.push({ id: b.id, message: 'totalFloors must be ≥ 1' });
    if (!(b.floorHeightMeters > 0)) {
      issues.push({ id: b.id, message: 'floorHeightMeters must be > 0' });
    }
    // Must match lib/floorMath: floor 1 starts above the lobby.
    const stacked = b.lobbyHeightMeters + b.totalFloors * b.floorHeightMeters;
    if (b.heightMeters + 1e-6 < stacked * 0.85) {
      issues.push({
        id: b.id,
        message: `heightMeters ${b.heightMeters} is far below lobby + floors × storey height (${stacked.toFixed(1)})`,
      });
    }
  }
  return issues;
}

/** Checks tenants against the building list (floors in range, known category…). */
export function validateTenants(tenants: Tenant[], buildings: Building[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const byId = new Map(buildings.map((b) => [b.id, b]));
  const seen = new Set<string>();
  const categories: readonly string[] = TENANT_CATEGORIES;
  for (const t of tenants) {
    if (!SLUG.test(t.id)) issues.push({ id: t.id, message: 'id must be a kebab-case slug' });
    if (seen.has(t.id)) issues.push({ id: t.id, message: 'duplicate tenant id' });
    seen.add(t.id);
    if (!categories.includes(t.category)) {
      issues.push({ id: t.id, message: `unknown category "${t.category}"` });
    }
    const b = byId.get(t.buildingId);
    if (!b) {
      issues.push({ id: t.id, message: `unknown buildingId "${t.buildingId}"` });
      continue;
    }
    const top = t.floor + (t.floorsSpanned ?? 1) - 1;
    if (!Number.isInteger(t.floor) || t.floor < 1 || top > b.totalFloors) {
      issues.push({ id: t.id, message: `floor ${t.floor}–${top} outside 1–${b.totalFloors}` });
    }
    if (!Number.isFinite(t.lat) || !Number.isFinite(t.lng)) {
      issues.push({ id: t.id, message: 'lat/lng must be numbers' });
    }
  }
  return issues;
}

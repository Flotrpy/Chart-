import type { ResultKind } from '../../types/search';

const BUSINESS_KEYS = new Set(['amenity', 'shop', 'office', 'craft', 'healthcare', 'club']);
const LANDMARK_KEYS = new Set(['tourism', 'historic', 'memorial', 'man_made']);
const PLACE_KEYS = new Set(['place', 'boundary', 'natural', 'leisure', 'landuse', 'waterway']);

/** Maps an OSM key/value pair (plus address hints) to our result kind. */
export function kindFromOsm(key: string | undefined, hasHouseNumber: boolean): ResultKind {
  if (key && BUSINESS_KEYS.has(key)) return 'business';
  if (key && LANDMARK_KEYS.has(key)) return 'landmark';
  if (key === 'building') return hasHouseNumber ? 'address' : 'building';
  if (key && PLACE_KEYS.has(key)) return 'place';
  return hasHouseNumber || key === 'highway' ? 'address' : 'place';
}

/** Joins non-empty parts, removing consecutive duplicates ("New York, New York"). */
export function joinParts(parts: Array<string | undefined | null>, sep = ', '): string {
  const out: string[] = [];
  for (const p of parts) {
    const v = p?.trim();
    if (v && out[out.length - 1] !== v) out.push(v);
  }
  return out.join(sep);
}

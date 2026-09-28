import type { Building, Tenant } from '../types/domain';
import type { SearchResult } from '../types/search';

/** Common address spellings folded together so "350 Fifth Avenue" ≈ "350 5th ave". */
const SYNONYMS: Record<string, string> = {
  avenue: 'ave',
  av: 'ave',
  street: 'st',
  road: 'rd',
  plaza: 'plz',
  west: 'w',
  east: 'e',
  north: 'n',
  south: 's',
  first: '1st',
  second: '2nd',
  third: '3rd',
  fourth: '4th',
  fifth: '5th',
  sixth: '6th',
  seventh: '7th',
  eighth: '8th',
  ninth: '9th',
  tenth: '10th',
  '&': 'and',
};

/** Lowercases, strips accents and punctuation, and applies SYNONYMS. */
export function normalizeText(text: string): string[] {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9&]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => SYNONYMS[w] ?? w);
}

const FLOOR_PATTERNS = [
  /\b(\d{1,3})(?:st|nd|rd|th)?\s*(?:fl|flr|floor)\b\.?/i,
  /\b(?:fl|flr|floor)\.?\s*(\d{1,3})\b/i,
];

/** Pulls "10th floor" / "floor 10" / "fl 10" out of a query. */
export function extractFloor(query: string): { floor?: number; rest: string } {
  for (const re of FLOOR_PATTERNS) {
    const m = re.exec(query);
    if (m?.[1]) {
      return {
        floor: Number(m[1]),
        rest: (query.slice(0, m.index) + query.slice(m.index + m[0].length)).trim(),
      };
    }
  }
  return { rest: query };
}

interface Field {
  words: string[];
  weight: number;
}

interface IndexEntry {
  result: SearchResult;
  name: string[];
  fields: Field[];
  tenant?: Tenant;
}

/** Best weight at which `token` matches any field, or 0 if it matches nothing. */
function tokenWeight(token: string, fields: Field[]): number {
  let best = 0;
  for (const f of fields) {
    for (const w of f.words) {
      let score = 0;
      if (w === token) score = f.weight;
      else if (w.startsWith(token)) score = f.weight * 0.92;
      else if (token.length >= 4 && w.includes(token)) score = f.weight * 0.7;
      if (score > best) best = score;
    }
  }
  return best;
}

function tenantFloorLabel(t: Tenant): string {
  const span = t.floorsSpanned ?? 1;
  return span > 1 ? `Floors ${t.floor}–${t.floor + span - 1}` : `Floor ${t.floor}`;
}

export interface LocalIndex {
  entries: IndexEntry[];
}

/** Precomputes normalized fields once; searching is then allocation-light. */
export function buildLocalIndex(
  tenants: readonly Tenant[],
  buildings: readonly Building[],
): LocalIndex {
  const byId = new Map(buildings.map((b) => [b.id, b]));
  const entries: IndexEntry[] = [];

  for (const b of buildings) {
    const name = normalizeText(b.name);
    entries.push({
      name,
      result: {
        id: `building:${b.id}`,
        kind: 'building',
        title: b.name,
        subtitle: `${b.address} · ${b.totalFloors} floors`,
        position: b.center,
        source: 'local',
        buildingId: b.id,
      },
      fields: [
        { words: name, weight: 1 },
        { words: normalizeText((b.aliases ?? []).join(' ')), weight: 0.95 },
        { words: normalizeText(b.address), weight: 0.75 },
      ],
    });
  }

  for (const t of tenants) {
    const b = byId.get(t.buildingId);
    const name = normalizeText(t.name);
    entries.push({
      name,
      tenant: t,
      result: {
        id: `tenant:${t.id}`,
        kind: 'tenant',
        title: t.name,
        subtitle: `${tenantFloorLabel(t)} · ${b?.name ?? t.address}`,
        position: [t.lng, t.lat],
        source: 'local',
        tenantId: t.id,
        buildingId: t.buildingId,
        floor: t.floor,
      },
      fields: [
        { words: name, weight: 1 },
        { words: normalizeText(t.category), weight: 0.7 },
        { words: normalizeText([b?.name ?? '', ...(b?.aliases ?? [])].join(' ')), weight: 0.65 },
        { words: normalizeText(t.address), weight: 0.6 },
        { words: normalizeText(t.description ?? ''), weight: 0.35 },
      ],
    });
  }
  return { entries };
}

/**
 * Instant, offline search over the bundled dataset. Every query token must
 * match some field; the score averages token weights, with bonuses for a
 * name prefix match and for tenants on a requested floor.
 */
export function searchLocal(index: LocalIndex, query: string, limit = 6): SearchResult[] {
  const { floor, rest } = extractFloor(query);
  const tokens = normalizeText(rest);
  if (tokens.length === 0 && floor === undefined) return [];

  const scored: SearchResult[] = [];
  for (const entry of index.entries) {
    let total = 0;
    let matchedAll = true;
    for (const token of tokens) {
      const w = tokenWeight(token, entry.fields);
      if (w === 0) {
        matchedAll = false;
        break;
      }
      total += w;
    }
    if (!matchedAll) continue;

    let score = tokens.length ? total / tokens.length : 0.5;
    const joinedName = entry.name.join(' ');
    const joinedQuery = tokens.join(' ');
    if (joinedQuery && joinedName.startsWith(joinedQuery)) score += 0.1;

    if (floor !== undefined) {
      if (!entry.tenant) continue;
      const t = entry.tenant;
      const onFloor = floor >= t.floor && floor < t.floor + (t.floorsSpanned ?? 1);
      if (!onFloor) continue;
      score += 0.05;
    }
    scored.push({ ...entry.result, score: Math.min(1, score) });
  }

  return scored
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.title.localeCompare(b.title))
    .slice(0, limit);
}

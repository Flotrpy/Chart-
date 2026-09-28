import type { SearchResult } from '../types/search';
import { distanceMeters } from './geo';
import { normalizeText } from './localSearch';

export interface MergedResults {
  /** Bundled tenants/buildings — always listed first. */
  local: SearchResult[];
  /** Geocoder results with duplicates of local entries removed. */
  remote: SearchResult[];
  /** local ++ remote; the order used for keyboard navigation. */
  all: SearchResult[];
}

export interface MergeOptions {
  localLimit?: number;
  remoteLimit?: number;
  /** Two results closer than this with similar names are duplicates. */
  duplicateRadiusM?: number;
}

function similarTitles(a: string, b: string): boolean {
  const x = normalizeText(a).join(' ');
  const y = normalizeText(b).join(' ');
  if (!x || !y) return false;
  return x === y || x.startsWith(y) || y.startsWith(x);
}

function isDuplicate(candidate: SearchResult, kept: SearchResult[], radius: number): boolean {
  return kept.some(
    (k) =>
      k.id === candidate.id ||
      (distanceMeters(k.position, candidate.position) <= radius &&
        similarTitles(k.title, candidate.title)),
  );
}

/**
 * Local results first (they carry floor data), then remote results that are
 * not duplicates of something already listed. Remote order is preserved
 * because geocoders already rank by relevance and proximity bias.
 */
export function mergeResults(
  local: SearchResult[],
  remote: SearchResult[],
  { localLimit = 5, remoteLimit = 6, duplicateRadiusM = 75 }: MergeOptions = {},
): MergedResults {
  const keptLocal: SearchResult[] = [];
  for (const r of [...local].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))) {
    if (keptLocal.length >= localLimit) break;
    if (!keptLocal.some((k) => k.id === r.id)) keptLocal.push(r);
  }

  const keptRemote: SearchResult[] = [];
  for (const r of remote) {
    if (keptRemote.length >= remoteLimit) break;
    if (isDuplicate(r, keptLocal, duplicateRadiusM)) continue;
    if (isDuplicate(r, keptRemote, duplicateRadiusM)) continue;
    keptRemote.push(r);
  }

  return { local: keptLocal, remote: keptRemote, all: [...keptLocal, ...keptRemote] };
}

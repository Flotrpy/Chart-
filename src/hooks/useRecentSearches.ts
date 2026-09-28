import { useCallback, useState } from 'react';
import type { SearchResult } from '../types/search';
import { readJSON, writeJSON } from '../lib/storage';

const KEY = 'recent-searches';
export const MAX_RECENT = 6;

function isResult(v: unknown): v is SearchResult {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.title === 'string' &&
    Array.isArray(r.position) &&
    r.position.length === 2 &&
    r.position.every((n) => typeof n === 'number')
  );
}

function isResultList(v: unknown): v is SearchResult[] {
  return Array.isArray(v) && v.every(isResult);
}

/** Pure helper: most recent first, deduped by id, capped at MAX_RECENT. */
export function pushRecent(list: SearchResult[], item: SearchResult): SearchResult[] {
  const { score: _score, ...clean } = item;
  void _score;
  return [clean, ...list.filter((r) => r.id !== item.id)].slice(0, MAX_RECENT);
}

/**
 * Recently selected results, persisted to localStorage when available and
 * kept in memory otherwise (storage errors are swallowed by lib/storage).
 */
export function useRecentSearches() {
  const [recent, setRecent] = useState<SearchResult[]>(() =>
    readJSON<SearchResult[]>(KEY, [], isResultList).slice(0, MAX_RECENT),
  );

  const update = useCallback((fn: (prev: SearchResult[]) => SearchResult[]) => {
    setRecent((prev) => {
      const next = fn(prev);
      writeJSON(KEY, next);
      return next;
    });
  }, []);

  const add = useCallback(
    (item: SearchResult) => update((prev) => pushRecent(prev, item)),
    [update],
  );
  const remove = useCallback(
    (id: string) => update((prev) => prev.filter((r) => r.id !== id)),
    [update],
  );
  const clear = useCallback(() => update(() => []), [update]);

  return { recent, add, remove, clear };
}

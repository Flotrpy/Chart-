import { useEffect, useMemo, useState } from 'react';
import type { SearchResult } from '../types/search';
import { BUILDINGS, TENANTS } from '../data';
import { buildLocalIndex, searchLocal } from '../lib/localSearch';
import { mergeResults, type MergedResults } from '../lib/searchMerge';
import { cacheKey, type GeocoderClient } from '../lib/geocoder/client';
import { GeocoderError, isAbortError } from '../lib/geocoder/types';
import { useDebouncedValue } from './useDebouncedValue';

export const SEARCH_DEBOUNCE_MS = 250;
const MIN_REMOTE_LENGTH = 3;

const defaultIndex = buildLocalIndex(TENANTS, BUILDINGS);

export type SearchStatus = 'idle' | 'loading' | 'success' | 'error';

export interface SearchState extends MergedResults {
  status: SearchStatus;
  /** User-facing message when the remote geocoder failed. */
  error?: string;
  /** True when the error was caused by being offline. */
  offline: boolean;
}

interface RemoteState {
  key: string;
  results: SearchResult[];
  error?: string;
  offline: boolean;
}

/**
 * Local results update on every keystroke (instant, offline); remote
 * geocoding is debounced 250ms and the previous request is aborted as soon
 * as the query changes. `status` is derived, never set synchronously.
 */
export function useSearch(
  query: string,
  geocoder: GeocoderClient,
  index = defaultIndex,
): SearchState {
  const debounced = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const [remote, setRemote] = useState<RemoteState>({ key: '', results: [], offline: false });

  const local = useMemo(() => searchLocal(index, query), [index, query]);

  const liveKey = cacheKey(query);
  const debouncedKey = cacheKey(debounced);
  const wantsRemote = liveKey.length >= MIN_REMOTE_LENGTH;

  useEffect(() => {
    if (debouncedKey.length < MIN_REMOTE_LENGTH) return;
    const controller = new AbortController();
    geocoder
      .search(debounced, { signal: controller.signal })
      .then(({ results }) => setRemote({ key: debouncedKey, results, offline: false }))
      .catch((err: unknown) => {
        if (isAbortError(err) || controller.signal.aborted) return;
        const offline = err instanceof GeocoderError && err.provider === 'offline';
        setRemote({
          key: debouncedKey,
          results: [],
          offline,
          error: offline
            ? 'You’re offline — showing saved places only.'
            : 'Address search is unavailable right now. Showing saved places only.',
        });
      });
    return () => controller.abort();
  }, [debounced, debouncedKey, geocoder]);

  const remoteIsCurrent = wantsRemote && remote.key === liveKey;
  const merged = mergeResults(local, remoteIsCurrent ? remote.results : []);

  let status: SearchStatus = 'idle';
  if (liveKey.length > 0) {
    if (wantsRemote && !remoteIsCurrent) status = 'loading';
    else if (remoteIsCurrent && remote.error) status = 'error';
    else status = 'success';
  }

  return {
    ...merged,
    status,
    error: remoteIsCurrent ? remote.error : undefined,
    offline: remoteIsCurrent && remote.offline,
  };
}

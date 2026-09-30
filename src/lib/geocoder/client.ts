import type { SearchResult } from '../../types/search';
import { LruCache } from './lruCache';
import { GeocoderError, isAbortError, type GeocodeQuery, type GeocoderProvider } from './types';

export interface GeocoderClientOptions {
  /** Tried in order; the next one is used only if the previous one fails. */
  providers: GeocoderProvider[];
  bias?: GeocodeQuery['bias'];
  limit?: number;
  cacheSize?: number;
  cacheTtlMs?: number;
  /** Queries shorter than this return no remote results. */
  minLength?: number;
  isOnline?: () => boolean;
}

export interface GeocodeResponse {
  results: SearchResult[];
  /** Id of the provider that answered, or "cache". */
  provider: string;
}

export interface GeocoderClient {
  search(text: string, options?: { signal?: AbortSignal }): Promise<GeocodeResponse>;
}

/** Normalizes a query for cache lookups: case, whitespace and punctuation-insensitive. */
export function cacheKey(text: string): string {
  return text.toLowerCase().replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Wraps providers with an LRU cache, abort propagation and ordered fallback.
 * Aborts are re-thrown untouched so callers can ignore them; genuine
 * failures fall through to the next provider and only surface if all fail.
 */
export function createGeocoder(options: GeocoderClientOptions): GeocoderClient {
  const {
    providers,
    bias,
    limit = 8,
    cacheSize = 100,
    cacheTtlMs = 10 * 60_000,
    minLength = 3,
    isOnline = () => (typeof navigator === 'undefined' ? true : navigator.onLine !== false),
  } = options;
  if (providers.length === 0) throw new Error('createGeocoder needs at least one provider');
  const cache = new LruCache<SearchResult[]>(cacheSize, cacheTtlMs);

  return {
    async search(text, { signal } = {}) {
      const key = cacheKey(text);
      if (key.length < minLength) return { results: [], provider: 'none' };

      const cached = cache.get(key);
      if (cached) return { results: cached, provider: 'cache' };

      if (!isOnline()) throw new GeocoderError('offline', 'You appear to be offline');

      let lastError: unknown;
      for (const provider of providers) {
        signal?.throwIfAborted();
        try {
          const results = await provider.search({ text: text.trim(), limit, signal, bias });
          cache.set(key, results);
          return { results, provider: provider.id };
        } catch (err) {
          if (isAbortError(err) || signal?.aborted) throw err;
          lastError = err;
        }
      }
      const detail = lastError instanceof Error ? lastError.message : 'unknown error';
      throw new GeocoderError('all', `Search is unavailable right now (${detail})`);
    },
  };
}

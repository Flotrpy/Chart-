import type { BBox, LngLatTuple } from '../../types/map';
import type { SearchResult } from '../../types/search';

export interface GeocodeQuery {
  text: string;
  /** Maximum results to return. Providers may return fewer. */
  limit?: number;
  /** Aborts the underlying HTTP request (e.g. on the next keystroke). */
  signal?: AbortSignal;
  /** Location bias. Providers should prefer (not strictly limit to) this area. */
  bias?: {
    center: LngLatTuple;
    bbox: BBox;
  };
  /** BCP-47 language for result names. */
  language?: string;
}

/**
 * One geocoding backend. Swap providers by implementing this interface and
 * passing it to `createGeocoder` — nothing else in the app knows which
 * service is behind the search box.
 */
export interface GeocoderProvider {
  /** Short machine id, used as SearchResult.source and cache key prefix. */
  readonly id: string;
  /** Human label for attribution and error messages. */
  readonly label: string;
  search(query: GeocodeQuery): Promise<SearchResult[]>;
}

export class GeocoderError extends Error {
  readonly provider: string;
  readonly status?: number;

  constructor(provider: string, message: string, status?: number) {
    super(message);
    this.name = 'GeocoderError';
    this.provider = provider;
    this.status = status;
  }
}

/** True for errors caused by our own AbortController (not real failures). */
export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

import type { SearchResult } from '../../types/search';
import type { BBox } from '../../types/map';
import { GeocoderError, type GeocodeQuery, type GeocoderProvider } from './types';
import { joinParts, kindFromOsm } from './normalize';
import { createRateLimiter } from './rateLimit';

interface NominatimPlace {
  place_id: number;
  osm_type?: 'node' | 'way' | 'relation';
  osm_id?: number;
  lat: string;
  lon: string;
  category?: string;
  type?: string;
  name?: string;
  display_name: string;
  importance?: number;
  /** [minLat, maxLat, minLon, maxLon] as strings. */
  boundingbox?: [string, string, string, string];
  address?: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    borough?: string;
    postcode?: string;
  };
}

export interface NominatimOptions {
  baseUrl?: string;
  fetchFn?: typeof fetch;
  /**
   * Contact email sent as the `email` parameter. The Nominatim usage policy
   * asks apps to identify themselves; browsers forbid setting User-Agent, so
   * the email (plus the automatic Referer) is how a web app does that.
   */
  email?: string;
  /** Policy: absolute maximum of 1 request per second. */
  minIntervalMs?: number;
}

/** Identifies the app when running outside a browser (scripts, SSR, tests). */
export const NOMINATIM_USER_AGENT = 'nyc-floors-3d/0.1 (+https://github.com/flotrpy/chart-)';

export function nominatimPlaceToResult(p: NominatimPlace, index: number): SearchResult {
  const a = p.address ?? {};
  const street = joinParts([a.house_number, a.road], ' ');
  const title = p.name || street || p.display_name.split(',')[0] || 'Unnamed place';
  const subtitle = joinParts([
    p.name ? street : undefined,
    a.neighbourhood ?? a.suburb,
    a.borough ?? a.city,
    a.postcode,
  ]);
  const bb = p.boundingbox?.map(Number);
  const bbox: BBox | undefined =
    bb && bb.length === 4 && bb.every(Number.isFinite)
      ? [bb[2] as number, bb[0] as number, bb[3] as number, bb[1] as number]
      : undefined;

  return {
    id: `nominatim:${p.osm_type?.[0]?.toUpperCase() ?? 'P'}${p.osm_id ?? p.place_id}`,
    kind: kindFromOsm(p.category, Boolean(a.house_number)),
    title,
    subtitle: subtitle || undefined,
    position: [Number(p.lon), Number(p.lat)],
    bbox,
    source: 'nominatim',
    score: Math.min(0.8, Math.max(0.2, (p.importance ?? 0.5) - index * 0.03)),
  };
}

/** Nominatim (OSM Foundation) — used as a fallback when Photon fails. */
export function createNominatimProvider(options: NominatimOptions = {}): GeocoderProvider {
  const baseUrl = options.baseUrl ?? 'https://nominatim.openstreetmap.org/search';
  const fetchFn = options.fetchFn ?? ((...args) => fetch(...args));
  const schedule = createRateLimiter(options.minIntervalMs ?? 1100);

  return {
    id: 'nominatim',
    label: 'Nominatim',
    async search({ text, limit = 8, signal, bias, language = 'en' }: GeocodeQuery) {
      const params = new URLSearchParams({
        q: text,
        format: 'jsonv2',
        addressdetails: '1',
        limit: String(limit),
        countrycodes: 'us',
        'accept-language': language,
      });
      if (bias) {
        const [w, s, e, n] = bias.bbox;
        params.set('viewbox', [w, n, e, s].join(','));
        params.set('bounded', '0');
      }
      if (options.email) params.set('email', options.email);

      const headers: Record<string, string> = { Accept: 'application/json' };
      if (typeof window === 'undefined') headers['User-Agent'] = NOMINATIM_USER_AGENT;

      return schedule(async () => {
        const res = await fetchFn(`${baseUrl}?${params.toString()}`, { signal, headers });
        if (!res.ok) {
          throw new GeocoderError('nominatim', `Nominatim responded ${res.status}`, res.status);
        }
        const data = (await res.json()) as NominatimPlace[];
        return data.map(nominatimPlaceToResult);
      }, signal);
    },
  };
}

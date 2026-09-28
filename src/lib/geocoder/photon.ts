import type { SearchResult } from '../../types/search';
import type { BBox, LngLatTuple } from '../../types/map';
import { GeocoderError, type GeocodeQuery, type GeocoderProvider } from './types';
import { joinParts, kindFromOsm } from './normalize';

/** Subset of Photon's GeoJSON response we rely on. */
interface PhotonProperties {
  osm_id?: number;
  osm_type?: 'N' | 'W' | 'R';
  osm_key?: string;
  osm_value?: string;
  name?: string;
  housenumber?: string;
  street?: string;
  district?: string;
  locality?: string;
  city?: string;
  state?: string;
  postcode?: string;
  /** [minLon, maxLat, maxLon, minLat] — note Photon's unusual order. */
  extent?: [number, number, number, number];
}

interface PhotonFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: LngLatTuple };
  properties: PhotonProperties;
}

interface PhotonResponse {
  type: 'FeatureCollection';
  features: PhotonFeature[];
}

export interface PhotonOptions {
  baseUrl?: string;
  fetchFn?: typeof fetch;
}

export function photonFeatureToResult(f: PhotonFeature, index: number): SearchResult {
  const p = f.properties;
  const street = joinParts([p.housenumber, p.street], ' ');
  const title = p.name ?? (street || 'Unnamed place');
  const subtitle = joinParts([
    p.name ? street : undefined,
    p.district ?? p.locality,
    p.city,
    p.postcode,
  ]);
  const bbox: BBox | undefined = p.extent
    ? [p.extent[0], p.extent[3], p.extent[2], p.extent[1]]
    : undefined;

  return {
    id: `photon:${p.osm_type ?? 'X'}${p.osm_id ?? `${f.geometry.coordinates.join(',')}`}`,
    kind: kindFromOsm(p.osm_key, Boolean(p.housenumber)),
    title,
    subtitle: subtitle || undefined,
    position: f.geometry.coordinates,
    bbox,
    source: 'photon',
    // Photon returns results best-first; convert rank to a soft score.
    score: Math.max(0.2, 0.8 - index * 0.06),
  };
}

/** Photon (komoot) — free OSM geocoder with fast prefix/typeahead search. */
export function createPhotonProvider(options: PhotonOptions = {}): GeocoderProvider {
  const baseUrl = options.baseUrl ?? 'https://photon.komoot.io/api/';
  const fetchFn = options.fetchFn ?? ((...args) => fetch(...args));

  return {
    id: 'photon',
    label: 'Photon',
    async search({ text, limit = 8, signal, bias, language = 'en' }: GeocodeQuery) {
      const params = new URLSearchParams({ q: text, limit: String(limit), lang: language });
      if (bias) {
        params.set('lon', String(bias.center[0]));
        params.set('lat', String(bias.center[1]));
        params.set('bbox', bias.bbox.join(','));
        params.set('location_bias_scale', '0.4');
      }
      const res = await fetchFn(`${baseUrl}?${params.toString()}`, { signal });
      if (!res.ok) throw new GeocoderError('photon', `Photon responded ${res.status}`, res.status);
      const data = (await res.json()) as PhotonResponse;
      return (data.features ?? []).map(photonFeatureToResult);
    },
  };
}

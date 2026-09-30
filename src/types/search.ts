import type { BBox, LngLatTuple } from './map';

/** What a result represents; drives the icon and label in the dropdown. */
export type ResultKind = 'tenant' | 'building' | 'landmark' | 'business' | 'address' | 'place';

/** Where a result came from. Local = bundled tenant/building dataset. */
export type ResultSource = 'local' | 'recent' | string;

export interface SearchResult {
  /** Stable, unique across sources (e.g. "tenant:acme-corp", "photon:N123"). */
  id: string;
  kind: ResultKind;
  title: string;
  subtitle?: string;
  position: LngLatTuple;
  /** Optional extent to fit (large places like parks or neighbourhoods). */
  bbox?: BBox;
  source: ResultSource;
  /** Set for local results so selection can open the floor view. */
  tenantId?: string;
  buildingId?: string;
  floor?: number;
  /** Relevance in [0, 1]; higher is better. Used to order merged results. */
  score?: number;
}

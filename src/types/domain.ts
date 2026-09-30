import type { FeatureCollection, Polygon } from 'geojson';
import type { LngLatTuple } from './map';

export const TENANT_CATEGORIES = [
  'Technology',
  'Finance',
  'Legal',
  'Media',
  'Design',
  'Health',
  'Food & Drink',
  'Retail',
  'Nonprofit',
  'Consulting',
  'Observation',
] as const;

export type TenantCategory = (typeof TENANT_CATEGORIES)[number];

/**
 * Optional indoor floor plan for one floor: rooms/units as GeoJSON polygons
 * in WGS84. Not available from free data today; the renderer ignores it
 * until a floor-plan layer is added (see docs/LIMITATIONS.md).
 */
export type FloorPlan = FeatureCollection<Polygon, { name?: string; unitId?: string }>;

export interface Building {
  id: string;
  name: string;
  address: string;
  /** Representative point (entrance / centroid) for camera targeting. */
  center: LngLatTuple;
  /** Outline used for the glass shell and floor slab. WGS84 polygon. */
  footprint: Polygon;
  /** OSM way/relation id for cross-referencing with the basemap, if known. */
  osmId?: string;
  totalFloors: number;
  /** Roof height above ground in metres (architectural height excluded). */
  heightMeters: number;
  /** Height of ground level above the map's zero plane (0 without terrain). */
  groundElevation: number;
  /** Typical storey height. Default 3.9 m for commercial towers. */
  floorHeightMeters: number;
  /** Ground floor / lobby height, usually taller than a typical storey. */
  lobbyHeightMeters: number;
  /** Alternate names used by search ("ESB", "30 Rock"). */
  aliases?: string[];
  /** Keyed by floor number. Optional; see FloorPlan. */
  floorplans?: Record<string, FloorPlan>;
}

export interface Tenant {
  id: string;
  name: string;
  category: TenantCategory;
  buildingId: string;
  address: string;
  lat: number;
  lng: number;
  /** Lowest floor occupied (1 = ground floor / lobby level). */
  floor: number;
  /** Number of consecutive floors occupied, starting at `floor`. Default 1. */
  floorsSpanned?: number;
  hours?: string;
  phone?: string;
  website?: string;
  description?: string;
  /** URL or /public path to a logo image. */
  logo?: string;
  /** Room/unit id inside `Building.floorplans[floor]`, when plans exist. */
  unitId?: string;
}

export const DEFAULT_FLOOR_HEIGHT_M = 3.9;
export const DEFAULT_LOBBY_HEIGHT_M = 6;

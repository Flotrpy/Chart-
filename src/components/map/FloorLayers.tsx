import { useEffect } from 'react';
import type { Feature, FeatureCollection, Polygon } from 'geojson';
import type { ExpressionSpecification, FilterSpecification, GeoJSONSource } from 'maplibre-gl';
import { useMap } from './MapContext';
import type { MapLibreMap } from '../../lib/maplibre';
import type { Selection } from '../../lib/selection';
import type { Building } from '../../types/domain';
import { getBuilding, getTenant } from '../../data';
import { BUILDINGS_LAYER_ID } from '../../lib/mapStyle';
import { floorScene } from '../../lib/floorScene';
import { growRing } from '../../lib/geo';
import { motionDuration } from '../../lib/motion';

const SELECTION_SOURCE = 'selection-footprint';
const LAYER_IDS = {
  glow: 'selection-ground-glow',
  outline: 'selection-ground-outline',
  shellLower: 'selection-shell-lower',
  shellUpper: 'selection-shell-upper',
} as const;

const SHELL_COLOR = '#DCE8FB';
const FADE_MS = 600;
const BASE_FILTER: ExpressionSpecification = ['!=', ['get', 'hide_3d'], true];
const EMPTY: FeatureCollection<Polygon> = { type: 'FeatureCollection', features: [] };

function footprintFeature(b: Building): Feature<Polygon> {
  return { type: 'Feature', geometry: b.footprint, properties: { id: b.id } };
}

/** Adds sources/layers once. Later updates only change data and paint values. */
function ensureLayers(map: MapLibreMap): void {
  if (map.getSource(SELECTION_SOURCE)) return;
  map.addSource(SELECTION_SOURCE, { type: 'geojson', data: EMPTY });

  const labelsBelow = map.getLayer('road-label') ? 'road-label' : undefined;
  map.addLayer(
    {
      id: LAYER_IDS.glow,
      type: 'fill',
      source: SELECTION_SOURCE,
      paint: { 'fill-color': '#2563EB', 'fill-opacity': 0.12 },
    },
    labelsBelow,
  );
  map.addLayer(
    {
      id: LAYER_IDS.outline,
      type: 'line',
      source: SELECTION_SOURCE,
      paint: { 'line-color': '#2563EB', 'line-width': 1.5, 'line-opacity': 0.6 },
    },
    labelsBelow,
  );
  for (const id of [LAYER_IDS.shellLower, LAYER_IDS.shellUpper]) {
    map.addLayer(
      {
        id,
        type: 'fill-extrusion',
        source: SELECTION_SOURCE,
        paint: {
          'fill-extrusion-color': SHELL_COLOR,
          'fill-extrusion-opacity': 0,
          'fill-extrusion-opacity-transition': { duration: FADE_MS, delay: 0 },
          'fill-extrusion-height-transition': { duration: FADE_MS, delay: 0 },
          'fill-extrusion-base-transition': { duration: FADE_MS, delay: 0 },
          'fill-extrusion-vertical-gradient': false,
        },
      },
      labelsBelow,
    );
  }
}

/**
 * Hides OSM building parts that sit inside the selected footprint (grown a
 * little, since our footprints are approximations) so the opaque basemap
 * extrusion can't swallow the glass shell and floor slab.
 */
function buildingsFilter(b: Building | null): FilterSpecification {
  if (!b) return BASE_FILTER;
  const ring = growRing(b.footprint.coordinates[0] ?? [], 12);
  const within: ExpressionSpecification = ['within', { type: 'Polygon', coordinates: [ring] }];
  return ['all', BASE_FILTER, ['!', within]];
}

/** Translucent glass shell + ground glow for the selected building. */
export function FloorLayers({ selection }: { selection: Selection | null }) {
  const map = useMap();

  useEffect(() => {
    ensureLayers(map);
  }, [map]);

  useEffect(() => {
    const building = selection ? (getBuilding(selection.buildingId) ?? null) : null;
    const source = map.getSource<GeoJSONSource>(SELECTION_SOURCE);
    if (!source) return;
    const duration = motionDuration(FADE_MS);
    for (const id of [LAYER_IDS.shellLower, LAYER_IDS.shellUpper]) {
      map.setPaintProperty(id, 'fill-extrusion-opacity-transition', { duration, delay: 0 });
      map.setPaintProperty(id, 'fill-extrusion-height-transition', { duration, delay: 0 });
      map.setPaintProperty(id, 'fill-extrusion-base-transition', { duration, delay: 0 });
    }

    if (map.getLayer(BUILDINGS_LAYER_ID)) {
      map.setFilter(BUILDINGS_LAYER_ID, buildingsFilter(building));
      // Let the rest of the skyline recede a little while a building is open.
      map.setPaintProperty(BUILDINGS_LAYER_ID, 'fill-extrusion-opacity', building ? 0.82 : 0.94);
    }

    if (!building || !selection) {
      for (const id of [LAYER_IDS.shellLower, LAYER_IDS.shellUpper]) {
        map.setPaintProperty(id, 'fill-extrusion-opacity', 0);
      }
      source.setData(EMPTY);
      return;
    }

    const tenant = selection.tenantId ? getTenant(selection.tenantId) : undefined;
    const scene = floorScene(
      building,
      selection.floor,
      tenant && selection.floor === tenant.floor ? (tenant.floorsSpanned ?? 1) : 1,
    );
    source.setData({ type: 'FeatureCollection', features: [footprintFeature(building)] });

    const bands = [
      [LAYER_IDS.shellLower, scene.shellLower],
      [LAYER_IDS.shellUpper, scene.shellUpper],
    ] as const;
    for (const [id, band] of bands) {
      map.setPaintProperty(id, 'fill-extrusion-base', band.base);
      map.setPaintProperty(id, 'fill-extrusion-height', band.height);
      map.setPaintProperty(id, 'fill-extrusion-opacity', scene.shellOpacity);
    }
  }, [map, selection]);

  return null;
}

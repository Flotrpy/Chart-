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
const GLOW_SOURCE = 'selection-slab-glow';
const LAYER_IDS = {
  slab: 'selection-floor-slab',
  slabGlow: 'selection-floor-slab-glow',
  glow: 'selection-ground-glow',
  outline: 'selection-ground-outline',
  shellLower: 'selection-shell-lower',
  shellUpper: 'selection-shell-upper',
} as const;

const SHELL_COLOR = '#DCE8FB';
/** Matches --color-highlight. */
const SLAB_COLOR = '#F59E0B';
/** Glow shell is a little wider and taller than the slab. */
const GLOW_GROW_M = 1.6;
const GLOW_PAD_M = 0.5;
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
  map.addSource(GLOW_SOURCE, { type: 'geojson', data: EMPTY });

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
  const animated = {
    'fill-extrusion-opacity-transition': { duration: FADE_MS, delay: 0 },
    'fill-extrusion-height-transition': { duration: FADE_MS, delay: 0 },
    'fill-extrusion-base-transition': { duration: FADE_MS, delay: 0 },
  };
  // Opaque slab first so it writes depth before any translucent layer.
  map.addLayer(
    {
      id: LAYER_IDS.slab,
      type: 'fill-extrusion',
      source: SELECTION_SOURCE,
      paint: {
        'fill-extrusion-color': SLAB_COLOR,
        'fill-extrusion-opacity': 1,
        'fill-extrusion-base': 0,
        'fill-extrusion-height': 0,
        'fill-extrusion-vertical-gradient': false,
        ...animated,
      },
      layout: { visibility: 'none' },
    },
    labelsBelow,
  );
  map.addLayer(
    {
      id: LAYER_IDS.slabGlow,
      type: 'fill-extrusion',
      source: GLOW_SOURCE,
      paint: {
        'fill-extrusion-color': '#FCD34D',
        'fill-extrusion-opacity': 0,
        'fill-extrusion-base': 0,
        'fill-extrusion-height': 0,
        'fill-extrusion-vertical-gradient': false,
        ...animated,
      },
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
          'fill-extrusion-vertical-gradient': false,
          ...animated,
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

/**
 * Selection overlay: ground glow, translucent glass shell and the opaque
 * highlighted floor slab (with a soft glow) at its real-world height.
 *
 * Interior layouts are not available from free data, so a floor is shown
 * as a solid slab over the building footprint, not as rooms. When
 * `Building.floorplans` is populated, a per-floor plan layer can be added
 * here using the same slab base/height.
 */
export function FloorLayers({ selection }: { selection: Selection | null }) {
  const map = useMap();

  useEffect(() => {
    ensureLayers(map);
  }, [map]);

  useEffect(() => {
    const building = selection ? (getBuilding(selection.buildingId) ?? null) : null;
    const source = map.getSource<GeoJSONSource>(SELECTION_SOURCE);
    const glowSource = map.getSource<GeoJSONSource>(GLOW_SOURCE);
    if (!source || !glowSource) return;
    const duration = motionDuration(FADE_MS);
    const extrusions = [
      LAYER_IDS.slab,
      LAYER_IDS.slabGlow,
      LAYER_IDS.shellLower,
      LAYER_IDS.shellUpper,
    ];
    const setTransitions = (ms: number) => {
      for (const id of extrusions) {
        for (const prop of ['opacity', 'height', 'base'] as const) {
          map.setPaintProperty(id, `fill-extrusion-${prop}-transition`, { duration: ms, delay: 0 });
        }
      }
    };
    setTransitions(duration);

    if (map.getLayer(BUILDINGS_LAYER_ID)) {
      map.setFilter(BUILDINGS_LAYER_ID, buildingsFilter(building));
      // Let the rest of the skyline recede a little while a building is open.
      map.setPaintProperty(BUILDINGS_LAYER_ID, 'fill-extrusion-opacity', building ? 0.82 : 0.94);
    }

    if (!building || !selection) {
      for (const id of extrusions) map.setPaintProperty(id, 'fill-extrusion-opacity', 0);
      map.setLayoutProperty(LAYER_IDS.slab, 'visibility', 'none');
      source.setData(EMPTY);
      glowSource.setData(EMPTY);
      return;
    }

    const tenant = selection.tenantId ? getTenant(selection.tenantId) : undefined;
    const scene = floorScene(
      building,
      selection.floor,
      tenant && selection.floor === tenant.floor ? (tenant.floorsSpanned ?? 1) : 1,
    );
    source.setData({ type: 'FeatureCollection', features: [footprintFeature(building)] });
    glowSource.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [growRing(building.footprint.coordinates[0] ?? [], GLOW_GROW_M)],
          },
          properties: {},
        },
      ],
    });

    const bands = [
      [LAYER_IDS.shellLower, scene.shellLower],
      [LAYER_IDS.shellUpper, scene.shellUpper],
    ] as const;
    for (const [id, band] of bands) {
      map.setPaintProperty(id, 'fill-extrusion-base', band.base);
      map.setPaintProperty(id, 'fill-extrusion-height', band.height);
      map.setPaintProperty(id, 'fill-extrusion-opacity', scene.shellOpacity);
    }

    const slab = scene.slab;
    if (!slab) {
      map.setPaintProperty(LAYER_IDS.slabGlow, 'fill-extrusion-opacity', 0);
      map.setLayoutProperty(LAYER_IDS.slab, 'visibility', 'none');
      return;
    }

    const wasHidden = map.getLayoutProperty(LAYER_IDS.slab, 'visibility') === 'none';
    const applySlab = () => {
      map.setPaintProperty(LAYER_IDS.slab, 'fill-extrusion-base', slab.base);
      map.setPaintProperty(LAYER_IDS.slab, 'fill-extrusion-height', slab.height);
      map.setPaintProperty(LAYER_IDS.slabGlow, 'fill-extrusion-base', slab.base - GLOW_PAD_M);
      map.setPaintProperty(LAYER_IDS.slabGlow, 'fill-extrusion-height', slab.height + GLOW_PAD_M);
      map.setPaintProperty(LAYER_IDS.slabGlow, 'fill-extrusion-opacity', 0.35);
    };

    if (!wasHidden) {
      // Already showing a slab: it glides to the new floor like an elevator.
      applySlab();
      return;
    }

    // First appearance: collapse the slab onto its floor line, then let it
    // rise to full storey height (and the glow fade in) over ~600ms.
    setTransitions(0);
    map.setPaintProperty(LAYER_IDS.slab, 'fill-extrusion-base', slab.base);
    map.setPaintProperty(LAYER_IDS.slab, 'fill-extrusion-height', slab.base);
    map.setPaintProperty(LAYER_IDS.slabGlow, 'fill-extrusion-base', slab.base);
    map.setPaintProperty(LAYER_IDS.slabGlow, 'fill-extrusion-height', slab.base);
    map.setLayoutProperty(LAYER_IDS.slab, 'visibility', 'visible');
    const raf = requestAnimationFrame(() => {
      setTransitions(duration);
      applySlab();
      map.triggerRepaint();
    });
    return () => cancelAnimationFrame(raf);
  }, [map, selection]);

  return null;
}

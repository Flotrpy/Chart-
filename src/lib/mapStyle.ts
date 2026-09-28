import type { ExpressionSpecification, LayerSpecification, StyleSpecification } from 'maplibre-gl';
import {
  BUILDINGS_MIN_ZOOM,
  FONT_BOLD,
  FONT_ITALIC,
  FONT_REGULAR,
  TILE_PROVIDER,
} from './mapConfig';

/** Vector source id used by every basemap layer. */
export const BASEMAP_SOURCE = 'openmaptiles';

/** Layer id of the extruded OSM buildings (the glass shell dims this). */
export const BUILDINGS_LAYER_ID = 'buildings-3d';

/**
 * Light basemap palette. Deliberately soft and low-contrast so the 3D
 * buildings and the highlighted floor slab carry the visual weight.
 */
export const PALETTE = {
  land: '#F3F4F6',
  landDetail: '#EEF0F3',
  water: '#BFDBFE',
  waterLine: '#A5C8F5',
  park: '#D9EBD3',
  parkDeep: '#CFE4C7',
  sand: '#F1EBDD',
  roadMajor: '#FFFFFF',
  roadMajorCasing: '#E2E6EC',
  roadMinor: '#FFFFFF',
  roadMinorCasing: '#E8EBF0',
  motorway: '#FDF6E7',
  motorwayCasing: '#EADFC6',
  rail: '#D5D9E0',
  boundary: '#CBD2DC',
  labelText: '#334155',
  labelMuted: '#556274',
  waterLabel: '#3B6FB0',
  halo: '#FFFFFF',
  /** Building colour ramp, low-rise → supertall: cool light grey to warm white. */
  buildingLow: '#E3E6EB',
  buildingMid: '#EAEAEA',
  buildingHigh: '#F2EEE7',
  buildingTop: '#FBF8F3',
  buildingFootprint: '#E6E9EE',
} as const;

const nameField: ExpressionSpecification = [
  'coalesce',
  ['get', 'name:en'],
  ['get', 'name:latin'],
  ['get', 'name'],
];

function roadWidth(base: number, max: number): ExpressionSpecification {
  return ['interpolate', ['exponential', 1.5], ['zoom'], 10, base, 18, max];
}

function baseLayers(): LayerSpecification[] {
  return [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': PALETTE.land },
    },
    {
      id: 'landuse-detail',
      type: 'fill',
      source: BASEMAP_SOURCE,
      'source-layer': 'landuse',
      filter: ['in', ['get', 'class'], ['literal', ['residential', 'commercial', 'retail']]],
      paint: { 'fill-color': PALETTE.landDetail, 'fill-opacity': 0.6 },
    },
    {
      id: 'park',
      type: 'fill',
      source: BASEMAP_SOURCE,
      'source-layer': 'park',
      paint: { 'fill-color': PALETTE.park, 'fill-antialias': true },
    },
    {
      id: 'landcover-green',
      type: 'fill',
      source: BASEMAP_SOURCE,
      'source-layer': 'landcover',
      filter: ['in', ['get', 'class'], ['literal', ['grass', 'wood', 'farmland']]],
      paint: { 'fill-color': PALETTE.parkDeep, 'fill-opacity': 0.7 },
    },
    {
      id: 'landcover-sand',
      type: 'fill',
      source: BASEMAP_SOURCE,
      'source-layer': 'landcover',
      filter: ['==', ['get', 'class'], 'sand'],
      paint: { 'fill-color': PALETTE.sand },
    },
    {
      id: 'water',
      type: 'fill',
      source: BASEMAP_SOURCE,
      'source-layer': 'water',
      paint: { 'fill-color': PALETTE.water },
    },
    {
      id: 'waterway',
      type: 'line',
      source: BASEMAP_SOURCE,
      'source-layer': 'waterway',
      paint: { 'line-color': PALETTE.waterLine, 'line-width': 1 },
    },
    {
      id: 'aeroway',
      type: 'fill',
      source: BASEMAP_SOURCE,
      'source-layer': 'aeroway',
      minzoom: 11,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: { 'fill-color': PALETTE.landDetail },
    },
  ];
}

function roadLayers(): LayerSpecification[] {
  const minor: ExpressionSpecification = [
    'in',
    ['get', 'class'],
    ['literal', ['minor', 'service', 'track', 'path']],
  ];
  const major: ExpressionSpecification = [
    'in',
    ['get', 'class'],
    ['literal', ['primary', 'secondary', 'tertiary', 'trunk']],
  ];
  const motorway: ExpressionSpecification = ['==', ['get', 'class'], 'motorway'];
  const notTunnel: ExpressionSpecification = ['!=', ['get', 'brunnel'], 'tunnel'];

  return [
    {
      id: 'road-minor-casing',
      type: 'line',
      source: BASEMAP_SOURCE,
      'source-layer': 'transportation',
      minzoom: 13,
      filter: ['all', minor, notTunnel],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': PALETTE.roadMinorCasing, 'line-width': roadWidth(1, 14) },
    },
    {
      id: 'road-major-casing',
      type: 'line',
      source: BASEMAP_SOURCE,
      'source-layer': 'transportation',
      filter: ['all', major, notTunnel],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': PALETTE.roadMajorCasing, 'line-width': roadWidth(1.5, 24) },
    },
    {
      id: 'road-motorway-casing',
      type: 'line',
      source: BASEMAP_SOURCE,
      'source-layer': 'transportation',
      filter: ['all', motorway, notTunnel],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': PALETTE.motorwayCasing, 'line-width': roadWidth(2, 28) },
    },
    {
      id: 'road-minor',
      type: 'line',
      source: BASEMAP_SOURCE,
      'source-layer': 'transportation',
      minzoom: 13,
      filter: ['all', minor, notTunnel],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': PALETTE.roadMinor, 'line-width': roadWidth(0.5, 11) },
    },
    {
      id: 'road-major',
      type: 'line',
      source: BASEMAP_SOURCE,
      'source-layer': 'transportation',
      filter: ['all', major, notTunnel],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': PALETTE.roadMajor, 'line-width': roadWidth(1, 20) },
    },
    {
      id: 'road-motorway',
      type: 'line',
      source: BASEMAP_SOURCE,
      'source-layer': 'transportation',
      filter: ['all', motorway, notTunnel],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': PALETTE.motorway, 'line-width': roadWidth(1.5, 24) },
    },
    {
      id: 'rail',
      type: 'line',
      source: BASEMAP_SOURCE,
      'source-layer': 'transportation',
      minzoom: 12,
      filter: ['all', ['==', ['get', 'class'], 'rail'], notTunnel],
      paint: {
        'line-color': PALETTE.rail,
        'line-width': 1.2,
        'line-dasharray': [3, 2],
      },
    },
    {
      id: 'boundary',
      type: 'line',
      source: BASEMAP_SOURCE,
      'source-layer': 'boundary',
      filter: ['<=', ['get', 'admin_level'], 4],
      paint: { 'line-color': PALETTE.boundary, 'line-width': 1, 'line-dasharray': [2, 2] },
    },
  ];
}

/** OSM height in metres; `render_height` is always present in OpenMapTiles. */
const renderHeight: ExpressionSpecification = ['coalesce', ['get', 'render_height'], 0];
const renderMinHeight: ExpressionSpecification = ['coalesce', ['get', 'render_min_height'], 0];

function buildingLayers(): LayerSpecification[] {
  return [
    {
      // Flat footprints before extrusion kicks in, so blocks read at mid zoom.
      id: 'buildings-footprint',
      type: 'fill',
      source: BASEMAP_SOURCE,
      'source-layer': 'building',
      minzoom: 12,
      maxzoom: BUILDINGS_MIN_ZOOM + 1,
      paint: {
        'fill-color': PALETTE.buildingFootprint,
        'fill-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          12,
          0,
          12.5,
          0.8,
          BUILDINGS_MIN_ZOOM + 1,
          0,
        ],
      },
    },
    {
      id: BUILDINGS_LAYER_ID,
      type: 'fill-extrusion',
      source: BASEMAP_SOURCE,
      'source-layer': 'building',
      minzoom: BUILDINGS_MIN_ZOOM,
      filter: ['!=', ['get', 'hide_3d'], true],
      paint: {
        // Height-based gradient: taller towers drift warmer and brighter so the
        // skyline reads as layered depth rather than a flat grey mass.
        'fill-extrusion-color': [
          'interpolate',
          ['linear'],
          renderHeight,
          0,
          PALETTE.buildingLow,
          40,
          PALETTE.buildingMid,
          150,
          PALETTE.buildingHigh,
          300,
          PALETTE.buildingTop,
        ],
        // Buildings "grow" over half a zoom level instead of popping in.
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          BUILDINGS_MIN_ZOOM,
          0,
          BUILDINGS_MIN_ZOOM + 0.5,
          renderHeight,
        ],
        'fill-extrusion-base': [
          'interpolate',
          ['linear'],
          ['zoom'],
          BUILDINGS_MIN_ZOOM,
          0,
          BUILDINGS_MIN_ZOOM + 0.5,
          renderMinHeight,
        ],
        'fill-extrusion-opacity': 0.94,
        // Darkens the base of each wall: cheap ambient occlusion / soft shadow.
        'fill-extrusion-vertical-gradient': true,
      },
    },
  ];
}

const textHalo = {
  'text-halo-color': PALETTE.halo,
  'text-halo-width': 1.4,
  'text-halo-blur': 0.4,
} as const;

function labelLayers(): LayerSpecification[] {
  return [
    {
      id: 'water-label',
      type: 'symbol',
      source: BASEMAP_SOURCE,
      'source-layer': 'water_name',
      layout: {
        'text-field': nameField,
        'text-font': FONT_ITALIC,
        'text-size': 13,
        'text-letter-spacing': 0.05,
      },
      paint: { 'text-color': PALETTE.waterLabel, ...textHalo },
    },
    {
      id: 'road-label',
      type: 'symbol',
      source: BASEMAP_SOURCE,
      'source-layer': 'transportation_name',
      minzoom: 14,
      layout: {
        'symbol-placement': 'line',
        'text-field': nameField,
        'text-font': FONT_REGULAR,
        'text-size': ['interpolate', ['linear'], ['zoom'], 14, 10, 18, 13],
        'text-max-angle': 30,
      },
      paint: { 'text-color': PALETTE.labelMuted, ...textHalo },
    },
    {
      id: 'poi-label',
      type: 'symbol',
      source: BASEMAP_SOURCE,
      'source-layer': 'poi',
      minzoom: 15,
      filter: ['<=', ['get', 'rank'], 12],
      layout: {
        'text-field': nameField,
        'text-font': FONT_REGULAR,
        'text-size': 11,
        'text-max-width': 8,
        'text-padding': 4,
      },
      paint: { 'text-color': PALETTE.labelMuted, ...textHalo },
    },
    {
      id: 'place-neighbourhood',
      type: 'symbol',
      source: BASEMAP_SOURCE,
      'source-layer': 'place',
      minzoom: 12,
      maxzoom: 16,
      filter: ['in', ['get', 'class'], ['literal', ['neighbourhood', 'suburb', 'quarter']]],
      layout: {
        'text-field': nameField,
        'text-font': FONT_BOLD,
        'text-size': 11,
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.12,
        'text-max-width': 7,
      },
      paint: { 'text-color': PALETTE.labelMuted, ...textHalo },
    },
    {
      id: 'place-city',
      type: 'symbol',
      source: BASEMAP_SOURCE,
      'source-layer': 'place',
      maxzoom: 14,
      filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]],
      layout: {
        'text-field': nameField,
        'text-font': FONT_BOLD,
        'text-size': ['interpolate', ['linear'], ['zoom'], 8, 13, 13, 18],
      },
      paint: { 'text-color': PALETTE.labelText, ...textHalo },
    },
  ];
}

/**
 * Builds the complete light style. Returned as a fresh object each call so
 * callers can safely mutate it (e.g. tests, provider swaps).
 */
export function createMapStyle(): StyleSpecification {
  return {
    version: 8,
    name: 'NYC Floors Light',
    glyphs: TILE_PROVIDER.glyphsUrl,
    sources: {
      [BASEMAP_SOURCE]: {
        type: 'vector',
        url: TILE_PROVIDER.tileJsonUrl,
      },
    },
    light: {
      anchor: 'viewport',
      color: '#ffffff',
      intensity: 0.35,
      position: [1.3, 210, 35],
    },
    layers: [...baseLayers(), ...roadLayers(), ...buildingLayers(), ...labelLayers()],
  };
}

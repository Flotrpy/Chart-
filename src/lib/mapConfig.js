/**
 * Tile provider configuration. OpenFreeMap serves OpenMapTiles-schema vector
 * tiles with no API key. To swap providers, point these URLs at any other
 * OpenMapTiles-compatible TileJSON (e.g. a self-hosted Planetiler build) —
 * the style in mapStyle.ts only relies on standard OpenMapTiles layers.
 */
export const TILE_PROVIDER = {
    name: 'OpenFreeMap',
    tileJsonUrl: 'https://tiles.openfreemap.org/planet',
    glyphsUrl: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    attributionUrl: 'https://openfreemap.org',
};
export const FONT_REGULAR = ['Noto Sans Regular'];
export const FONT_BOLD = ['Noto Sans Bold'];
export const FONT_ITALIC = ['Noto Sans Italic'];
/** Five boroughs plus a little margin; used to bias geocoding and bound panning. */
export const NYC_BBOX = [-74.2591, 40.4774, -73.7004, 40.9176];
/** Panning limit — a bit wider than NYC so the edges don't feel cramped. */
export const MAX_BOUNDS = [-74.6, 40.35, -73.4, 41.1];
/** Default view: Midtown / Lower Manhattan skyline in a pitched 3/4 view. */
export const DEFAULT_CAMERA = {
    center: [-73.9855, 40.7484],
    zoom: 14.6,
    pitch: 60,
    bearing: -20,
};
/** Wide starting view the intro animation eases in from. */
export const INTRO_CAMERA = {
    center: [-73.99, 40.735],
    zoom: 12.2,
    pitch: 20,
    bearing: -5,
};
export const MIN_ZOOM = 9;
export const MAX_ZOOM = 19.5;
export const MAX_PITCH = 75;
/** Zoom at which buildings start extruding (fade in over one zoom level). */
export const BUILDINGS_MIN_ZOOM = 13;
export const FLY_DURATION_MS = 2000;
export const INTRO_DURATION_MS = 2400;

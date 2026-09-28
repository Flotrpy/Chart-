/**
 * Single entry point for MapLibre. MapLibre 6 ships its tile worker as a
 * separate ES module that it resolves relative to its own URL, which does
 * not survive bundling. Vite's `?worker&url` compiles the worker (and the
 * shared chunk it imports) into one file and gives us its final URL.
 */
import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';

setWorkerUrl(workerUrl);

export { Map as MapLibreMap, Marker, LngLatBounds } from 'maplibre-gl';
export type { MapOptions } from 'maplibre-gl';

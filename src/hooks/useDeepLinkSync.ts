import { useEffect } from 'react';
import type { MapLibreMap } from '../lib/maplibre';
import type { Selection } from '../lib/selection';
import type { CameraState } from '../types/map';
import { buildSearch } from '../lib/deepLink';

export function cameraOf(map: MapLibreMap): CameraState {
  const c = map.getCenter();
  return {
    center: [c.lng, c.lat],
    zoom: map.getZoom(),
    pitch: map.getPitch(),
    bearing: map.getBearing(),
  };
}

/**
 * Mirrors selection (immediately) and camera (after each move ends) into
 * the URL with replaceState, so reloading or sharing restores the view
 * without flooding the back button with history entries.
 */
export function useDeepLinkSync(map: MapLibreMap | null, selection: Selection | null): void {
  useEffect(() => {
    const write = () => {
      const search = buildSearch(selection, map ? cameraOf(map) : undefined);
      const url = `${window.location.pathname}${search}${window.location.hash}`;
      if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
        window.history.replaceState(window.history.state, '', url);
      }
    };
    write();
    if (!map) return;
    map.on('moveend', write);
    return () => {
      map.off('moveend', write);
    };
  }, [map, selection]);
}

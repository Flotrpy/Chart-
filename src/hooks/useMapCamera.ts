import { useSyncExternalStore } from 'react';
import type { MapLibreMap } from '../lib/maplibre';

export interface CameraAngles {
  bearing: number;
  pitch: number;
}

const cache = new WeakMap<MapLibreMap, CameraAngles>();

/**
 * Subscribes to bearing/pitch changes. Snapshot objects are cached per map so
 * React only re-renders when the rounded values actually change.
 */
export function useMapCamera(map: MapLibreMap): CameraAngles {
  return useSyncExternalStore(
    (onChange) => {
      map.on('rotate', onChange);
      map.on('pitch', onChange);
      return () => {
        map.off('rotate', onChange);
        map.off('pitch', onChange);
      };
    },
    () => {
      const next = { bearing: Math.round(map.getBearing()), pitch: Math.round(map.getPitch()) };
      const prev = cache.get(map);
      if (prev && prev.bearing === next.bearing && prev.pitch === next.pitch) return prev;
      cache.set(map, next);
      return next;
    },
  );
}

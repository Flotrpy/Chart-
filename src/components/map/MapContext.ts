import { createContext, useContext } from 'react';
import type { MapLibreMap } from '../../lib/maplibre';

/** The live map instance, available to children once the style has loaded. */
export const MapContext = createContext<MapLibreMap | null>(null);

export function useMap(): MapLibreMap {
  const map = useContext(MapContext);
  if (!map) throw new Error('useMap must be used inside <MapView> after the map has loaded');
  return map;
}

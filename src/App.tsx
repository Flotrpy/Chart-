import { useCallback, useEffect, useRef, useState } from 'react';
import { MapView } from './components/map/MapView';
import { MapControls } from './components/controls/MapControls';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { AttributionControl } from './components/controls/AttributionControl';
import { OnboardingHint } from './components/ui/OnboardingHint';
import { SearchBar } from './components/search/SearchBar';
import { geocoder } from './lib/geocoder';
import type { MapLibreMap } from './lib/maplibre';
import type { SearchResult } from './types/search';
import { FLY_DURATION_MS } from './lib/mapConfig';
import { easeInOutCubic, motionDuration } from './lib/motion';

/** Never trap users behind the splash if tiles are slow or blocked. */
const LOADING_TIMEOUT_MS = 10_000;

export default function App() {
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markReady = useCallback(() => setMapReady(true), []);
  const handleLoad = useCallback(
    (map: MapLibreMap) => {
      mapRef.current = map;
      markReady();
    },
    [markReady],
  );

  const handleSelect = useCallback((result: SearchResult) => {
    const map = mapRef.current;
    if (!map) return;
    const duration = motionDuration(FLY_DURATION_MS);
    if (result.bbox && result.kind === 'place') {
      map.fitBounds(result.bbox, { padding: 80, duration, maxZoom: 16 });
    } else {
      map.flyTo({ center: result.position, zoom: 17, duration, easing: easeInOutCubic });
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(markReady, LOADING_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [markReady]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-bg">
      <h1 className="sr-only">NYC Floors — 3D map of New York City</h1>
      <MapView onLoad={handleLoad} onError={markReady}>
        <div className="pointer-events-none absolute right-4 top-4 z-10">
          <MapControls />
        </div>
      </MapView>
      {mapReady && (
        <div className="pointer-events-none absolute bottom-16 left-1/2 z-20 -translate-x-1/2">
          <OnboardingHint />
        </div>
      )}
      <footer className="pointer-events-none absolute bottom-3 right-3 z-10 flex justify-end">
        <AttributionControl />
      </footer>
      <div className="pointer-events-none absolute left-4 right-[76px] top-4 z-30 sm:right-auto sm:w-[26rem]">
        <SearchBar geocoder={geocoder} onSelect={handleSelect} />
      </div>
      <LoadingScreen done={mapReady} />
    </div>
  );
}

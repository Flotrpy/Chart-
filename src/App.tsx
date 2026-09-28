import { useCallback, useEffect, useState } from 'react';
import { MapView } from './components/map/MapView';
import { MapControls } from './components/controls/MapControls';
import { LoadingScreen } from './components/ui/LoadingScreen';

/** Never trap users behind the splash if tiles are slow or blocked. */
const LOADING_TIMEOUT_MS = 10_000;

export default function App() {
  const [mapReady, setMapReady] = useState(false);
  const markReady = useCallback(() => setMapReady(true), []);

  useEffect(() => {
    const id = window.setTimeout(markReady, LOADING_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [markReady]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-bg">
      <h1 className="sr-only">NYC Floors — 3D map of New York City</h1>
      <MapView onLoad={markReady} onError={markReady}>
        <div className="pointer-events-none absolute right-4 top-4 z-10">
          <MapControls />
        </div>
      </MapView>
      <LoadingScreen done={mapReady} />
    </div>
  );
}

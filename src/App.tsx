import { MapView } from './components/map/MapView';
import { MapControls } from './components/controls/MapControls';

export default function App() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-bg">
      <h1 className="sr-only">NYC Floors — 3D map of New York City</h1>
      <MapView>
        <div className="pointer-events-none absolute right-4 top-4 z-10">
          <MapControls />
        </div>
      </MapView>
    </div>
  );
}

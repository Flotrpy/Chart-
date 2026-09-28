import { MapView } from './components/map/MapView';

export default function App() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-bg">
      <h1 className="sr-only">NYC Floors — 3D map of New York City</h1>
      <MapView />
    </div>
  );
}

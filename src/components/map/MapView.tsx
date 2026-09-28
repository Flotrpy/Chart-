import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MapLibreMap } from '../../lib/maplibre';
import { createMapStyle } from '../../lib/mapStyle';
import {
  DEFAULT_CAMERA,
  INTRO_CAMERA,
  INTRO_DURATION_MS,
  MAX_BOUNDS,
  MAX_PITCH,
  MAX_ZOOM,
  MIN_ZOOM,
} from '../../lib/mapConfig';
import { MapContext } from './MapContext';
import { supportsWebGL } from '../../lib/webgl';
import { easeInOutCubic, prefersReducedMotion } from '../../lib/motion';
import type { CameraState } from '../../types/map';

interface MapViewProps {
  /** Rendered inside the map context once the style has loaded. */
  children?: ReactNode;
  /** Called once when the map first finishes loading its style. */
  onLoad?: (map: MapLibreMap) => void;
  /** Called if the map cannot be created (e.g. WebGL unavailable). */
  onError?: (error: Error) => void;
  /** Camera to settle on. Defaults to the Manhattan skyline view. */
  initialCamera?: CameraState;
  /** Ease in from a wide view on load (skipped for reduced motion). */
  animateIntro?: boolean;
}

/**
 * Owns the single MapLibre instance for the app. The map is created once and
 * never re-created on re-render; everything else mutates it through context.
 */
export function MapView({
  children,
  onLoad,
  onError,
  initialCamera = DEFAULT_CAMERA,
  animateIntro = true,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const [failed, setFailed] = useState(() => !supportsWebGL());
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container || failed) return;

    const intro = animateIntro && !prefersReducedMotion();
    const start = intro ? INTRO_CAMERA : initialCamera;

    let instance: MapLibreMap;
    try {
      instance = new MapLibreMap({
        container,
        style: createMapStyle(),
        center: start.center,
        zoom: start.zoom,
        pitch: start.pitch,
        bearing: start.bearing,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        maxPitch: MAX_PITCH,
        maxBounds: MAX_BOUNDS,
        attributionControl: false,
        canvasContextAttributes: { antialias: true },
      });
    } catch (err) {
      // Deferred so the fallback renders on the next tick, not mid-effect.
      queueMicrotask(() => setFailed(true));
      onErrorRef.current?.(err instanceof Error ? err : new Error(String(err)));
      return;
    }

    instance.once('load', () => {
      setMap(instance);
      onLoadRef.current?.(instance);
      if (intro) {
        instance.easeTo({
          ...initialCamera,
          duration: INTRO_DURATION_MS,
          easing: easeInOutCubic,
          essential: false,
        });
      }
    });

    return () => {
      setMap(null);
      instance.remove();
    };
    // Props are read once: the map is never re-created after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0">
      <div
        ref={containerRef}
        className="absolute inset-0"
        role="region"
        aria-label="3D map of New York City. Drag to pan, right-drag or two-finger drag to rotate and tilt."
      />
      {failed && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <p className="max-w-sm text-muted">
            Your browser could not start the 3D map (WebGL is unavailable). Try another browser or
            enable hardware acceleration.
          </p>
        </div>
      )}
      {map && <MapContext.Provider value={map}>{children}</MapContext.Provider>}
    </div>
  );
}

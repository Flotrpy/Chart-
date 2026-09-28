import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Compass,
  LocateFixed,
  Maximize,
  Minimize,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  Square,
} from 'lucide-react';
import { useMap } from '../map/MapContext';
import { useMapCamera } from '../../hooks/useMapCamera';
import { GlassPanel } from '../ui/GlassPanel';
import { IconButton } from '../ui/IconButton';
import { ICON_PROPS } from '../ui/icons';
import { Marker } from '../../lib/maplibre';
import { DEFAULT_CAMERA, MAX_BOUNDS } from '../../lib/mapConfig';
import { motionDuration } from '../../lib/motion';

export type NotifyTone = 'info' | 'error';

interface MapControlsProps {
  /** Surface user-facing messages (e.g. geolocation denied). */
  onNotify?: (message: string, tone: NotifyTone) => void;
}

const ROTATE_STEP = 30;

function isInsideBounds(lng: number, lat: number): boolean {
  const [w, s, e, n] = MAX_BOUNDS;
  return lng >= w && lng <= e && lat >= s && lat <= n;
}

function Divider() {
  return <div className="mx-2 h-px bg-line" aria-hidden="true" />;
}

/** Custom, design-system-consistent replacement for MapLibre's built-in controls. */
export function MapControls({ onNotify }: MapControlsProps) {
  const map = useMap();
  const { bearing, pitch } = useMapCamera(map);
  const is3D = pitch > 5;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [locating, setLocating] = useState(false);
  const locationMarker = useRef<Marker | null>(null);

  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  useEffect(
    () => () => {
      locationMarker.current?.remove();
    },
    [],
  );

  const toggleTilt = useCallback(() => {
    map.easeTo({ pitch: is3D ? 0 : DEFAULT_CAMERA.pitch, duration: motionDuration(600) });
  }, [map, is3D]);

  const rotate = useCallback(
    (delta: number) =>
      map.easeTo({ bearing: map.getBearing() + delta, duration: motionDuration(400) }),
    [map],
  );

  const resetNorth = useCallback(
    () => map.easeTo({ bearing: 0, duration: motionDuration(500) }),
    [map],
  );

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {
        onNotify?.('Fullscreen is not available in this browser.', 'error');
      });
    }
  }, [onNotify]);

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      onNotify?.('Location is not supported by this browser.', 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        const { longitude: lng, latitude: lat } = coords;
        if (!isInsideBounds(lng, lat)) {
          onNotify?.('You appear to be outside New York City.', 'info');
          return;
        }
        if (!locationMarker.current) {
          const dot = document.createElement('div');
          dot.className =
            'h-4 w-4 rounded-full border-2 border-white bg-primary shadow-[0_0_0_6px_rgb(37_99_235/0.2)]';
          dot.setAttribute('aria-label', 'Your location');
          locationMarker.current = new Marker({ element: dot });
        }
        locationMarker.current.setLngLat([lng, lat]).addTo(map);
        map.flyTo({ center: [lng, lat], zoom: 16, duration: motionDuration(1800) });
      },
      (err) => {
        setLocating(false);
        onNotify?.(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission was denied.'
            : 'Could not determine your location.',
          'error',
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, [map, onNotify]);

  return (
    <nav aria-label="Map controls" className="pointer-events-auto flex flex-col gap-2">
      <GlassPanel radius="md" className="hidden flex-col p-0.5 md:flex">
        <IconButton label="Zoom in" onClick={() => map.zoomIn({ duration: motionDuration(300) })}>
          <Plus {...ICON_PROPS} />
        </IconButton>
        <Divider />
        <IconButton label="Zoom out" onClick={() => map.zoomOut({ duration: motionDuration(300) })}>
          <Minus {...ICON_PROPS} />
        </IconButton>
      </GlassPanel>

      <GlassPanel radius="md" className="flex flex-col p-0.5">
        <IconButton label={`Reset to north (bearing ${bearing}°)`} onClick={resetNorth}>
          <Compass
            {...ICON_PROPS}
            style={{ transform: `rotate(${-bearing - 45}deg)` }}
            className="text-primary transition-transform duration-100"
          />
        </IconButton>
        <div className="hidden flex-col md:flex">
          <Divider />
          <IconButton label="Rotate left" onClick={() => rotate(-ROTATE_STEP)}>
            <RotateCcw {...ICON_PROPS} />
          </IconButton>
          <IconButton label="Rotate right" onClick={() => rotate(ROTATE_STEP)}>
            <RotateCw {...ICON_PROPS} />
          </IconButton>
        </div>
        <Divider />
        <IconButton
          label={is3D ? 'Switch to 2D view' : 'Switch to 3D view'}
          onClick={toggleTilt}
          active={is3D}
        >
          {is3D ? <Box {...ICON_PROPS} /> : <Square {...ICON_PROPS} />}
        </IconButton>
      </GlassPanel>

      <GlassPanel radius="md" className="flex flex-col p-0.5">
        <IconButton label="Show my location" onClick={locate} disabled={locating}>
          <LocateFixed {...ICON_PROPS} className={locating ? 'animate-pulse' : undefined} />
        </IconButton>
        <Divider />
        <IconButton
          label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          onClick={toggleFullscreen}
        >
          {isFullscreen ? <Minimize {...ICON_PROPS} /> : <Maximize {...ICON_PROPS} />}
        </IconButton>
      </GlassPanel>
    </nav>
  );
}

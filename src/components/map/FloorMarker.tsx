import { useEffect, useRef } from 'react';
import type { CustomLayerInterface } from 'maplibre-gl';
import { Layers } from 'lucide-react';
import { useMap } from './MapContext';
import type { Building } from '../../types/domain';
import { floorMidpoint } from '../../lib/floorMath';
import { projectToScreen, toMercator } from '../../lib/projectAltitude';
import { ICON_PROPS_SM } from '../ui/icons';

interface FloorMarkerProps {
  building: Building;
  floor: number;
  span?: number;
  /** Tenant name, or the building name for an empty floor. */
  title: string;
}

const PROBE_LAYER = 'floor-marker-probe';

function floorLabel(floor: number, span: number): string {
  return span > 1 ? `Floors ${floor}–${floor + span - 1}` : `Floor ${floor}`;
}

/**
 * Label pinned to the selected floor's real height. MapLibre markers can't
 * float above the ground, so a no-op custom layer receives the camera's
 * clip matrix every frame and we project (lng, lat, altitude) ourselves,
 * writing the transform straight to the DOM (no React re-render per frame).
 */
export function FloorMarker({ building, floor, span = 1, title }: FloorMarkerProps) {
  const map = useMap();
  const elRef = useRef<HTMLDivElement>(null);
  const target = useRef(toMercator(building.center, floorMidpoint(building, floor, span)));

  useEffect(() => {
    target.current = toMercator(building.center, floorMidpoint(building, floor, span));
    map.triggerRepaint();
  }, [map, building, floor, span]);

  useEffect(() => {
    const layer: CustomLayerInterface = {
      id: PROBE_LAYER,
      type: 'custom',
      renderingMode: '3d',
      render(_gl, args) {
        const el = elRef.current;
        if (!el) return;
        const canvas = map.getCanvas();
        const p = projectToScreen(
          args.defaultProjectionData.mainMatrix,
          target.current,
          canvas.clientWidth,
          canvas.clientHeight,
        );
        if (!p) {
          el.style.visibility = 'hidden';
          return;
        }
        el.style.visibility = 'visible';
        el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
      },
    };
    if (!map.getLayer(PROBE_LAYER)) map.addLayer(layer);
    return () => {
      if (map.getLayer(PROBE_LAYER)) map.removeLayer(PROBE_LAYER);
    };
  }, [map]);

  return (
    <div
      ref={elRef}
      className="pointer-events-none absolute left-0 top-0 z-[5] will-change-transform"
      style={{ visibility: 'hidden' }}
      aria-hidden="true"
    >
      {/* Anchor: the label sits up-right of the point with a leader line. */}
      <div className="relative -translate-y-full">
        <div className="floor-marker-pop ml-3 mb-3 flex max-w-[16rem] items-center gap-2 rounded-md border border-white/70 bg-white/95 py-1.5 pl-2 pr-3 shadow-lift backdrop-blur">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-highlight text-white">
            <Layers {...ICON_PROPS_SM} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold leading-tight text-ink">
              {title}
            </span>
            <span className="block text-xs font-medium leading-tight text-amber-800">
              {floorLabel(floor, span)}
            </span>
          </span>
        </div>
        <span className="absolute bottom-0 left-0 h-3 w-3 origin-bottom-left rotate-[-45deg] border-l-2 border-highlight" />
        <span className="absolute -bottom-1.5 -left-1.5 h-3 w-3 rounded-full border-2 border-white bg-highlight shadow" />
      </div>
    </div>
  );
}

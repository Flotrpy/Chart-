import type { Building } from '../types/domain';
import type { CameraState } from '../types/map';
import { floorMidpoint, shellHeight } from './floorMath';

export interface FloorCamera extends CameraState {
  /** Height (m) of the point the camera looks at; lifts the view to the floor. */
  elevation: number;
}

/** Rough footprint size in metres, from its bbox diagonal. */
export function footprintSizeMeters(b: Building): number {
  const ring = b.footprint.coordinates[0] ?? [];
  const lngs = ring.map((p) => p[0] ?? 0);
  const lats = ring.map((p) => p[1] ?? 0);
  const dLat = (Math.max(...lats) - Math.min(...lats)) * 111_320;
  const dLng =
    (Math.max(...lngs) - Math.min(...lngs)) * 111_320 * Math.cos((b.center[1] * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

/**
 * 3/4 view aimed at the floor's real height. Zoom backs off for large
 * footprints so the whole floor plate stays in frame.
 */
export function cameraForFloor(b: Building, floor: number, span = 1, bearing = -20): FloorCamera {
  const size = footprintSizeMeters(b);
  const zoom = Math.max(16.6, Math.min(18.2, 18.2 - Math.log2(Math.max(size, 60) / 60)));
  return {
    center: b.center,
    zoom,
    pitch: 62,
    bearing,
    elevation: floorMidpoint(b, floor, span),
  };
}

/** Whole-building view: aimed a little below mid-height, zoomed to fit the tower. */
export function cameraForBuilding(b: Building, bearing = -20): FloorCamera {
  const h = shellHeight(b);
  const zoom = Math.max(15.2, Math.min(17, 17.2 - Math.log2(Math.max(h, 80) / 80) * 0.9));
  return { center: b.center, zoom, pitch: 58, bearing, elevation: h * 0.4 };
}

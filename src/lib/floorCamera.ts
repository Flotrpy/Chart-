import type { Building } from '../types/domain';
import type { CameraState, LngLatTuple } from '../types/map';
import { floorMidpoint, shellHeight } from './floorMath';

/** MapLibre's default vertical field of view is ~36.87°, i.e. tan(fov/2) = 1/3. */
const CAMERA_DISTANCE_PER_VIEWPORT_PX = 1.5;
/** Metres per pixel at zoom 0 on the equator for 512px tiles. */
const MPP_Z0 = 78_271.517;

function metersPerPixel(zoom: number, lat: number): number {
  return (MPP_Z0 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
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

/** Moves a point `meters` along a compass bearing. */
export function offsetAlongBearing(
  [lng, lat]: LngLatTuple,
  bearingDeg: number,
  meters: number,
): LngLatTuple {
  const b = (bearingDeg * Math.PI) / 180;
  const dNorth = Math.cos(b) * meters;
  const dEast = Math.sin(b) * meters;
  return [lng + dEast / (111_320 * Math.cos((lat * Math.PI) / 180)), lat + dNorth / 111_320];
}

/**
 * Camera that puts a point `heightM` above `target` at the centre of the
 * screen without terrain or centre elevation support.
 *
 * The screen-centre ray at pitch p crosses height h a horizontal distance
 * h·tan(p) before it reaches the ground, so we aim at a ground point that
 * far *beyond* the building. The camera is also h/cos(p) closer to the
 * elevated point than to the ground centre, so zoom backs off by that much
 * to keep the requested framing (`baseZoom` = framing for a ground target).
 */
export function lookAtHeight(
  target: LngLatTuple,
  heightM: number,
  {
    baseZoom,
    pitch,
    bearing,
    viewportHeight,
  }: {
    baseZoom: number;
    pitch: number;
    bearing: number;
    viewportHeight: number;
  },
): CameraState {
  const p = (pitch * Math.PI) / 180;
  const lat = target[1];
  const desired = CAMERA_DISTANCE_PER_VIEWPORT_PX * viewportHeight * metersPerPixel(baseZoom, lat);
  const toGround = desired + heightM / Math.cos(p);
  const zoom = Math.log2(
    (CAMERA_DISTANCE_PER_VIEWPORT_PX * viewportHeight * MPP_Z0 * Math.cos((lat * Math.PI) / 180)) /
      toGround,
  );
  return {
    center: offsetAlongBearing(target, bearing, heightM * Math.tan(p)),
    zoom: Math.max(13.5, zoom),
    pitch,
    bearing,
  };
}

/** 3/4 view centred on the floor's real height; tighter for small footprints. */
export function cameraForFloor(
  b: Building,
  floor: number,
  span = 1,
  bearing = -20,
  viewportHeight = 800,
): CameraState {
  const size = footprintSizeMeters(b);
  const baseZoom = Math.max(16.8, Math.min(18.4, 18.4 - Math.log2(Math.max(size, 60) / 60)));
  return lookAtHeight(b.center, floorMidpoint(b, floor, span), {
    baseZoom,
    pitch: 60,
    bearing,
    viewportHeight,
  });
}

/** Whole-building view: aimed below mid-height, framed to fit the tower. */
export function cameraForBuilding(b: Building, bearing = -20, viewportHeight = 800): CameraState {
  const h = shellHeight(b);
  const baseZoom = Math.max(15.6, Math.min(17.4, 17.6 - Math.log2(Math.max(h, 80) / 80) * 0.9));
  return lookAtHeight(b.center, h * 0.4, { baseZoom, pitch: 55, bearing, viewportHeight });
}

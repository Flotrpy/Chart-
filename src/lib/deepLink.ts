import type { CameraState } from '../types/map';
import type { Selection } from './selection';
import { MAX_PITCH, MAX_ZOOM, MIN_ZOOM } from './mapConfig';

/**
 * URL schema (all optional):
 *   ?tenant=acme-corp                  open a tenant (implies building + floor)
 *   ?building=chrysler-building&floor=12
 *   &cam=-73.98566,40.74844,16.5,60,-20   lng,lat,zoom,pitch,bearing
 * Unknown ids are ignored by the selection reducer, so links never break the app.
 */
export interface DeepLinkState {
  tenantId?: string;
  buildingId?: string;
  floor?: number;
  camera?: CameraState;
}

const ID = /^[a-z0-9-]{1,80}$/;

function round(n: number, digits: number): string {
  return String(Number(n.toFixed(digits)));
}

export function encodeCamera(c: CameraState): string {
  return [
    round(c.center[0], 5),
    round(c.center[1], 5),
    round(c.zoom, 2),
    round(c.pitch, 1),
    round(c.bearing, 1),
  ].join(',');
}

export function decodeCamera(value: string | null): CameraState | undefined {
  if (!value) return undefined;
  const parts = value.split(',').map(Number);
  if (parts.length !== 5 || !parts.every(Number.isFinite)) return undefined;
  const [lng, lat, zoom, pitch, bearing] = parts as [number, number, number, number, number];
  if (Math.abs(lng) > 180 || Math.abs(lat) > 85) return undefined;
  return {
    center: [lng, lat],
    zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom)),
    pitch: Math.min(MAX_PITCH, Math.max(0, pitch)),
    bearing: ((((bearing + 180) % 360) + 360) % 360) - 180,
  };
}

export function parseDeepLink(search: string): DeepLinkState {
  const params = new URLSearchParams(search);
  const state: DeepLinkState = {};
  const tenant = params.get('tenant');
  const building = params.get('building');
  const floor = Number(params.get('floor'));
  if (tenant && ID.test(tenant)) state.tenantId = tenant;
  else if (building && ID.test(building)) {
    state.buildingId = building;
    if (params.has('floor') && Number.isInteger(floor) && floor >= 1) state.floor = floor;
  }
  const camera = decodeCamera(params.get('cam'));
  if (camera) state.camera = camera;
  return state;
}

/** Builds the query string for a selection and (optionally) the camera. */
export function buildSearch(selection: Selection | null, camera?: CameraState): string {
  const params = new URLSearchParams();
  if (selection?.tenantId) params.set('tenant', selection.tenantId);
  else if (selection) {
    params.set('building', selection.buildingId);
    if (selection.floor !== null) params.set('floor', String(selection.floor));
  }
  if (camera) params.set('cam', encodeCamera(camera));
  const s = params.toString().replace(/%2C/g, ',');
  return s ? `?${s}` : '';
}

/** Absolute share URL for the current origin and path. */
export function buildShareUrl(
  selection: Selection | null,
  camera?: CameraState,
  location: Pick<Location, 'origin' | 'pathname'> = window.location,
): string {
  return `${location.origin}${location.pathname}${buildSearch(selection, camera)}`;
}

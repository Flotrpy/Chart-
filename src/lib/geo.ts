import type { LngLatTuple } from '../types/map';

const EARTH_RADIUS_M = 6_371_008.8;

/** Great-circle distance in metres. */
export function distanceMeters(a: LngLatTuple, b: LngLatTuple): number {
  const toRad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * toRad;
  const dLng = (b[0] - a[0]) * toRad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a[1] * toRad) * Math.cos(b[1] * toRad) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Grows (or shrinks) a polygon ring by roughly `meters`, scaling each vertex
 * away from the ring's vertex centroid. Good enough for small, convex-ish
 * building footprints; not a true geometric buffer.
 */
export function growRing(ring: number[][], meters: number): number[][] {
  const pts = ring.slice(0, -1);
  if (pts.length === 0) return ring;
  const cx = pts.reduce((s, p) => s + (p[0] ?? 0), 0) / pts.length;
  const cy = pts.reduce((s, p) => s + (p[1] ?? 0), 0) / pts.length;
  const kx = 111_320 * Math.cos((cy * Math.PI) / 180);
  const ky = 111_320;
  const grown = pts.map((p) => {
    const dx = ((p[0] ?? 0) - cx) * kx;
    const dy = ((p[1] ?? 0) - cy) * ky;
    const len = Math.hypot(dx, dy) || 1;
    const f = Math.max(0, (len + meters) / len);
    return [cx + (dx * f) / kx, cy + (dy * f) / ky];
  });
  return [...grown, grown[0] as number[]];
}

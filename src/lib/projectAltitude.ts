import type { LngLatTuple } from '../types/map';

const EARTH_CIRCUMFERENCE_M = 2 * Math.PI * 6_378_137;

/** Web Mercator in MapLibre's 0..1 world units; z is metres → mercator units. */
export function toMercator(
  [lng, lat]: LngLatTuple,
  altitudeM = 0,
): [x: number, y: number, z: number] {
  const x = (lng + 180) / 360;
  const y = (180 - (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))) / 360;
  const z = altitudeM / (EARTH_CIRCUMFERENCE_M * Math.cos((lat * Math.PI) / 180));
  return [x, y, z];
}

/**
 * Projects a mercator point through a column-major 4×4 clip matrix (the
 * `mainMatrix` MapLibre hands custom layers) to CSS pixels. Returns null
 * when the point is behind the camera.
 */
export function projectToScreen(
  matrix: ArrayLike<number>,
  [x, y, z]: [number, number, number],
  width: number,
  height: number,
): { x: number; y: number } | null {
  const m = (i: number) => matrix[i] ?? 0;
  const cx = m(0) * x + m(4) * y + m(8) * z + m(12);
  const cy = m(1) * x + m(5) * y + m(9) * z + m(13);
  const cw = m(3) * x + m(7) * y + m(11) * z + m(15);
  if (cw <= 1e-9) return null;
  return {
    x: ((cx / cw + 1) / 2) * width,
    y: ((1 - cy / cw) / 2) * height,
  };
}

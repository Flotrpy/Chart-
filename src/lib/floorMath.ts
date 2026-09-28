import type { Building } from '../types/domain';
import { DEFAULT_FLOOR_HEIGHT_M, DEFAULT_LOBBY_HEIGHT_M } from '../types/domain';

/** The subset of a building needed for vertical floor geometry. */
export type FloorGeometry = Pick<Building, 'totalFloors' | 'groundElevation'> &
  Partial<Pick<Building, 'floorHeightMeters' | 'lobbyHeightMeters' | 'heightMeters'>>;

export interface FloorRange {
  /** Height of the slab's underside above the map zero plane, metres. */
  bottom: number;
  /** Height of the slab's top (bottom of the next floor), metres. */
  top: number;
}

/**
 * Floor numbering convention: the lobby occupies the space from ground to
 * `lobbyHeightMeters`, and floor 1 is the first storey above it:
 *
 *   bottom(n) = groundElevation + lobbyHeight + (n − 1) × floorHeight
 *   top(n)    = bottom(n) + floorHeight
 *
 * Real buildings vary storey heights (mechanical floors, sky lobbies); this
 * uniform model is accurate enough to put the highlight on the right band
 * of the facade. Swap in per-floor heights here if you have them.
 */
function heights(b: FloorGeometry) {
  const floorHeight = b.floorHeightMeters ?? DEFAULT_FLOOR_HEIGHT_M;
  const lobbyHeight = b.lobbyHeightMeters ?? DEFAULT_LOBBY_HEIGHT_M;
  if (!(floorHeight > 0)) throw new RangeError('floorHeightMeters must be positive');
  if (!(lobbyHeight >= 0)) throw new RangeError('lobbyHeightMeters must be non-negative');
  return { floorHeight, lobbyHeight, ground: b.groundElevation ?? 0 };
}

function assertFloor(b: FloorGeometry, floor: number): void {
  if (!Number.isInteger(floor) || floor < 1 || floor > b.totalFloors) {
    throw new RangeError(`Floor ${floor} is outside 1–${b.totalFloors}`);
  }
}

export function floorBottom(b: FloorGeometry, floor: number): number {
  assertFloor(b, floor);
  const { floorHeight, lobbyHeight, ground } = heights(b);
  return ground + lobbyHeight + (floor - 1) * floorHeight;
}

export function floorTop(b: FloorGeometry, floor: number): number {
  return floorBottom(b, floor) + heights(b).floorHeight;
}

/** Vertical extent of `span` consecutive floors starting at `floor`. */
export function floorRange(b: FloorGeometry, floor: number, span = 1): FloorRange {
  if (!Number.isInteger(span) || span < 1) throw new RangeError('span must be a positive integer');
  const last = floor + span - 1;
  assertFloor(b, last);
  return { bottom: floorBottom(b, floor), top: floorTop(b, last) };
}

/** Mid-height of a floor, used to anchor the floating marker. */
export function floorMidpoint(b: FloorGeometry, floor: number, span = 1): number {
  const { bottom, top } = floorRange(b, floor, span);
  return (bottom + top) / 2;
}

/**
 * Inverse lookup: which floor contains height `h` (metres above zero)?
 * Returns 0 inside the lobby, null above the top floor or below ground.
 */
export function floorAtHeight(b: FloorGeometry, h: number): number | null {
  const { floorHeight, lobbyHeight, ground } = heights(b);
  const rel = h - ground;
  if (rel < 0) return null;
  if (rel < lobbyHeight) return 0;
  const floor = Math.floor((rel - lobbyHeight) / floorHeight) + 1;
  return floor > b.totalFloors ? null : floor;
}

/** Height of the glass shell: the roof, or the top floor if data disagree. */
export function shellHeight(b: FloorGeometry): number {
  const topFloor = floorTop(b, b.totalFloors);
  return Math.max(b.heightMeters ?? topFloor, topFloor);
}

/** Clamps any number into a valid floor for the building. */
export function clampFloor(b: FloorGeometry, floor: number): number {
  return Math.min(b.totalFloors, Math.max(1, Math.round(floor)));
}

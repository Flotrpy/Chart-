import type { Building } from '../types/domain';
import { floorRange, shellHeight } from './floorMath';

export interface Band {
  base: number;
  height: number;
}

/**
 * Vertical layout of the selection overlay. The glass shell is split into a
 * lower and an upper band around the highlighted floor so the opaque slab
 * is never drawn behind translucent glass (which would hide it through
 * depth testing, and would tint it even if it didn't).
 */
export interface FloorScene {
  shellLower: Band;
  shellUpper: Band;
  /** null in whole-building mode. */
  slab: Band | null;
  /** Whole-building mode shows a slightly stronger shell. */
  shellOpacity: number;
}

export const SHELL_OPACITY_FLOOR = 0.22;
export const SHELL_OPACITY_BUILDING = 0.4;

export function floorScene(b: Building, floor: number | null, span = 1): FloorScene {
  const roof = shellHeight(b);
  const ground = b.groundElevation;
  if (floor === null) {
    return {
      shellLower: { base: ground, height: roof },
      shellUpper: { base: roof, height: roof },
      slab: null,
      shellOpacity: SHELL_OPACITY_BUILDING,
    };
  }
  const { bottom, top } = floorRange(b, floor, Math.min(span, b.totalFloors - floor + 1));
  return {
    shellLower: { base: ground, height: bottom },
    shellUpper: { base: top, height: roof },
    slab: { base: bottom, height: top },
    shellOpacity: SHELL_OPACITY_FLOOR,
  };
}

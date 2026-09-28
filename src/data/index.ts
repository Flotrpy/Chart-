import type { Building } from '../types/domain';
import buildingsJson from './buildings.json';

/**
 * Seed dataset. Buildings are real (public facts; footprints are simplified
 * approximations on the Manhattan grid). See README → "Adding data".
 */
export const BUILDINGS: readonly Building[] = buildingsJson as Building[];

const buildingsById = new Map(BUILDINGS.map((b) => [b.id, b]));

export function getBuilding(id: string): Building | undefined {
  return buildingsById.get(id);
}

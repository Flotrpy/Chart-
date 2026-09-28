import type { LngLatTuple } from '../types/map';

export interface Landmark {
  name: string;
  position: LngLatTuple;
  /** Roof height in metres (for label priority; taller = more important). */
  heightMeters: number;
}

/** Iconic sights that should read clearly at mid zoom. Public, well-known facts. */
export const LANDMARKS: readonly Landmark[] = [
  { name: 'One World Trade Center', position: [-74.0134, 40.7127], heightMeters: 541 },
  { name: 'Central Park Tower', position: [-73.981, 40.7663], heightMeters: 472 },
  { name: '432 Park Avenue', position: [-73.9719, 40.7616], heightMeters: 426 },
  { name: 'Empire State Building', position: [-73.9857, 40.7484], heightMeters: 443 },
  { name: 'Bank of America Tower', position: [-73.9845, 40.7555], heightMeters: 366 },
  { name: 'Chrysler Building', position: [-73.9755, 40.7516], heightMeters: 319 },
  { name: '30 Rockefeller Plaza', position: [-73.9794, 40.7593], heightMeters: 259 },
  { name: 'Hudson Yards', position: [-74.0011, 40.7537], heightMeters: 395 },
  { name: 'Woolworth Building', position: [-74.0081, 40.7124], heightMeters: 241 },
  { name: 'Flatiron Building', position: [-73.9897, 40.7411], heightMeters: 87 },
  { name: 'Times Square', position: [-73.9855, 40.758], heightMeters: 0 },
  { name: 'Brooklyn Bridge', position: [-73.9969, 40.7061], heightMeters: 84 },
  { name: 'Statue of Liberty', position: [-74.0445, 40.6892], heightMeters: 93 },
];

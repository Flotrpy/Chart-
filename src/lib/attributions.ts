import { TILE_PROVIDER } from './mapConfig';

/** Credits required by the data and software licences (OSM ODbL first). */
export const ATTRIBUTIONS = [
  { label: '© OpenStreetMap contributors', href: 'https://www.openstreetmap.org/copyright' },
  { label: TILE_PROVIDER.name, href: TILE_PROVIDER.attributionUrl },
  { label: 'OpenMapTiles', href: 'https://openmaptiles.org/' },
  { label: 'MapLibre', href: 'https://maplibre.org/' },
] as const;

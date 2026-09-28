import { DEFAULT_CAMERA, NYC_BBOX } from '../mapConfig';
import { createGeocoder } from './client';
import { createNominatimProvider } from './nominatim';
import { createPhotonProvider } from './photon';

export { createGeocoder, type GeocoderClient, type GeocodeResponse } from './client';
export { GeocoderError, isAbortError, type GeocoderProvider } from './types';

/**
 * App-wide geocoder: Photon first (fast typeahead), Nominatim as fallback,
 * both biased to the five boroughs. To swap services, change this list.
 */
export const geocoder = createGeocoder({
  providers: [createPhotonProvider(), createNominatimProvider()],
  bias: { center: DEFAULT_CAMERA.center, bbox: NYC_BBOX },
});

/** [longitude, latitude] in WGS84 degrees, matching GeoJSON / MapLibre order. */
export type LngLatTuple = [lng: number, lat: number];

/** [west, south, east, north] bounding box in WGS84 degrees. */
export type BBox = [west: number, south: number, east: number, north: number];

/** Serializable camera state used for defaults, deep links and fly-to targets. */
export interface CameraState {
  center: LngLatTuple;
  zoom: number;
  pitch: number;
  bearing: number;
}

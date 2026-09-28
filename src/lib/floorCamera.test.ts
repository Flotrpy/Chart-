import { describe, expect, it } from 'vitest';
import { getBuilding } from '../data';
import { cameraForBuilding, cameraForFloor, lookAtHeight, offsetAlongBearing } from './floorCamera';
import { distanceMeters } from './geo';

const esb = getBuilding('empire-state-building');
const flatiron = getBuilding('flatiron-building');
if (!esb || !flatiron) throw new Error('fixtures missing');

const opts = { baseZoom: 17, pitch: 60, bearing: 0, viewportHeight: 800 };

describe('offsetAlongBearing', () => {
  it('moves north for bearing 0 and east for bearing 90', () => {
    const north = offsetAlongBearing([-74, 40.7], 0, 100);
    const east = offsetAlongBearing([-74, 40.7], 90, 100);
    expect(north[1]).toBeGreaterThan(40.7);
    expect(east[0]).toBeGreaterThan(-74);
    expect(distanceMeters([-74, 40.7], north)).toBeCloseTo(100, 0);
  });
});

describe('lookAtHeight', () => {
  it('is a plain ground camera at height 0', () => {
    const cam = lookAtHeight(esb.center, 0, opts);
    expect(cam.center[0]).toBeCloseTo(esb.center[0], 9);
    expect(cam.center[1]).toBeCloseTo(esb.center[1], 9);
    expect(cam.zoom).toBeCloseTo(17, 6);
  });

  it('aims h·tan(pitch) beyond the target and zooms out for height', () => {
    const cam = lookAtHeight(esb.center, 100, opts);
    expect(distanceMeters(esb.center, cam.center)).toBeCloseTo(100 * Math.tan(Math.PI / 3), 0);
    expect(cam.center[1]).toBeGreaterThan(esb.center[1]); // bearing 0 → further north
    expect(cam.zoom).toBeLessThan(17);
  });
});

describe('cameraForFloor / cameraForBuilding', () => {
  it('looks further past the building for higher floors', () => {
    const low = cameraForFloor(esb, 5, 1, 0);
    const high = cameraForFloor(esb, 90, 1, 0);
    expect(distanceMeters(esb.center, high.center)).toBeGreaterThan(
      distanceMeters(esb.center, low.center),
    );
    expect(high.zoom).toBeLessThan(low.zoom);
  });

  it('uses a pitched 3/4 view and frames small footprints tighter', () => {
    expect(cameraForFloor(esb, 10).pitch).toBeGreaterThanOrEqual(55);
    expect(cameraForFloor(flatiron, 1).zoom).toBeGreaterThan(cameraForFloor(esb, 1).zoom);
  });

  it('zooms out further for taller buildings', () => {
    expect(cameraForBuilding(esb).zoom).toBeLessThan(cameraForBuilding(flatiron).zoom);
  });
});

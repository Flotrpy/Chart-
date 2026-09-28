import { describe, expect, it } from 'vitest';
import { getBuilding } from '../data';
import { cameraForBuilding, cameraForFloor } from './floorCamera';
import { floorBottom, floorTop } from './floorMath';

const esb = getBuilding('empire-state-building');
const flatiron = getBuilding('flatiron-building');
if (!esb || !flatiron) throw new Error('fixtures missing');

describe('cameraForFloor', () => {
  it('aims at the middle of the target floor', () => {
    const cam = cameraForFloor(esb, 10);
    expect(cam.elevation).toBeGreaterThan(floorBottom(esb, 10));
    expect(cam.elevation).toBeLessThan(floorTop(esb, 10));
    expect(cam.center).toEqual(esb.center);
  });

  it('uses a pitched 3/4 view and zooms out for bigger footprints', () => {
    expect(cameraForFloor(esb, 10).pitch).toBeGreaterThanOrEqual(55);
    expect(cameraForFloor(esb, 10).zoom).toBeLessThan(cameraForFloor(flatiron, 5).zoom);
  });
});

describe('cameraForBuilding', () => {
  it('zooms out further for taller buildings', () => {
    expect(cameraForBuilding(esb).zoom).toBeLessThan(cameraForBuilding(flatiron).zoom);
  });
});

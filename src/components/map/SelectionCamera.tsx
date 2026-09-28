import { useEffect, useRef } from 'react';
import { useMap } from './MapContext';
import type { Selection } from '../../lib/selection';
import { getBuilding, getTenant } from '../../data';
import { cameraForBuilding, cameraForFloor } from '../../lib/floorCamera';
import { FLY_DURATION_MS } from '../../lib/mapConfig';
import { easeInOutCubic, motionDuration } from '../../lib/motion';
import { distanceMeters } from '../../lib/geo';

/** Flies the camera whenever the building or floor selection changes. */
export function SelectionCamera({ selection }: { selection: Selection | null }) {
  const map = useMap();
  const last = useRef<string>('');

  useEffect(() => {
    const key = selection ? `${selection.buildingId}:${selection.floor ?? 'all'}` : '';
    if (key === last.current) return;
    const wasSelected = last.current !== '';
    last.current = key;

    if (!selection) {
      return;
    }
    const building = getBuilding(selection.buildingId);
    if (!building) return;
    const tenant = selection.tenantId ? getTenant(selection.tenantId) : undefined;
    const bearing = map.getBearing();
    const viewportHeight = map.getCanvas().clientHeight || 800;
    const target =
      selection.floor === null
        ? cameraForBuilding(building, bearing, viewportHeight)
        : cameraForFloor(
            building,
            tenant?.floor ?? selection.floor,
            tenant ? (tenant.floorsSpanned ?? 1) : 1,
            bearing,
            viewportHeight,
          );

    // Long hops (another building) get a fly arc; floor changes a gentle ease.
    const c = map.getCenter();
    // Within ~1.5 km of the new target: ease (same building, new floor).
    const sameBuilding = wasSelected && distanceMeters([c.lng, c.lat], target.center) < 1500;
    const options = { ...target, essential: true, easing: easeInOutCubic };
    if (sameBuilding) map.easeTo({ ...options, duration: motionDuration(700) });
    else map.flyTo({ ...options, duration: motionDuration(FLY_DURATION_MS) });
  }, [map, selection]);

  return null;
}

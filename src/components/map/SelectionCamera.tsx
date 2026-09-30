import { useEffect, useRef } from 'react';
import { useMap } from './MapContext';
import type { Selection } from '../../lib/selection';
import { getBuilding, getTenant } from '../../data';
import { cameraForBuilding, cameraForFloor } from '../../lib/floorCamera';
import { FLY_DURATION_MS } from '../../lib/mapConfig';
import { easeInOutCubic, motionDuration } from '../../lib/motion';
import { distanceMeters } from '../../lib/geo';

export interface CameraPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface SelectionCameraProps {
  selection: Selection | null;
  /** Screen space covered by panels; the floor is centred in what remains. */
  padding: CameraPadding;
}

/** Flies the camera whenever the building or floor selection changes. */
export function SelectionCamera({ selection, padding }: SelectionCameraProps) {
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
    const viewportHeight = Math.max(
      200,
      (map.getCanvas().clientHeight || 800) - padding.top - padding.bottom,
    );
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
    const options = { ...target, padding, essential: true, easing: easeInOutCubic };
    if (sameBuilding) map.easeTo({ ...options, duration: motionDuration(700) });
    else map.flyTo({ ...options, duration: motionDuration(FLY_DURATION_MS) });
    // Padding changes alone (e.g. rotating the phone) shouldn't re-fly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selection]);

  return null;
}

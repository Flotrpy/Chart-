import { Briefcase, Building2, History, Landmark, MapPin, MapPinned, Store } from 'lucide-react';
import type { ResultKind } from '../../types/search';
import { ICON_PROPS_SM } from '../ui/icons';
import { cx } from '../ui/cx';

const ICONS = {
  tenant: Briefcase,
  building: Building2,
  landmark: Landmark,
  business: Store,
  address: MapPin,
  place: MapPinned,
} as const;

/** Rounded tile with the result-type icon; tenants get the accent colour. */
export function ResultIcon({ kind, recent }: { kind: ResultKind; recent?: boolean }) {
  const Icon = recent ? History : ICONS[kind];
  return (
    <span
      className={cx(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
        kind === 'tenant' && !recent ? 'bg-primary-soft text-primary' : 'bg-slate-100 text-muted',
      )}
      aria-hidden="true"
    >
      <Icon {...ICON_PROPS_SM} />
    </span>
  );
}

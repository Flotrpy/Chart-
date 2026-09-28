import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Building2, ChevronDown, ChevronUp, X } from 'lucide-react';
import type { Building, Tenant } from '../../types/domain';
import { tenantsInBuilding } from '../../data';
import { floorRows } from '../../lib/floorList';
import { GlassPanel } from '../ui/GlassPanel';
import { IconButton } from '../ui/IconButton';
import { ICON_PROPS_SM } from '../ui/icons';
import { cx } from '../ui/cx';

interface FloorSelectorProps {
  building: Building;
  floor: number | null;
  tenantId: string | null;
  onSelectFloor: (floor: number | null) => void;
  onSelectTenant: (tenant: Tenant) => void;
  onClose: () => void;
}

/**
 * Elevator-style floor list for the selected building. Floors use a roving
 * tabindex: Tab reaches the current floor, arrows move between floors
 * (highlighting each on the map), Enter/Space opens its first tenant.
 */
export function FloorSelector({
  building,
  floor,
  tenantId,
  onSelectFloor,
  onSelectTenant,
  onClose,
}: FloorSelectorProps) {
  const tenants = useMemo(() => tenantsInBuilding(building.id), [building.id]);
  const [occupiedOnly, setOccupiedOnly] = useState(true);
  const rows = useMemo(
    () => floorRows(building, tenants, { occupiedOnly, keep: floor }),
    [building, tenants, occupiedOnly, floor],
  );
  const listRef = useRef<HTMLUListElement>(null);
  const headingId = useId();

  // Keep the active floor visible as it changes (e.g. from search or arrows).
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[aria-current="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [floor, building.id]);

  const step = (delta: number) => {
    if (rows.length === 0) return;
    const idx = rows.findIndex((r) => r.floor === floor);
    // Rows run top → bottom, so "up" means a smaller index.
    const next = idx < 0 ? (delta > 0 ? rows.length - 1 : 0) : idx - delta;
    const row = rows[Math.max(0, Math.min(rows.length - 1, next))];
    if (row) onSelectFloor(row.floor);
  };

  const focusCurrent = () =>
    requestAnimationFrame(() =>
      listRef.current?.querySelector<HTMLElement>('[aria-current="true"]')?.focus(),
    );

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const keys: Record<string, () => void> = {
      ArrowUp: () => step(1),
      ArrowDown: () => step(-1),
      Home: () => rows[0] && onSelectFloor(rows[0].floor),
      End: () => rows.at(-1) && onSelectFloor(rows.at(-1)?.floor ?? 1),
    };
    const fn = keys[e.key];
    if (fn) {
      e.preventDefault();
      fn();
      focusCurrent();
    }
  };

  const occupied = new Set(
    tenants.flatMap((t) => Array.from({ length: t.floorsSpanned ?? 1 }, (_, i) => t.floor + i)),
  ).size;

  return (
    <GlassPanel
      role="region"
      aria-labelledby={headingId}
      className="pointer-events-auto flex max-h-full w-full flex-col overflow-hidden"
    >
      <header className="flex items-start gap-2 border-b border-line p-3 pr-1.5">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
          <Building2 {...ICON_PROPS_SM} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={headingId} className="truncate text-sm font-semibold text-ink">
            {building.name}
          </h2>
          <p className="text-xs text-muted">
            {building.totalFloors} floors · {tenants.length} tenant{tenants.length === 1 ? '' : 's'}{' '}
            on {occupied} floor{occupied === 1 ? '' : 's'}
          </p>
        </div>
        <IconButton label="Close building" onClick={onClose} className="-mt-1">
          <X {...ICON_PROPS_SM} />
        </IconButton>
      </header>

      <div className="flex items-center gap-1 border-b border-line px-2 py-1.5">
        <IconButton label="Go up one floor" onClick={() => step(1)}>
          <ChevronUp {...ICON_PROPS_SM} />
        </IconButton>
        <IconButton label="Go down one floor" onClick={() => step(-1)}>
          <ChevronDown {...ICON_PROPS_SM} />
        </IconButton>
        <button
          type="button"
          onClick={() => onSelectFloor(null)}
          aria-pressed={floor === null}
          className={cx(
            'ml-auto h-11 rounded-md px-3 text-xs font-medium transition-colors',
            floor === null ? 'bg-primary text-white' : 'text-primary hover:bg-primary-soft',
          )}
        >
          Show whole building
        </button>
      </div>

      <ul
        ref={listRef}
        onKeyDown={onKeyDown}
        aria-label={`Floors of ${building.name}`}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1"
      >
        {rows.map((row) => {
          const active = row.floor === floor;
          const tabbable = active || (floor === null && row === rows[0]);
          return (
            <li key={row.floor}>
              <div
                className={cx(
                  'mx-1.5 flex items-stretch rounded-md transition-colors',
                  active ? 'bg-highlight-soft' : 'hover:bg-slate-900/[0.04]',
                )}
              >
                <button
                  type="button"
                  tabIndex={tabbable ? 0 : -1}
                  aria-current={active ? 'true' : undefined}
                  aria-label={`Floor ${row.floor}${
                    row.tenants.length
                      ? `: ${row.tenants.map((t) => t.name).join(', ')}`
                      : ', no listed tenants'
                  }`}
                  onClick={() => onSelectFloor(row.floor)}
                  className="flex min-h-11 flex-1 items-center gap-3 rounded-md px-2 text-left"
                >
                  <span
                    className={cx(
                      'inline-flex h-7 min-w-9 items-center justify-center rounded-md px-1.5 text-xs font-semibold tabular-nums',
                      active
                        ? 'bg-highlight text-ink'
                        : row.tenants.length
                          ? 'bg-slate-100 text-ink'
                          : 'text-muted',
                    )}
                  >
                    {row.floor}
                  </span>
                  {!active && (
                    <span
                      className={cx(
                        'min-w-0 flex-1 truncate text-sm',
                        row.tenants.length ? 'text-ink' : 'text-muted',
                      )}
                    >
                      {row.tenants.length ? row.tenants.map((t) => t.name).join(', ') : '—'}
                    </span>
                  )}
                  {active && row.tenants.length === 0 && (
                    <span className="text-sm text-muted">No listed tenants</span>
                  )}
                </button>
              </div>
              {active && row.tenants.length > 0 && (
                <ul className="mx-1.5 mb-1 space-y-0.5 pl-12 pr-1">
                  {row.tenants.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => onSelectTenant(t)}
                        aria-pressed={t.id === tenantId}
                        className={cx(
                          'flex min-h-11 w-full items-center rounded-md px-2 text-left text-sm transition-colors',
                          t.id === tenantId
                            ? 'font-semibold text-ink'
                            : 'text-ink hover:bg-white/70',
                        )}
                      >
                        <span className="min-w-0 flex-1 truncate">{t.name}</span>
                        <span className="ml-2 shrink-0 text-xs text-muted">{t.category}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <label className="flex min-h-11 cursor-pointer items-center gap-2 border-t border-line px-3 text-xs text-muted">
        <input
          type="checkbox"
          checked={occupiedOnly}
          onChange={(e) => setOccupiedOnly(e.target.checked)}
          className="h-4 w-4 accent-[var(--color-primary)]"
        />
        Only floors with listed tenants
      </label>
    </GlassPanel>
  );
}

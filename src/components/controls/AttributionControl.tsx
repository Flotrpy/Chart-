import { useId, useState } from 'react';
import { Info, X } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import { ICON_PROPS_SM } from '../ui/icons';
import { cx } from '../ui/cx';
import { ATTRIBUTIONS } from '../../lib/attributions';

/**
 * Required map data attribution (OSM is ODbL — attribution must stay visible).
 * The short credit is always shown; the info button expands the full list.
 */
export function AttributionControl() {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();

  return (
    <GlassPanel
      radius="md"
      className="pointer-events-auto flex max-w-[calc(100vw-2rem)] items-center gap-1 py-1 pl-3 pr-1 text-xs text-muted"
    >
      <p className="truncate">
        <a
          href={ATTRIBUTIONS[0].href}
          target="_blank"
          rel="noreferrer"
          className="rounded-sm hover:text-ink hover:underline"
        >
          {ATTRIBUTIONS[0].label}
        </a>
      </p>
      <ul
        id={listId}
        className={cx('items-center gap-1', expanded ? 'flex' : 'hidden')}
        aria-label="Map credits"
      >
        {ATTRIBUTIONS.slice(1).map((a) => (
          <li key={a.href} className="flex items-center gap-1 whitespace-nowrap">
            <span aria-hidden="true">·</span>
            <a
              href={a.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-sm hover:text-ink hover:underline"
            >
              {a.label}
            </a>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls={listId}
        aria-label={expanded ? 'Hide map credits' : 'Show all map credits'}
        className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-900/5 hover:text-ink"
      >
        {expanded ? <X {...ICON_PROPS_SM} /> : <Info {...ICON_PROPS_SM} />}
      </button>
    </GlassPanel>
  );
}

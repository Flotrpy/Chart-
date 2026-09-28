import { useId, useRef, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import type { SearchResult } from '../../types/search';
import type { GeocoderClient } from '../../lib/geocoder/client';
import { useSearch } from '../../hooks/useSearch';
import { useRecentSearches } from '../../hooks/useRecentSearches';
import { GlassPanel } from '../ui/GlassPanel';
import { ICON_PROPS, ICON_PROPS_SM } from '../ui/icons';
import { cx } from '../ui/cx';
import { ResultIcon } from './ResultIcon';
import { KIND_LABEL } from './kindLabels';

interface SearchBarProps {
  geocoder: GeocoderClient;
  onSelect: (result: SearchResult) => void;
}

interface Section {
  key: string;
  title: string;
  items: SearchResult[];
  recent?: boolean;
}

function SkeletonRows() {
  return (
    <div className="space-y-1 p-2" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-2">
          <div className="h-9 w-9 animate-pulse rounded-md bg-slate-100" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-2.5 w-1/3 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Prominent search field with a grouped autocomplete dropdown. */
export function SearchBar({ geocoder, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const search = useSearch(query, geocoder);
  const { recent, add: addRecent, clear: clearRecent } = useRecentSearches();

  const trimmed = query.trim();
  const sections: Section[] = trimmed
    ? [
        { key: 'local', title: 'Tenants & buildings', items: search.local },
        { key: 'remote', title: 'Addresses & places', items: search.remote },
      ].filter((s) => s.items.length > 0)
    : recent.length
      ? [{ key: 'recent', title: 'Recent', items: recent, recent: true }]
      : [];

  const choose = (result: SearchResult) => {
    addRecent(result);
    setQuery(result.title);
    setOpen(false);
    inputRef.current?.blur();
    onSelect(result);
  };

  const showPanel = open && (trimmed.length > 0 || recent.length > 0);
  const noResults = trimmed && search.status !== 'loading' && search.all.length === 0;

  return (
    <div className="pointer-events-auto relative w-full">
      <GlassPanel className="flex h-12 items-center gap-2 pl-3 pr-1 shadow-lift">
        <Search {...ICON_PROPS} className="shrink-0 text-muted" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          placeholder="Search a business, address or place"
          aria-label="Search New York City"
          aria-controls={listId}
          autoComplete="off"
          spellCheck={false}
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
        />
        {search.status === 'loading' && (
          <Loader2 {...ICON_PROPS_SM} className="shrink-0 animate-spin text-muted" />
        )}
        {query && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted hover:bg-slate-900/5 hover:text-ink"
          >
            <X {...ICON_PROPS_SM} />
          </button>
        )}
      </GlassPanel>

      {showPanel && (
        <GlassPanel
          className="absolute left-0 right-0 top-14 max-h-[min(28rem,calc(100dvh-7rem))] animate-[slide-up_200ms_var(--ease-out)] overflow-y-auto overscroll-contain shadow-lift"
          onMouseDown={(e) => e.preventDefault()}
        >
          <div id={listId}>
            {sections.map((section) => (
              <div key={section.key} className="py-1.5">
                <div className="flex items-center justify-between px-4 pb-1 pt-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    {section.title}
                  </p>
                  {section.recent && (
                    <button
                      type="button"
                      onClick={clearRecent}
                      className="rounded px-1 text-xs text-primary hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <ul>
                  {section.items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => choose(item)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-slate-900/[0.04]"
                      >
                        <ResultIcon kind={item.kind} recent={section.recent} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">
                            {item.title}
                          </span>
                          {item.subtitle && (
                            <span className="block truncate text-xs text-muted">
                              {item.subtitle}
                            </span>
                          )}
                        </span>
                        <span
                          className={cx(
                            'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                            item.kind === 'tenant'
                              ? 'bg-highlight-soft text-amber-800'
                              : 'bg-slate-100 text-muted',
                          )}
                        >
                          {item.kind === 'tenant' && item.floor !== undefined
                            ? `Fl ${item.floor}`
                            : KIND_LABEL[item.kind]}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {search.status === 'loading' && search.remote.length === 0 && <SkeletonRows />}
            {search.error && (
              <p className="border-t border-line px-4 py-3 text-xs text-muted">{search.error}</p>
            )}
            {noResults && !search.error && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm font-medium text-ink">No matches for “{trimmed}”</p>
                <p className="mt-1 text-xs text-muted">
                  Try a street address, a landmark, or a tenant name like “Acme”.
                </p>
              </div>
            )}
          </div>
        </GlassPanel>
      )}
    </div>
  );
}

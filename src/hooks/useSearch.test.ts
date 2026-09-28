import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { GeocoderClient } from '../lib/geocoder/client';
import { GeocoderError } from '../lib/geocoder/types';
import type { SearchResult } from '../types/search';
import { SEARCH_DEBOUNCE_MS, useSearch } from './useSearch';

const place: SearchResult = {
  id: 'photon:1',
  kind: 'place',
  title: 'Bryant Park',
  position: [-73.9832, 40.7536],
  source: 'photon',
};

describe('useSearch', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns local results immediately and remote after the debounce', async () => {
    const search = vi.fn<GeocoderClient['search']>(async () => ({
      results: [place],
      provider: 'photon',
    }));
    const client: GeocoderClient = { search };
    const { result, rerender } = renderHook(({ q }) => useSearch(q, client), {
      initialProps: { q: '' },
    });
    rerender({ q: 'acme' });
    expect(result.current.local[0]?.tenantId).toBe('acme-corp');
    expect(result.current.status).toBe('loading');
    expect(search).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    });
    expect(search).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('success');
    expect(result.current.all.map((r) => r.source)).toEqual(['local', 'photon']);
  });

  it('aborts the in-flight request when the query changes', async () => {
    const signals: AbortSignal[] = [];
    const search = vi.fn<GeocoderClient['search']>(
      (_text, opts) =>
        new Promise((_, reject) => {
          if (opts?.signal) signals.push(opts.signal);
          opts?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        }),
    );
    const client: GeocoderClient = { search };
    const { rerender } = renderHook(({ q }) => useSearch(q, client), {
      initialProps: { q: 'bryant' },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    });
    rerender({ q: 'bryant park' });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    });
    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
  });

  it('reports geocoder failures but keeps local results', async () => {
    const search = vi.fn<GeocoderClient['search']>(async () => {
      throw new GeocoderError('all', 'down');
    });
    const client: GeocoderClient = { search };
    const { result } = renderHook(() => useSearch('chrysler', client));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    });
    expect(result.current.status).toBe('error');
    expect(result.current.error).toMatch(/unavailable/i);
    expect(result.current.local.length).toBeGreaterThan(0);
  });

  it('flags offline errors distinctly', async () => {
    const search = vi.fn<GeocoderClient['search']>(async () => {
      throw new GeocoderError('offline', 'offline');
    });
    const client: GeocoderClient = { search };
    const { result } = renderHook(() => useSearch('times square', client));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    });
    expect(result.current.offline).toBe(true);
  });

  it('stays idle for an empty query', () => {
    const search = vi.fn<GeocoderClient['search']>();
    const client: GeocoderClient = { search };
    const { result } = renderHook(() => useSearch('', client));
    expect(result.current.status).toBe('idle');
    expect(result.current.all).toEqual([]);
  });
});

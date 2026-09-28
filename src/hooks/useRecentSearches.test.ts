import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { SearchResult } from '../types/search';
import { MAX_RECENT, pushRecent, useRecentSearches } from './useRecentSearches';

const r = (id: string): SearchResult => ({
  id,
  kind: 'place',
  title: id,
  position: [-74, 40.7],
  source: 'photon',
  score: 0.5,
});

describe('pushRecent', () => {
  it('moves repeats to the front, strips scores and caps the list', () => {
    let list: SearchResult[] = [];
    for (let i = 0; i < MAX_RECENT + 2; i++) list = pushRecent(list, r(`p${i}`));
    list = pushRecent(list, r('p3'));
    expect(list).toHaveLength(MAX_RECENT);
    expect(list[0]?.id).toBe('p3');
    expect(list.filter((x) => x.id === 'p3')).toHaveLength(1);
    expect(list[0]).not.toHaveProperty('score');
  });
});

describe('useRecentSearches', () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('persists across mounts', () => {
    const first = renderHook(() => useRecentSearches());
    act(() => first.result.current.add(r('a')));
    first.unmount();
    const second = renderHook(() => useRecentSearches());
    expect(second.result.current.recent.map((x) => x.id)).toEqual(['a']);
    act(() => second.result.current.clear());
    expect(second.result.current.recent).toEqual([]);
  });

  it('ignores corrupt stored data', () => {
    window.localStorage.setItem('nycfloors:recent-searches', JSON.stringify([{ nope: 1 }]));
    const { result } = renderHook(() => useRecentSearches());
    expect(result.current.recent).toEqual([]);
  });

  it('still works in memory when storage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const { result } = renderHook(() => useRecentSearches());
    act(() => result.current.add(r('mem')));
    expect(result.current.recent.map((x) => x.id)).toEqual(['mem']);
  });
});

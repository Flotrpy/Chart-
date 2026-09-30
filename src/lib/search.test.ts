import { describe, expect, it } from 'vitest';
import type { SearchResult } from '../types/search';
import { BUILDINGS, TENANTS } from '../data';
import { buildLocalIndex, extractFloor, normalizeText, searchLocal } from './localSearch';
import { mergeResults } from './searchMerge';
import { distanceMeters } from './geo';

const index = buildLocalIndex(TENANTS, BUILDINGS);

const remote = (id: string, title: string, position: [number, number]): SearchResult => ({
  id,
  kind: 'place',
  title,
  position,
  source: 'photon',
});

describe('normalizeText', () => {
  it('folds case, accents, punctuation and address synonyms', () => {
    expect(normalizeText('350 Fifth Avenue, Café')).toEqual(['350', '5th', 'ave', 'cafe']);
  });
});

describe('extractFloor', () => {
  it.each([
    ['Acme Corp, 10th floor', 10],
    ['floor 21 skyline', 21],
    ['fl. 3', 3],
    ['2nd fl lobby', 2],
  ])('parses %s', (q, floor) => {
    expect(extractFloor(q).floor).toBe(floor);
  });

  it('leaves queries without a floor untouched', () => {
    expect(extractFloor('350 5th Ave')).toEqual({ rest: '350 5th Ave' });
  });
});

describe('searchLocal', () => {
  it('finds a tenant by name prefix', () => {
    const [first] = searchLocal(index, 'acme');
    expect(first).toMatchObject({ tenantId: 'acme-corp', kind: 'tenant', floor: 10 });
  });

  it('resolves the full "name, floor, address" query from the brief', () => {
    const [first] = searchLocal(index, 'Acme Corp, 10th floor, 350 5th Ave');
    expect(first?.tenantId).toBe('acme-corp');
  });

  it('matches buildings by alias', () => {
    const ids = searchLocal(index, '30 rock').map((r) => r.id);
    expect(ids[0]).toBe('building:30-rockefeller-plaza');
  });

  it('lists tenants on a requested floor of a building', () => {
    const results = searchLocal(index, 'empire state floor 61');
    expect(results.map((r) => r.tenantId)).toEqual(['gotham-ledger-partners']);
  });

  it('requires every token to match', () => {
    expect(searchLocal(index, 'acme zebra')).toEqual([]);
  });

  it('returns nothing for empty input', () => {
    expect(searchLocal(index, '   ')).toEqual([]);
  });

  it('respects the limit and sorts by score', () => {
    const results = searchLocal(index, 'finance', 3);
    expect(results.length).toBeLessThanOrEqual(3);
    const scores = results.map((r) => r.score ?? 0);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });
});

describe('mergeResults', () => {
  const esb = searchLocal(index, 'empire state building').find(
    (r) => r.id === 'building:empire-state-building',
  );
  if (!esb) throw new Error('fixture missing');

  it('puts local results before remote ones', () => {
    const merged = mergeResults([esb], [remote('photon:1', 'Macy’s', [-73.989, 40.7508])]);
    expect(merged.all.map((r) => r.source)).toEqual(['local', 'photon']);
  });

  it('drops remote duplicates of local results (similar name, nearby)', () => {
    const dup = remote('photon:W1', 'Empire State Building', [-73.9857, 40.7484]);
    const merged = mergeResults([esb], [dup]);
    expect(merged.remote).toEqual([]);
  });

  it('keeps same-named places that are far apart', () => {
    const far = remote('photon:W2', 'Empire State Building', [-73.75, 42.65]);
    expect(mergeResults([esb], [far]).remote).toHaveLength(1);
  });

  it('dedupes remote results against each other', () => {
    const a = remote('photon:1', 'Bryant Park', [-73.9832, 40.7536]);
    const b = remote('nominatim:2', 'Bryant Park', [-73.9834, 40.7537]);
    expect(mergeResults([], [a, b, a]).remote.map((r) => r.id)).toEqual(['photon:1']);
  });

  it('applies local and remote limits independently', () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      remote(`photon:${i}`, `Place ${i}`, [-73.9 - i * 0.01, 40.7]),
    );
    const merged = mergeResults([esb], many, { remoteLimit: 4 });
    expect(merged.local).toHaveLength(1);
    expect(merged.remote).toHaveLength(4);
    expect(merged.all).toHaveLength(5);
  });
});

describe('distanceMeters', () => {
  it('measures ESB → Chrysler at roughly 1 km', () => {
    const d = distanceMeters([-73.98566, 40.74844], [-73.97545, 40.75162]);
    expect(d).toBeGreaterThan(900);
    expect(d).toBeLessThan(1000);
  });
});

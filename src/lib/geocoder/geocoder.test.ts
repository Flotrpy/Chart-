import { describe, expect, it, vi } from 'vitest';
import type { SearchResult } from '../../types/search';
import { cacheKey, createGeocoder } from './client';
import { LruCache } from './lruCache';
import { createPhotonProvider, photonFeatureToResult } from './photon';
import { createNominatimProvider, nominatimPlaceToResult } from './nominatim';
import { createRateLimiter } from './rateLimit';
import { GeocoderError, type GeocoderProvider } from './types';

const result = (id: string): SearchResult => ({
  id,
  kind: 'place',
  title: id,
  position: [-74, 40.7],
  source: 'test',
});

function fakeProvider(id: string, impl: GeocoderProvider['search']): GeocoderProvider {
  return { id, label: id, search: vi.fn(impl) };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe('createGeocoder', () => {
  it('caches by normalized query', async () => {
    const p = fakeProvider('a', async () => [result('x')]);
    const g = createGeocoder({ providers: [p] });
    await g.search('Empire State');
    const second = await g.search('  empire   STATE ');
    expect(second.provider).toBe('cache');
    expect(p.search).toHaveBeenCalledTimes(1);
  });

  it('skips remote lookups for very short queries', async () => {
    const p = fakeProvider('a', async () => [result('x')]);
    const g = createGeocoder({ providers: [p] });
    expect(await g.search('e')).toEqual({ results: [], provider: 'none' });
    expect(p.search).not.toHaveBeenCalled();
  });

  it('falls back to the next provider when one fails', async () => {
    const photon = fakeProvider('photon', async () => {
      throw new GeocoderError('photon', 'down', 503);
    });
    const nominatim = fakeProvider('nominatim', async () => [result('y')]);
    const g = createGeocoder({ providers: [photon, nominatim] });
    const res = await g.search('chrysler');
    expect(res.provider).toBe('nominatim');
    expect(res.results[0]?.id).toBe('y');
  });

  it('throws a combined error when every provider fails', async () => {
    const bad = fakeProvider('a', async () => {
      throw new Error('boom');
    });
    const g = createGeocoder({ providers: [bad] });
    await expect(g.search('anything')).rejects.toMatchObject({ provider: 'all' });
  });

  it('propagates aborts without trying the fallback', async () => {
    const controller = new AbortController();
    const photon = fakeProvider('photon', async () => {
      controller.abort();
      throw new DOMException('Aborted', 'AbortError');
    });
    const nominatim = fakeProvider('nominatim', async () => [result('y')]);
    const g = createGeocoder({ providers: [photon, nominatim] });
    await expect(g.search('flatiron', { signal: controller.signal })).rejects.toThrow('Aborted');
    expect(nominatim.search).not.toHaveBeenCalled();
  });

  it('reports offline without hitting the network', async () => {
    const p = fakeProvider('a', async () => [result('x')]);
    const g = createGeocoder({ providers: [p], isOnline: () => false });
    await expect(g.search('offline query')).rejects.toMatchObject({ provider: 'offline' });
    expect(p.search).not.toHaveBeenCalled();
  });
});

describe('cacheKey', () => {
  it('ignores case, commas, periods and extra whitespace', () => {
    expect(cacheKey(' 350 5th Ave., New  York ')).toBe('350 5th ave new york');
  });
});

describe('LruCache', () => {
  it('evicts the least recently used entry and expires by TTL', () => {
    let t = 0;
    const c = new LruCache<number>(2, 100, () => t);
    c.set('a', 1);
    c.set('b', 2);
    c.get('a');
    c.set('c', 3);
    expect(c.get('b')).toBeUndefined();
    expect(c.get('a')).toBe(1);
    t = 250;
    expect(c.get('a')).toBeUndefined();
  });
});

describe('createRateLimiter', () => {
  it('spaces task starts by the interval', async () => {
    vi.useFakeTimers();
    const schedule = createRateLimiter(1000);
    const starts: number[] = [];
    const run = () => schedule(async () => starts.push(Date.now()));
    const all = Promise.all([run(), run()]);
    await vi.advanceTimersByTimeAsync(1000);
    await all;
    expect((starts[1] ?? 0) - (starts[0] ?? 0)).toBeGreaterThanOrEqual(1000);
    vi.useRealTimers();
  });

  it('rejects waiting tasks when aborted', async () => {
    vi.useFakeTimers();
    const schedule = createRateLimiter(1000);
    await schedule(async () => 1);
    const controller = new AbortController();
    const pending = schedule(async () => 2, controller.signal);
    controller.abort();
    await expect(pending).rejects.toThrow('Aborted');
    vi.useRealTimers();
  });
});

describe('Photon provider', () => {
  it('sends NYC bias parameters and maps features', async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [-73.9857, 40.7484] },
            properties: {
              osm_id: 34633854,
              osm_type: 'W',
              osm_key: 'tourism',
              name: 'Empire State Building',
              housenumber: '350',
              street: '5th Avenue',
              city: 'New York',
              postcode: '10118',
            },
          },
        ],
      }),
    );
    const provider = createPhotonProvider({ fetchFn });
    const [first] = await provider.search({
      text: 'empire',
      bias: { center: [-73.98, 40.75], bbox: [-74.2, 40.5, -73.7, 40.9] },
    });
    const url = String((fetchFn.mock.calls[0] as unknown[])[0]);
    expect(url).toContain('bbox=-74.2%2C40.5%2C-73.7%2C40.9');
    expect(url).toContain('lat=40.75');
    expect(first).toMatchObject({
      id: 'photon:W34633854',
      kind: 'landmark',
      title: 'Empire State Building',
      subtitle: '350 5th Avenue, New York, 10118',
      source: 'photon',
    });
  });

  it('builds an address title when the feature has no name', () => {
    const r = photonFeatureToResult(
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-74, 40.7] },
        properties: { housenumber: '1', street: 'Main St', osm_key: 'place' },
      },
      0,
    );
    expect(r.title).toBe('1 Main St');
  });

  it('throws GeocoderError on HTTP failure', async () => {
    const provider = createPhotonProvider({ fetchFn: async () => jsonResponse({}, 502) });
    await expect(provider.search({ text: 'x' })).rejects.toBeInstanceOf(GeocoderError);
  });
});

describe('Nominatim provider', () => {
  it('uses a viewbox and converts the bounding box order', async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse([
        {
          place_id: 1,
          osm_type: 'way',
          osm_id: 42,
          lat: '40.7516',
          lon: '-73.9755',
          category: 'building',
          name: 'Chrysler Building',
          display_name: 'Chrysler Building, 405, Lexington Avenue, Manhattan',
          boundingbox: ['40.751', '40.752', '-73.976', '-73.975'],
          address: { house_number: '405', road: 'Lexington Avenue', borough: 'Manhattan' },
        },
      ]),
    );
    const provider = createNominatimProvider({ fetchFn, minIntervalMs: 0 });
    const [r] = await provider.search({
      text: 'chrysler',
      bias: { center: [-73.98, 40.75], bbox: [-74.2, 40.5, -73.7, 40.9] },
    });
    expect(String((fetchFn.mock.calls[0] as unknown[])[0])).toContain(
      'viewbox=-74.2%2C40.9%2C-73.7%2C40.5',
    );
    expect(r?.bbox).toEqual([-73.976, 40.751, -73.975, 40.752]);
    expect(r?.id).toBe('nominatim:W42');
  });

  it('falls back to display_name for untitled places', () => {
    const r = nominatimPlaceToResult(
      { place_id: 9, lat: '40', lon: '-74', display_name: 'Somewhere, NY' },
      0,
    );
    expect(r.title).toBe('Somewhere');
  });
});

import { describe, expect, it } from 'vitest';
import { buildSearch, buildShareUrl, decodeCamera, encodeCamera, parseDeepLink } from './deepLink';
import { selectionReducer, type Selection } from './selection';

const camera = {
  center: [-73.985661, 40.748441] as [number, number],
  zoom: 16.456,
  pitch: 60,
  bearing: -20,
};

describe('camera encoding', () => {
  it('round-trips with sensible precision', () => {
    const decoded = decodeCamera(encodeCamera(camera));
    expect(decoded?.center[0]).toBeCloseTo(camera.center[0], 5);
    expect(decoded?.zoom).toBeCloseTo(16.46, 2);
    expect(decoded?.bearing).toBe(-20);
  });

  it('rejects malformed values and clamps out-of-range ones', () => {
    expect(decodeCamera('1,2,3')).toBeUndefined();
    expect(decodeCamera('a,b,c,d,e')).toBeUndefined();
    expect(decodeCamera('-200,40,10,0,0')).toBeUndefined();
    expect(decodeCamera('-74,40.7,99,120,540')).toEqual({
      center: [-74, 40.7],
      zoom: 19.5,
      pitch: 75,
      bearing: -180,
    });
  });
});

describe('parseDeepLink', () => {
  it('reads a tenant link (the ?tenant=acme-corp example)', () => {
    expect(parseDeepLink('?tenant=acme-corp')).toEqual({ tenantId: 'acme-corp' });
  });

  it('reads building + floor + camera', () => {
    expect(parseDeepLink('?building=chrysler-building&floor=12&cam=-73.97,40.75,16,55,10')).toEqual(
      {
        buildingId: 'chrysler-building',
        floor: 12,
        camera: { center: [-73.97, 40.75], zoom: 16, pitch: 55, bearing: 10 },
      },
    );
  });

  it('ignores suspicious ids and invalid floors', () => {
    expect(parseDeepLink('?tenant=<script>')).toEqual({});
    expect(parseDeepLink('?building=flatiron-building&floor=-2')).toEqual({
      buildingId: 'flatiron-building',
    });
  });
});

describe('buildSearch', () => {
  it('prefers the tenant id when a tenant is open', () => {
    const s: Selection = { buildingId: 'empire-state-building', floor: 10, tenantId: 'acme-corp' };
    expect(buildSearch(s)).toBe('?tenant=acme-corp');
  });

  it('encodes building, floor and camera with readable commas', () => {
    const s: Selection = { buildingId: 'flatiron-building', floor: null, tenantId: null };
    expect(buildSearch(s, camera)).toBe(
      '?building=flatiron-building&cam=-73.98566,40.74844,16.46,60,-20',
    );
    expect(buildSearch(null)).toBe('');
  });

  it('round-trips through the selection reducer', () => {
    const original: Selection = { buildingId: 'woolworth-building', floor: 29, tenantId: null };
    const parsed = parseDeepLink(buildSearch(original));
    const restored = selectionReducer(null, {
      type: 'selectBuilding',
      buildingId: parsed.buildingId ?? '',
      floor: parsed.floor,
    });
    expect(restored).toEqual(original);
  });

  it('builds an absolute share URL', () => {
    const s: Selection = { buildingId: 'empire-state-building', floor: 10, tenantId: 'acme-corp' };
    expect(buildShareUrl(s, undefined, { origin: 'https://nyc.example', pathname: '/' })).toBe(
      'https://nyc.example/?tenant=acme-corp',
    );
  });
});

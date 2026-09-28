import { describe, expect, it } from 'vitest';
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import { BASEMAP_SOURCE, PALETTE, createMapStyle } from './mapStyle';

/** Relative luminance per WCAG 2.x, 0 (black) – 1 (white). */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

describe('createMapStyle', () => {
  it('produces a style that passes the MapLibre style-spec validator', () => {
    expect(validateStyleMin(createMapStyle())).toEqual([]);
  });

  it('has unique layer ids', () => {
    const ids = createMapStyle().layers.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only references declared sources', () => {
    const style = createMapStyle();
    for (const layer of style.layers) {
      if ('source' in layer && typeof layer.source === 'string') {
        expect(style.sources).toHaveProperty(layer.source);
      }
    }
    expect(style.sources[BASEMAP_SOURCE]).toBeDefined();
  });

  it('returns a fresh object each call', () => {
    expect(createMapStyle()).not.toBe(createMapStyle());
  });
});

describe('PALETTE', () => {
  it('is a light theme (land and roads are near white)', () => {
    expect(luminance(PALETTE.land)).toBeGreaterThan(0.85);
    expect(luminance(PALETTE.roadMajor)).toBeGreaterThan(0.95);
  });

  it('keeps label text legible against the land colour', () => {
    expect(contrast(PALETTE.labelText, PALETTE.land)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(PALETTE.labelMuted, PALETTE.land)).toBeGreaterThanOrEqual(4.5);
  });
});

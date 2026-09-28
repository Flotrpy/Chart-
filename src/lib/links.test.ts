import { describe, expect, it } from 'vitest';
import { directionsUrl, osmDirectionsUrl, telHref } from './links';

describe('links', () => {
  it('builds a Google Maps directions URL with lat,lng', () => {
    expect(directionsUrl([-73.98566, 40.74844])).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=40.748440%2C-73.985660',
    );
  });

  it('builds an OSM directions URL', () => {
    expect(osmDirectionsUrl([-73.98566, 40.74844])).toContain('to=40.748440%2C-73.985660');
  });

  it('normalizes phone numbers for tel: links', () => {
    expect(telHref('+1 212-555-0100')).toBe('tel:+12125550100');
  });
});

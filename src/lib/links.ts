import type { LngLatTuple } from '../types/map';

/** Opens turn-by-turn directions in the user's default web maps. */
export function directionsUrl([lng, lat]: LngLatTuple): string {
  const params = new URLSearchParams({
    api: '1',
    destination: `${lat.toFixed(6)},${lng.toFixed(6)}`,
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** OpenStreetMap alternative (no Google account or tracking). */
export function osmDirectionsUrl([lng, lat]: LngLatTuple): string {
  return `https://www.openstreetmap.org/directions?to=${lat.toFixed(6)}%2C${lng.toFixed(6)}#map=18/${lat.toFixed(5)}/${lng.toFixed(5)}`;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

/** Copies text; falls back to a hidden textarea where the async API is blocked. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

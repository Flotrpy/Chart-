import { afterEach, describe, expect, it, vi } from 'vitest';
import { readJSON, removeKey, writeJSON } from './storage';

describe('storage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('round-trips JSON values', () => {
    expect(writeJSON('k', { a: 1 })).toBe(true);
    expect(readJSON('k', null)).toEqual({ a: 1 });
    removeKey('k');
    expect(readJSON('k', 'fallback')).toBe('fallback');
  });

  it('returns the fallback for corrupt or invalid data', () => {
    window.localStorage.setItem('nycfloors:bad', '{not json');
    expect(readJSON('bad', 42)).toBe(42);
    writeJSON('num', 'text');
    expect(readJSON('num', 0, (v): v is number => typeof v === 'number')).toBe(0);
  });

  it('never throws when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(readJSON('x', 'safe')).toBe('safe');
    expect(writeJSON('x', 1)).toBe(false);
  });
});

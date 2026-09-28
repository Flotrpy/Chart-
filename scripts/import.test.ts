import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import buildings from '../src/data/buildings.json';
import type { Building } from '../src/types/domain';
import { validateTenants } from '../src/lib/validateData';
import { parseCsv, parseCsvRecords, slugify } from './csv';
import { rowsToTenants } from './tenantRows';

const B = buildings as Building[];

describe('parseCsv', () => {
  it('handles quotes, escaped quotes, commas and newlines in fields', () => {
    const rows = parseCsv('a,b\r\n"x, y","say ""hi""\nthere"\n');
    expect(rows).toEqual([
      ['a', 'b'],
      ['x, y', 'say "hi"\nthere'],
    ]);
  });

  it('skips blank lines and strips a BOM', () => {
    expect(parseCsv('﻿a\n\n1\n')).toEqual([['a'], ['1']]);
  });
});

describe('slugify', () => {
  it('makes kebab-case ids', () => {
    expect(slugify('Café & Co., LLC')).toBe('cafe-and-co-llc');
  });
});

describe('rowsToTenants', () => {
  it('imports the example CSV into valid tenants', () => {
    const csv = readFileSync(resolve(import.meta.dirname, 'tenants.example.csv'), 'utf8');
    const { tenants, errors } = rowsToTenants(parseCsvRecords(csv), B);
    expect(errors).toEqual([]);
    expect(tenants.map((t) => t.id)).toEqual(['example-studio', 'bright-harbor-law']);
    expect(tenants[1]).toMatchObject({
      floor: 30,
      floorsSpanned: 2,
      name: 'Bright Harbor Law, LLP',
    });
    expect(tenants[0]?.address).toBe(B.find((b) => b.id === 'empire-state-building')?.address);
    expect(validateTenants(tenants, B)).toEqual([]);
  });

  it('reports row-numbered errors', () => {
    const { errors } = rowsToTenants(
      [
        { name: '', buildingId: 'chrysler-building', floor: '1' },
        { name: 'X', buildingId: 'nope', floor: '1' },
        { name: 'Y', buildingId: 'chrysler-building', floor: 'ten' },
      ],
      B,
    );
    expect(errors.map((e) => e.row)).toEqual([2, 3, 4]);
  });
});

/**
 * Import tenants from a CSV file into src/data/tenants.json.
 *
 *   npm run import:tenants -- path/to/tenants.csv            # replace
 *   npm run import:tenants -- path/to/tenants.csv --merge    # upsert by id
 *   npm run import:tenants -- path/to/tenants.csv --dry-run  # validate only
 *
 * Columns (header row required): name, buildingId, floor are required;
 * id, category, floorsSpanned, address, lat, lng, hours, phone, website,
 * description, logo, unitId are optional. See scripts/tenants.example.csv.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Building, Tenant } from '../src/types/domain';
import { validateTenants } from '../src/lib/validateData';
import { parseCsvRecords } from './csv';
import { rowsToTenants } from './tenantRows';

const root = resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const merge = args.includes('--merge');
const dryRun = args.includes('--dry-run');
const outIdx = args.indexOf('--out');
const outPath = resolve(root, outIdx >= 0 ? (args[outIdx + 1] ?? '') : 'src/data/tenants.json');

if (!file) {
  console.error('Usage: npm run import:tenants -- <file.csv> [--merge] [--dry-run] [--out path]');
  process.exit(1);
}

const buildings = JSON.parse(
  readFileSync(resolve(root, 'src/data/buildings.json'), 'utf8'),
) as Building[];
const records = parseCsvRecords(readFileSync(resolve(file), 'utf8'));
const { tenants: imported, errors } = rowsToTenants(records, buildings);

for (const e of errors) console.error(`  row ${e.row}: ${e.message}`);

let result: Tenant[] = imported;
if (merge) {
  const existing = JSON.parse(readFileSync(outPath, 'utf8')) as Tenant[];
  const byId = new Map(existing.map((t) => [t.id, t]));
  for (const t of imported) byId.set(t.id, t);
  result = [...byId.values()];
}

const issues = validateTenants(result, buildings);
for (const i of issues) console.error(`  ${i.id}: ${i.message}`);

console.log(
  `${imported.length} tenant(s) parsed, ${errors.length} row error(s), ${issues.length} validation issue(s).`,
);

if (errors.length || issues.length) {
  console.error('Nothing written. Fix the problems above and re-run.');
  process.exit(1);
}
if (dryRun) {
  console.log('Dry run: nothing written.');
} else {
  writeFileSync(outPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`Wrote ${result.length} tenant(s) to ${outPath}`);
}

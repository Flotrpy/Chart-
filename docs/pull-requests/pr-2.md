# PR 2 — Search and data

**Branch:** `feat/search-and-data` → `main` · **Commits:** 18–34 (17) · **Merge:** `--no-ff`

## Summary

Adds search: a swappable geocoder layer (Photon, then Nominatim), the seed
buildings and fictional tenants, instant offline local search merged ahead of
geocoder results, and an accessible autocomplete search bar with recent
searches, toasts and a CSV import path for real data.

## What changed

- **Geocoder interface** (`lib/geocoder/types.ts`): one `GeocoderProvider`
  contract; `SearchResult` normalized across sources.
- **Photon provider:** NYC centre and bbox bias, OSM key → result kind
  mapping, extent → bbox, rank → score.
- **Nominatim provider:** ~1.1 s rate limiter (abort-aware), `email`
  parameter in browsers / `User-Agent` elsewhere, per the OSMF usage policy.
- **Client:** normalized-query LRU cache (100 queries, 10 min), abort
  passthrough, offline short-circuit, ordered fallback.
- **Data:** `buildings.json` (8 real towers, grid-aligned footprints, storey
  heights tuned to roof height), `tenants.json` (26 fictional tenants, some
  multi-floor), domain types with an optional `floorplans` field, validators.
- **Local search:** accent- and punctuation-insensitive, address synonyms
  (Fifth Avenue = 5th ave), weighted fields, floor extraction ("10th floor").
- **Merge:** local first, then geocoder results minus duplicates (same id,
  or a similar name within 75 m).
- **Search bar:** WAI-ARIA combobox (listbox, groups, `aria-activedescendant`),
  arrows with wrap, Home/End, Enter, Escape to close then clear; type icons,
  floor badges, skeleton rows, and empty and error states; live-region result
  counts; recent searches on focus.
- **Toasts:** geocoder failure, no results on Enter, offline and back online,
  geolocation errors.
- **CSV import:** `npm run import:tenants -- file.csv [--merge] [--dry-run]`
  with a dependency-free RFC 4180 parser and validation before writing.

## How to test

1. Type `acme`: Acme Corp appears instantly under "Tenants & buildings" with
   a floor badge; geocoder results follow after 250 ms.
2. `Acme Corp, 10th floor, 350 5th Ave` resolves to Acme Corp.
3. Arrow keys move the highlight; Enter selects; Escape closes, then clears.
4. Turn off the network in devtools: a toast explains, and local results
   still work.
5. Focus the empty box: recent searches show; "Clear recent searches" works.
6. `npm run import:tenants -- scripts/tenants.example.csv --merge --dry-run`.

## Screenshots / visual notes

`docs/screenshots/search.png`: dropdown with local results and the geocoder
fallback message (the sandbox blocks photon.komoot.io).

## Known limitations

- Public Photon and Nominatim have fair-use limits; self-host for production
  traffic.
- Geocoder results don't carry floors; only local data opens a floor view.

## Checklist

- [x] `npm run lint` passes (0 warnings)
- [x] `npm run typecheck` passes
- [x] `npm test` passes (geocoder, local search, merge, hooks, combobox, CSV)
- [x] `npm run build` passes
- [x] Every commit builds on its own

# PR 3 — Floor-level display

**Branch:** `feat/floor-level-display` → `main` · **Commits:** 35–50 (16) · **Merge:** `--no-ff`

## Summary

The core feature: selecting a tenant flies to a 3/4 view of its building,
turns the tower into translucent glass, raises an opaque amber slab at the
floor's real height with a soft glow, and pins a "Floor N" label beside it.
Also adds the elevator-style floor selector, the lazy detail panel, deep
links, the mobile bottom sheet, the accessibility and performance passes,
the self-review fixes, and the docs.

## What changed

- **Floor math** (`lib/floorMath.ts`): `bottom = ground + lobby + (floor − 1)
× storey`, `top = bottom + storey`; spans, midpoints, inverse lookup, shell
  height. Thoroughly tested.
- **Selection reducer**: building, floor and tenant; unknown ids are ignored,
  so bad deep links are harmless.
- **Camera** (`lib/floorCamera.ts`): aims `h·tan(pitch)` beyond the building
  and backs zoom off by `h/cos(pitch)`, since MapLibre only animates centre
  elevation with terrain. Padded for the panels.
- **Overlay** (`FloorLayers.tsx`): sources and layers added once; OSM parts
  inside the footprint filtered out with `within`; glass shell split around
  the slab; amber slab plus glow; 600 ms rise, and an elevator glide between
  floors via paint transitions.
- **Floating label** (`FloorMarker.tsx`): custom-layer projection of
  `(lng, lat, altitude)` each frame.
- **Floor selector:** floors top-down with tenants, roving tabindex arrows,
  up/down buttons, "Show whole building", occupied-only filter.
- **Detail panel** (React.lazy): photo placeholder, category and floor
  badges, address, hours, phone, website, Get directions (Google / OSM),
  Share (clipboard), and an honest note that floors are bands and tenants are
  fictional.
- **Deep links:** `?tenant=`, `?building=&floor=`, `&cam=`; parsed defensively
  and synced with `replaceState`.
- **Responsive:** mobile two-snap bottom sheet with Details/Floors tabs and a
  draggable handle; desktop side panels slide in.
- **Accessibility:** live-region selection announcements, focus moved to
  opened details, `/` and `Esc` shortcuts, 44 px targets.
- **Performance:** MapLibre and React in separate chunks (app ~28 KB gzip),
  DPR capped at 2, tile cache for fly-backs, preconnect hints.
- **Fixes:** #40 (map container collapsed to 300 px because MapLibre CSS
  forces `position: relative`; slab opacity never restored); #48 (attribution
  hidden by the mobile sheet, amber contrast, stale share URL, toast overlap,
  silent tile errors).
- **Docs:** README, `docs/LIMITATIONS.md`, these PR descriptions, and
  screenshots.

## How to test

1. Open `/?tenant=gotham-ledger-partners`: the Empire State Building,
   floors 61–63 highlighted, label pinned, details on the right.
2. Search `acme` and press Enter: the slab rises over ~600 ms.
3. In the floor selector, press ↑/↓: the slab glides floor by floor, and a
   screen reader announces each change.
4. "Show whole building": the full glass shell, no slab.
5. Share: the copied URL reopens the same view.
6. Resize to a phone width: bottom sheet with Details/Floors tabs; drag the
   handle; the attribution stays visible.
7. Enable reduced motion: camera moves and the slab change are instant.

## Screenshots / visual notes

- `docs/screenshots/floor-view-desktop.png`
- `docs/screenshots/floor-view-mobile.png`

The basemap is blank in these because the sandbox blocks the tile host. The
glass shell, slab, glow, label and panels are rendered for real.

## Known limitations

Interiors aren't available from free data, so floors are slabs; storey
heights are uniform; footprints are approximations; tenants are fictional.
See `docs/LIMITATIONS.md` for details and next steps (indoor plans, NYC Open
Data heights, CesiumJS photorealistic path).

## Checklist

- [x] `npm run lint` passes (0 warnings)
- [x] `npm run typecheck` passes
- [x] `npm test` passes (162 tests across 28 files at merge)
- [x] `npm run build` passes (app ~28 KB gzip excl. MapLibre)
- [x] Every commit builds on its own
- [x] Self-review against the brief done; gaps fixed in #48

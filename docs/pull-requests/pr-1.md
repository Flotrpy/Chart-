# PR 1 — Foundation and 3D map

**Branch:** `feat/foundation-and-3d-map` → `main` · **Commits:** 2–17 (16) · **Merge:** `--no-ff`

## Summary

Sets up the project tooling and delivers the base experience: a light,
photographic-feeling 3D map of Manhattan with extruded buildings, custom
controls, a branded loading screen, required attribution and first-visit tips.

## What changed

- **Tooling:** ESLint (typescript-eslint strict, React hooks, no `any`),
  Prettier, Vitest + Testing Library on jsdom, Tailwind CSS v4.
- **Design tokens:** palette, radii, shadows and glass surface as CSS
  variables exposed to Tailwind; Inter self-hosted; light mode only (no
  `prefers-color-scheme` handling, no toggle); reduced-motion override.
- **Map style** (`lib/mapStyle.ts`): pale grey land, light blue water,
  white roads with soft casings, muted parks, haloed labels, on OpenFreeMap's
  OpenMapTiles schema. Validated with the official style-spec validator.
- **3D buildings:** `render_height`/`render_min_height` extrusions that grow
  in over half a zoom level, with a cool-grey to warm-white height ramp,
  vertical gradient and viewport light for soft shading.
- **Landmarks:** a dozen iconic sights labelled from zoom 12, taller towers
  winning collisions.
- **Camera:** eases from a wide overview into pitch 60°, bearing −20° (skipped
  with reduced motion).
- **Controls:** zoom, live compass (reset north), rotate ±30°, 2D/3D toggle,
  permission-based geolocation limited to NYC, fullscreen.
- **Loading screen**, **attribution footer** (OSM always visible) and
  **dismissible onboarding hint** (remembered via a never-throwing
  localStorage wrapper).
- **Fix (#7):** `tsc -b` lacked `noEmit` and committed `.js` next to sources;
  removed and ignored.

## How to test

```bash
npm install && npm run dev
```

1. The splash animates, then the camera eases into the Midtown skyline.
2. Buildings extrude when zooming past 13; taller towers look warmer.
3. Try every control; the compass rotates with the map; 2D/3D toggles pitch.
4. Tab through the controls: visible focus rings, 44 px targets.
5. Dismiss the tips and reload: they stay dismissed.
6. The OSM credit is always visible; the info button expands full credits.

## Screenshots / visual notes

See `docs/screenshots/`. The build sandbox couldn't reach the tile host, so
screenshots show UI and overlays over an empty basemap. Against the real
OpenFreeMap tiles, the style renders the palette described above.

## Known limitations

- MapLibre's own controls are replaced with custom ones; there's no scale bar.
- Landmark labels are ground-anchored (MapLibre symbols can't be raised).

## Checklist

- [x] `npm run lint` passes (0 warnings)
- [x] `npm run typecheck` passes
- [x] `npm test` passes
- [x] `npm run build` passes
- [x] Every commit builds on its own

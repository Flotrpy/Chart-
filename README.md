# NYC Floors

A searchable, interactive **3D map of New York City** that shows **which floor** a
business is on. Search a tenant, address or landmark; the camera flies to the
building, the tower turns to translucent glass, and the exact floor lights up as
an amber slab at its real-world height with a label pinned beside it.

- Free and keyless: MapLibre GL JS, OpenFreeMap vector tiles, Photon/Nominatim geocoding.
- Light theme only, responsive (desktop panels, mobile bottom sheet), keyboard and
  screen-reader accessible.
- Deep links: `/?tenant=acme-corp` opens straight onto Acme Corp's floor.

> **Demo data:** the eight buildings are real (public floor counts and heights,
> simplified footprints). All **tenants are fictional**, with 555 phone numbers
> and `example.com` websites. See [Adding data](#adding-data) to load your own.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

Node 20 or newer is required.

| Script                               | What it does                                          |
| ------------------------------------ | ----------------------------------------------------- |
| `npm run dev`                        | Vite dev server with HMR                              |
| `npm run build`                      | Type-check (`tsc -b`) and production build to `dist/` |
| `npm run preview`                    | Serve the production build locally                    |
| `npm run lint`                       | ESLint (zero warnings allowed)                        |
| `npm run typecheck`                  | TypeScript only                                       |
| `npm test` / `npm run test:run`      | Vitest (watch / single run)                           |
| `npm run format`                     | Prettier                                              |
| `npm run import:tenants -- file.csv` | Import tenants from CSV (see below)                   |

## How it works

### The floor view

1. **Search** runs locally first (instant and offline) over the bundled
   buildings and tenants, then asks the geocoder after a 250 ms pause. Local
   results come first because only they carry floor data.
2. **Selecting a tenant** updates a small reducer (`lib/selection.ts`) holding
   `{ buildingId, floor, tenantId }`. Everything else reacts to that state.
3. **Camera** (`lib/floorCamera.ts`): MapLibre can't animate a raised look-at
   point without terrain, so the camera aims at a ground point `h·tan(pitch)`
   beyond the building, which puts height `h` at screen centre, and backs zoom
   off by `h/cos(pitch)`. It is padded for whatever the panels cover.
4. **Floor height math** (`lib/floorMath.ts`):

   ```
   bottom = groundElevation + lobbyHeight + (floor − 1) × floorHeight
   top    = bottom + floorHeight
   ```

   Floor 1 is the first storey above the lobby. Multi-floor tenants span
   `bottom(floor)` to `top(floor + floorsSpanned − 1)`.

5. **Layers** (`components/map/FloorLayers.tsx`) are added once. Updates only
   call `setData` and `setPaintProperty`:
   - the OSM extrusion inside the (slightly grown) footprint is filtered out
     with a `within` expression, and the rest of the skyline dims a little;
   - an opaque amber **slab** plus a soft translucent **glow**;
   - a translucent **glass shell** split into a band below and a band above
     the slab, so the slab is never behind glass (depth testing would hide it);
   - paint transitions give the 600 ms rise and fade. Changing floors glides
     the slab like an elevator.
6. **Floating label** (`components/map/FloorMarker.tsx`): MapLibre markers
   sit on the ground, so a no-op 3D custom layer receives the clip matrix each
   frame and the label is projected from `(lng, lat, floor midpoint)`.

### Project layout

```
src/
  components/
    map/        MapView (owns the map), FloorLayers, FloorMarker, SelectionCamera
    controls/   MapControls (zoom, compass, rotate, 2D/3D, locate, fullscreen), AttributionControl
    search/     SearchBar (ARIA combobox), ResultIcon
    floors/     FloorSelector (elevator panel)
    detail/     DetailPanel (lazy-loaded)
    ui/         GlassPanel, IconButton, Toasts, LoadingScreen, OnboardingHint, BottomSheet, LiveRegion
  data/         buildings.json, tenants.json, landmarks.ts, index.ts (lookups)
  hooks/        useSearch, useRecentSearches, useDeepLinkSync, useMediaQuery, …
  lib/
    geocoder/   types, photon, nominatim, client (cache + abort + fallback), rate limiter
    floorMath, floorScene, floorCamera, projectAltitude
    localSearch, searchMerge, deepLink, selection, mapStyle, mapConfig, storage, …
  types/        domain (Building, Tenant), search, map
scripts/        import-tenants.ts + CSV helpers and tests
docs/           PLAN.md, LIMITATIONS.md, pull-requests/
```

Pure logic lives in `lib/` with unit tests next to it. React components stay
thin, and the map is imperative: it is created once and mutated through context.

## Data schema

**Building** (`src/data/buildings.json`)

| Field               | Type               | Notes                                                                        |
| ------------------- | ------------------ | ---------------------------------------------------------------------------- |
| `id`                | kebab-case string  | Used in URLs (`?building=`)                                                  |
| `name`, `address`   | string             |                                                                              |
| `center`            | `[lng, lat]`       | Camera target                                                                |
| `footprint`         | GeoJSON `Polygon`  | Outline for shell and slab (closed ring)                                     |
| `osmId`             | string, optional   | e.g. `way/34633854`, for cross-referencing OSM                               |
| `totalFloors`       | integer            |                                                                              |
| `heightMeters`      | number             | Roof height (the shell uses whichever is higher: this or the stacked floors) |
| `groundElevation`   | number             | Metres above the map zero plane (0 without terrain)                          |
| `floorHeightMeters` | number             | Default 3.9 (commercial)                                                     |
| `lobbyHeightMeters` | number             | Default 6                                                                    |
| `aliases`           | string[], optional | Extra search terms ("ESB", "30 Rock")                                        |
| `floorplans`        | optional           | `{ [floor]: FeatureCollection<Polygon> }`, reserved for indoor maps          |

**Tenant** (`src/data/tenants.json`)

| Field                                                        | Type              | Notes                                     |
| ------------------------------------------------------------ | ----------------- | ----------------------------------------- |
| `id`                                                         | kebab-case string | Used in URLs (`?tenant=`)                 |
| `name`                                                       | string            |                                           |
| `category`                                                   | enum              | See `TENANT_CATEGORIES` in `types/domain` |
| `buildingId`                                                 | string            | Must exist in buildings.json              |
| `address`                                                    | string            |                                           |
| `lat`, `lng`                                                 | number            |                                           |
| `floor`                                                      | integer ≥ 1       | Lowest floor occupied                     |
| `floorsSpanned`                                              | integer, optional | Consecutive floors from `floor`           |
| `hours`, `phone`, `website`, `description`, `logo`, `unitId` | optional          |                                           |

Both files are validated in tests (`src/data/data.test.ts`): ids, closed
footprints, known categories, floors inside the building, and every top floor
under the roof.

## Adding data

### Tenants from a spreadsheet

Export a CSV with a header row. `name`, `buildingId` and `floor` are required;
everything else is optional. Address and coordinates default to the building's.

```csv
id,name,category,buildingId,floor,floorsSpanned,hours,phone,website,description
,Example Studio,Design,empire-state-building,12,,Mon–Fri 9–18,,https://example.com,"Brand studio"
```

```bash
npm run import:tenants -- tenants.csv --dry-run   # validate only
npm run import:tenants -- tenants.csv             # replace tenants.json
npm run import:tenants -- tenants.csv --merge     # upsert by id
```

The script refuses to write if any row is invalid, and reports spreadsheet row
numbers. `scripts/tenants.example.csv` is a working example.

### Buildings

Add an object to `src/data/buildings.json`. For accurate outlines, copy the
footprint from OpenStreetMap (export the way as GeoJSON) or from the NYC
Building Footprints dataset (see below). Tune `floorHeightMeters` so
`lobbyHeightMeters + totalFloors × floorHeightMeters ≤ heightMeters`; the test
suite enforces this. Aliases make the building findable by nickname.

### Optional: NYC Open Data heights

NYC Open Data publishes a public-domain **Building Footprints** dataset
(search "Building Footprints" on [data.cityofnewyork.us](https://data.cityofnewyork.us)).
It has surveyed outlines, roof height and ground elevation for every building,
keyed by BIN (Building Identification Number). The suggested integration is a
build-time script that looks up each building by BIN through the dataset's
Socrata JSON API, converts feet to metres, and writes `footprint`,
`heightMeters` and `groundElevation` into buildings.json, so the app stays
keyless and works offline. This is not wired up yet; see
[docs/LIMITATIONS.md](docs/LIMITATIONS.md).

### Indoor floor plans (future)

`Building.floorplans` accepts GeoJSON per floor. The overlay already knows
each floor's `bottom`/`top`, so a plan layer is a `fill-extrusion` over those
polygons with the same base and height as the slab, plus `Tenant.unitId` to
highlight one unit instead of the whole floor.

## Swapping services

### Geocoder

Every provider implements one interface (`src/lib/geocoder/types.ts`):

```ts
interface GeocoderProvider {
  id: string;
  label: string;
  search(query: { text; limit?; signal?; bias?; language? }): Promise<SearchResult[]>;
}
```

Providers are listed in order in `src/lib/geocoder/index.ts`. The client tries
them in sequence, caches results (100 queries, 10 minutes), and passes abort
signals through. To add Pelias, a self-hosted Photon, or a commercial API,
write a provider and put it in that array.

**Nominatim usage policy:** at most 1 request/second (enforced by a limiter at
~1.1 s) and the app must identify itself. Browsers can't set `User-Agent`, so
pass `email` to `createNominatimProvider({ email: 'you@example.com' })`. Outside
the browser the provider sends a `User-Agent`. For heavy traffic, self-host.

### Tile provider

`src/lib/mapConfig.ts → TILE_PROVIDER` holds the TileJSON and glyph URLs. Any
**OpenMapTiles-schema** source works unchanged (self-hosted
[Planetiler](https://github.com/onthegomap/planetiler) output, MapTiler,
Stadia). The style (`src/lib/mapStyle.ts`) uses the standard `building` layer
with `render_height` and `render_min_height`. Update the credits in
`src/lib/attributions.ts` to match.

## Deployment

It's a static site. Build with `npm run build` and serve `dist/`.

- **Vercel:** import the repo. Framework preset "Vite", build `npm run build`,
  output `dist`. No config needed: deep links use query strings, not paths.
- **Netlify:** build command `npm run build`, publish directory `dist`.
- **Any static host / S3 + CloudFront / GitHub Pages:** upload `dist/`. For a
  sub-path, set `base` in `vite.config.ts`.

No environment variables or API keys are required.

## Quality

- **Tests:** Vitest + Testing Library cover floor math, the floor scene and
  camera, projection, local search, result merging, the geocoder client and
  providers (stubbed fetch), deep links, the selection reducer, storage, CSV
  import, and the main components (combobox keyboard flow, floor selector,
  detail panel, toasts, bottom sheet).
- **Accessibility:** WAI-ARIA combobox with `aria-activedescendant`, live
  regions for result counts and floor changes, roving tabindex in the floor
  list, focus moved to opened details, `/` to search, `Esc` to step back,
  44 px touch targets, visible focus rings, AA contrast (label contrast is
  asserted in tests), and `prefers-reduced-motion` respected in CSS and camera
  moves.
- **Performance:** app code is about 28 KB gzip (about 96 KB with React),
  excluding MapLibre (about 280 KB gzip, separate cacheable chunk). The detail
  panel is lazy-loaded. Map layers are never re-added, geocoder requests are
  debounced, cached and aborted, and device pixel ratio is capped at 2.

## Licensing and attribution

- Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright),
  **ODbL 1.0**. Attribution must stay visible. The footer control keeps the OSM
  credit on screen at all times, including above the mobile sheet.
- Tiles by [OpenFreeMap](https://openfreemap.org) (free, no key), using the
  [OpenMapTiles](https://openmaptiles.org) schema.
- [MapLibre GL JS](https://maplibre.org): **BSD-3-Clause**.
- Geocoding: [Photon](https://photon.komoot.io) by komoot and
  [Nominatim](https://nominatim.org), both on OSM data (ODbL).
- Icons: [Lucide](https://lucide.dev) (ISC). Font: Inter (SIL OFL), self-hosted.
- This project's code: see [LICENSE](LICENSE).

See [docs/LIMITATIONS.md](docs/LIMITATIONS.md) for known limitations and next steps.

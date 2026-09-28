# Known limitations & next steps

## Limitations

**Floors are slabs, not interiors.** No free, open dataset has room-level
layouts for NYC office towers. A selected floor is drawn as a solid band over
the building footprint at the right height, and the UI says so. The data model
already has `Building.floorplans` (GeoJSON per floor) and `Tenant.unitId` for
when plans exist.

**Uniform storey heights.** `floorMath` assumes one lobby height and one
typical storey height per building. Real towers have taller mechanical floors,
sky lobbies and setbacks, so the highlight can drift by a floor or two near
the top of very tall buildings. The fix is a per-floor height table in
`floorMath.ts`; nothing else would change.

**Footprints are approximations.** Seed footprints are rectangles on the 29°
Manhattan grid (the Flatiron gets a triangle), and there are no setbacks: the
Empire State Building's glass shell is one prism, not a stepped tower. OSM
parts inside the selected footprint are hidden with a slightly grown `within`
filter, so a small neighbouring part can occasionally disappear too, or an
oversized OSM outline can stay visible.

**Tenants are fictional.** The 26 tenants are invented demo data with 555
numbers and example.com sites. There is no real, free tenant directory; see
"Real tenant data" below.

**Geocoder coverage and limits.** Photon and Nominatim are community
services. Their results rarely include floor or suite numbers, so geocoder
results fly to the building without a floor view. Public Nominatim allows
1 request/second (enforced client-side); heavy use needs a self-hosted
instance.

**No terrain.** `groundElevation` is 0 for all seed buildings. The math
supports ground offsets, but the basemap has no DEM, so heights are relative
to a flat city.

**Browser support.** WebGL is required (a readable fallback shows without it).
The floating label uses a MapLibre custom layer and works in Mercator only;
globe projection isn't enabled.

**Not verified here.** The build sandbox couldn't reach
`tiles.openfreemap.org` or `photon.komoot.io`, so the screenshots in
`docs/screenshots/` show the overlays and UI over an empty basemap. Lighthouse
scores weren't measured for the same reason. The design targets ≥ 90
(code-split bundle, AA contrast checked in tests, semantic landmarks), but
someone should run Lighthouse against a deployed build.

## Next steps

1. **Indoor floor plans.** Accept per-floor GeoJSON (e.g. IMDF exports,
   OpenStreetMap Simple Indoor Tagging where it exists, or CAD → GeoJSON) in
   `Building.floorplans`. Render units as low extrusions from `bottom` to
   `bottom + 0.3 m` inside the slab, and highlight `Tenant.unitId`.
2. **Real tenant data.** Import from a building's own directory, a CRM or a
   commercial dataset through the existing CSV importer
   (`npm run import:tenants`). Add a `source`/`updatedAt` field and show it
   in the detail panel.
3. **Accurate heights and outlines.** A build-time script to pull
   footprints, roof heights and ground elevation from NYC Open Data's Building
   Footprints (by BIN), replacing the hand-made rectangles (see README).
4. **Per-floor heights.** Optional `floorHeights: number[]` on Building,
   used by `floorMath` when present.
5. **Photorealistic upgrade path.** For photographic buildings, move the
   renderer to **CesiumJS** with Google Photorealistic 3D Tiles or open
   CityGML-derived 3D Tiles of NYC. `floorMath`, search, deep links and the
   selection reducer are renderer-agnostic. The slab becomes a clipped
   `ClassificationPrimitive` or a translucent box entity between
   `bottom` and `top`, and the label a billboard at the floor midpoint.
   Photorealistic tiles need an API key and have usage costs, so this would be
   an optional mode.
6. **Click-to-select on the map.** Query rendered features on tap and match
   them to buildings by `osmId`.
7. **Offline / PWA.** Cache the style, glyphs and recently viewed tiles with
   a service worker. Local search already works offline.

# Build plan

## Stack decision

**Vite + React + TypeScript.** The app has several independently-updating
panels (search combobox, floor selector, detail sheet, toasts) that share a
single selection state. React keeps those declarative and testable, while the
map itself stays imperative: MapLibre is created once and mutated through small
hooks that update sources and paint properties instead of re-adding layers.
React + ReactDOM cost ~45 KB gzip, well inside the 300 KB budget.

Other choices: MapLibre GL JS (BSD-3), OpenFreeMap vector tiles (OpenMapTiles
schema, no key), Photon geocoder with a Nominatim fallback, Tailwind CSS v4,
Lucide icons, Vitest.

## File tree (target)

```
├── docs/
│   ├── PLAN.md
│   ├── LIMITATIONS.md
│   └── pull-requests/pr-{1,2,3}.md
├── public/favicon.svg
├── scripts/import-tenants.ts        CSV → tenants.json
├── src/
│   ├── components/
│   │   ├── map/                     MapView, map layer hooks, FloorMarker
│   │   ├── controls/                MapControls, AttributionControl
│   │   ├── search/                  SearchBar, ResultItem
│   │   ├── floors/                  FloorSelector
│   │   ├── detail/                  DetailPanel (lazy)
│   │   └── ui/                      GlassPanel, IconButton, Toasts, LoadingScreen,
│   │                                OnboardingHint, LiveRegion
│   ├── data/                        buildings.json, tenants.json, index.ts
│   ├── hooks/                       useDebouncedValue, useSearch, useRecentSearches, …
│   ├── lib/
│   │   ├── geocoder/                types, photon, nominatim, client (cache/abort/fallback)
│   │   ├── floorMath.ts
│   │   ├── mapStyle.ts
│   │   ├── mapConfig.ts
│   │   ├── localSearch.ts
│   │   ├── searchMerge.ts
│   │   ├── deepLink.ts
│   │   └── storage.ts
│   ├── types/                       domain + search types
│   ├── App.tsx, main.tsx, index.css
└── README.md
```

## Commits (50) grouped by PR

### Scaffold (on `main`)
1. chore: scaffold Vite, React and TypeScript project

### PR 1 — `feat/foundation-and-3d-map`
2. chore: configure ESLint and Prettier
3. test: set up Vitest with jsdom
4. style: add Tailwind CSS with light-only design tokens
5. feat: add map configuration constants and shared types
6. feat: add custom light MapLibre style
7. test: validate map style layers and palette
8. feat: render base MapLibre map
9. feat: extrude 3D buildings with height-based gradient
10. feat: emphasize NYC landmark towers
11. feat: ease camera into default Manhattan view
12. style: add glass panel and icon button primitives
13. feat: add zoom, compass, tilt and rotate controls
14. feat: add geolocate and fullscreen controls
15. feat: add branded loading screen until first render
16. feat: add attribution footer control
17. feat: add dismissible onboarding hint

### PR 2 — `feat/search-and-data`
18. feat: define geocoder provider interface
19. feat: add Photon geocoder provider
20. feat: add Nominatim provider with rate limiting
21. feat: add cached, abortable geocoder client with fallback
22. test: cover geocoder caching, abort and fallback
23. feat: add building and tenant domain types
24. feat: seed buildings dataset
25. feat: seed fictional tenants dataset
26. feat: add local tenant and building search
27. feat: merge local and remote search results
28. test: cover local search and result merging
29. feat: persist recent searches safely
30. feat: add debounced search hook
31. feat: add search bar with autocomplete dropdown
32. a11y: make search combobox keyboard and screen-reader friendly
33. feat: add toast notifications for errors and offline
34. feat: add CSV tenant import script

### PR 3 — `feat/floor-level-display`
35. feat: add floor height math utility
36. test: cover floor math edge cases
37. feat: add selection state and fly-to for results
38. feat: render selected building as translucent glass shell
39. feat: add highlighted floor slab with rise animation
40. feat: pin floating floor marker at floor height
41. feat: add elevator-style floor selector
42. feat: add lazy-loaded tenant detail panel
43. feat: encode selection and camera in deep links
44. test: cover deep link round-tripping
45. feat: adapt panels to mobile bottom sheets
46. a11y: announce floor changes and manage focus
47. perf: split vendor chunks and reuse map sources
48. docs: write README with architecture and data guide
49. docs: add limitations and pull request descriptions
50. fix: address self-review gaps

Every commit must pass `npm run lint`, `npm run typecheck`, `npm test` and
`npm run build` (for commits made before a script exists, only the scripts that
exist at that point apply). PRs are merged with `git merge --no-ff`, never squashed.

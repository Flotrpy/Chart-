import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { MapView } from './components/map/MapView';
import { MapControls } from './components/controls/MapControls';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { AttributionControl } from './components/controls/AttributionControl';
import { OnboardingHint } from './components/ui/OnboardingHint';
import { SearchBar } from './components/search/SearchBar';
import { geocoder } from './lib/geocoder';
import type { MapLibreMap } from './lib/maplibre';
import type { SearchResult } from './types/search';
import { FLY_DURATION_MS } from './lib/mapConfig';
import { easeInOutCubic, motionDuration } from './lib/motion';
import { ToastProvider } from './components/ui/Toasts';
import { useToast } from './components/ui/toastContext';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useSelection } from './hooks/useSelection';
import { SelectionCamera } from './components/map/SelectionCamera';
import { FloorLayers } from './components/map/FloorLayers';
import { FloorMarker } from './components/map/FloorMarker';
import { getBuilding, getTenant } from './data';
import { FloorSelector } from './components/floors/FloorSelector';
import { PanelSkeleton } from './components/ui/PanelSkeleton';
import { buildShareUrl, parseDeepLink } from './lib/deepLink';
import { selectionReducer, type Selection } from './lib/selection';
import { cameraOf, useDeepLinkSync } from './hooks/useDeepLinkSync';
import { DEFAULT_CAMERA } from './lib/mapConfig';
import { DESKTOP_QUERY, useMediaQuery } from './hooks/useMediaQuery';
import { BottomSheet } from './components/ui/BottomSheet';
import { SHEET_HEIGHT, type SheetSnap } from './components/ui/sheet';
import type { CameraPadding } from './components/map/SelectionCamera';
import { cx } from './components/ui/cx';

// Only needed once something is selected: keep it out of the initial bundle.
const DetailPanel = lazy(() => import('./components/detail/DetailPanel'));

/** Never trap users behind the splash if tiles are slow or blocked. */
const LOADING_TIMEOUT_MS = 10_000;

/** Restores selection and camera from the URL once, at startup. */
function initialStateFromUrl(): { selection: Selection | null; camera?: typeof DEFAULT_CAMERA } {
  const link = parseDeepLink(window.location.search);
  let selection: Selection | null = null;
  if (link.tenantId) {
    selection = selectionReducer(null, { type: 'selectTenant', tenantId: link.tenantId });
  } else if (link.buildingId) {
    selection = selectionReducer(null, {
      type: 'selectBuilding',
      buildingId: link.buildingId,
      floor: link.floor,
    });
  }
  return { selection, camera: link.camera };
}

const INITIAL = initialStateFromUrl();

function AppShell() {
  const [mapReady, setMapReady] = useState(false);
  const { notify } = useToast();
  const [selection, dispatch] = useSelection(INITIAL.selection);
  const [map, setMap] = useState<MapLibreMap | null>(null);
  useDeepLinkSync(map, selection);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>('peek');
  const [mobileTab, setMobileTab] = useState<'details' | 'floors'>('details');
  const padding: CameraPadding = isDesktop
    ? { top: 72, right: selection ? 400 : 72, bottom: 48, left: selection ? 352 : 24 }
    : { top: 72, right: 16, bottom: Math.round(window.innerHeight * SHEET_HEIGHT.peek), left: 16 };
  const selectedBuilding = selection ? getBuilding(selection.buildingId) : undefined;
  const selectedTenant = selection?.tenantId ? getTenant(selection.tenantId) : undefined;
  const mapRef = useRef<MapLibreMap | null>(null);
  const markReady = useCallback(() => setMapReady(true), []);
  const handleLoad = useCallback(
    (instance: MapLibreMap) => {
      mapRef.current = instance;
      setMap(instance);
      markReady();
    },
    [markReady],
  );

  useOnlineStatus((online) =>
    notify({
      key: 'network',
      tone: online ? 'success' : 'info',
      message: online
        ? 'Back online.'
        : 'You’re offline. Saved tenants still work; address search and new map areas need a connection.',
    }),
  );

  const handleSelect = useCallback(
    (result: SearchResult) => {
      if (result.tenantId) {
        dispatch({ type: 'selectTenant', tenantId: result.tenantId });
        return;
      }
      if (result.buildingId) {
        dispatch({ type: 'selectBuilding', buildingId: result.buildingId });
        return;
      }
      dispatch({ type: 'clear' });
      const map = mapRef.current;
      if (!map) return;
      const duration = motionDuration(FLY_DURATION_MS);
      if (result.bbox && result.kind === 'place') {
        map.fitBounds(result.bbox, { padding: 80, duration, maxZoom: 16 });
      } else {
        map.flyTo({ center: result.position, zoom: 17, duration, easing: easeInOutCubic });
      }
    },
    [dispatch],
  );

  useEffect(() => {
    const id = window.setTimeout(markReady, LOADING_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [markReady]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-bg">
      <h1 className="sr-only">NYC Floors — 3D map of New York City</h1>
      <MapView
        onLoad={handleLoad}
        onError={markReady}
        initialCamera={INITIAL.camera ?? DEFAULT_CAMERA}
        animateIntro={!INITIAL.camera && !INITIAL.selection}
      >
        <FloorLayers selection={selection} />
        <SelectionCamera selection={selection} padding={padding} />
        {selectedBuilding && selection?.floor != null && (
          <FloorMarker
            key={`${selectedBuilding.id}:${selection.floor}`}
            building={selectedBuilding}
            floor={selectedTenant?.floor ?? selection.floor}
            span={selectedTenant?.floorsSpanned ?? 1}
            title={selectedTenant?.name ?? selectedBuilding.name}
          />
        )}
        <div className="pointer-events-none absolute right-4 top-4 z-10">
          <MapControls onNotify={(message, tone) => notify({ message, tone })} />
        </div>
      </MapView>
      {mapReady && (
        <div className="pointer-events-none absolute bottom-16 left-1/2 z-20 -translate-x-1/2">
          <OnboardingHint />
        </div>
      )}
      <footer className="pointer-events-none absolute bottom-3 right-3 z-10 flex justify-end">
        <AttributionControl />
      </footer>
      <div className="pointer-events-none absolute left-4 right-[76px] top-4 z-30 sm:right-auto sm:w-[26rem]">
        <SearchBar geocoder={geocoder} onSelect={handleSelect} />
      </div>
      {selectedBuilding &&
        selection &&
        (() => {
          const floorSelector = (
            <FloorSelector
              key={selectedBuilding.id}
              building={selectedBuilding}
              floor={selection.floor}
              tenantId={selection.tenantId}
              onSelectFloor={(floor) => dispatch({ type: 'selectFloor', floor })}
              onSelectTenant={(t) => {
                dispatch({ type: 'selectTenant', tenantId: t.id });
                setMobileTab('details');
              }}
              onClose={() => dispatch({ type: 'clear' })}
            />
          );
          const detail = (
            <Suspense fallback={<PanelSkeleton />}>
              <DetailPanel
                building={selectedBuilding}
                tenant={selectedTenant ?? null}
                shareUrl={buildShareUrl(selection, map ? cameraOf(map) : undefined)}
                onClose={() =>
                  selection.tenantId
                    ? dispatch({ type: 'closeTenant' })
                    : dispatch({ type: 'clear' })
                }
              />
            </Suspense>
          );

          if (isDesktop) {
            return (
              <>
                <aside className="pointer-events-none absolute bottom-16 left-4 top-20 z-20 flex w-80 animate-[slide-in-left_240ms_var(--ease-out)] items-start">
                  {floorSelector}
                </aside>
                <aside className="pointer-events-none absolute bottom-16 right-[76px] top-4 z-20 flex w-[22rem] animate-[slide-in-right_240ms_var(--ease-out)] items-start">
                  {detail}
                </aside>
              </>
            );
          }

          const tabs = (
            <div
              role="tablist"
              aria-label="Panel"
              className="flex gap-1 rounded-md bg-slate-100 p-0.5"
            >
              {(['details', 'floors'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={mobileTab === tab}
                  onClick={() => setMobileTab(tab)}
                  className={cx(
                    'h-9 flex-1 rounded-[9px] text-sm font-medium capitalize transition-colors',
                    mobileTab === tab ? 'bg-white text-ink shadow-sm' : 'text-muted',
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          );
          return (
            <BottomSheet
              label={selectedTenant?.name ?? selectedBuilding.name}
              snap={sheetSnap}
              onSnapChange={setSheetSnap}
              header={tabs}
            >
              <div
                role="tabpanel"
                className="flex h-full flex-col p-2 pt-1 [&>*]:max-h-full [&>*]:shadow-none"
              >
                {mobileTab === 'details' ? detail : floorSelector}
              </div>
            </BottomSheet>
          );
        })()}
      <LoadingScreen done={mapReady} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppShell />
    </ToastProvider>
  );
}

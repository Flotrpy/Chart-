import { GlassPanel } from './GlassPanel';

/** Placeholder while the detail panel chunk loads. */
export function PanelSkeleton() {
  return (
    <GlassPanel
      className="pointer-events-auto w-full overflow-hidden"
      aria-busy="true"
      aria-label="Loading details"
    >
      <div className="h-32 animate-pulse bg-slate-100" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/4 animate-pulse rounded bg-slate-100" />
        <div className="h-5 w-2/3 animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="h-11 animate-pulse rounded-md bg-slate-100" />
          <div className="h-11 animate-pulse rounded-md bg-slate-100" />
        </div>
      </div>
    </GlassPanel>
  );
}

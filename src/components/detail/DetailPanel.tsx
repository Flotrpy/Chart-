import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Clock,
  Globe,
  Info,
  Layers,
  MapPin,
  Navigation,
  Phone,
  Share2,
  X,
} from 'lucide-react';
import type { Building, Tenant } from '../../types/domain';
import { tenantsInBuilding } from '../../data';
import { directionsUrl, osmDirectionsUrl, copyText, telHref } from '../../lib/links';
import { GlassPanel } from '../ui/GlassPanel';
import { IconButton } from '../ui/IconButton';
import { ICON_PROPS_SM } from '../ui/icons';
import { useToast } from '../ui/toastContext';

export interface DetailPanelProps {
  building: Building;
  tenant: Tenant | null;
  /** Absolute URL that reopens exactly this view. */
  shareUrl: string;
  onClose: () => void;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z0-9]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

function floorText(t: Tenant): string {
  const span = t.floorsSpanned ?? 1;
  return span > 1 ? `Floors ${t.floor}–${t.floor + span - 1}` : `Floor ${t.floor}`;
}

function Row({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <Icon {...ICON_PROPS_SM} className="mt-0.5 shrink-0 text-muted" />
      <div className="min-w-0 flex-1 text-sm text-ink">{children}</div>
    </li>
  );
}

/** Tenant (or building) details. Lazy-loaded: not part of the initial bundle. */
export default function DetailPanel({ building, tenant, shareUrl, onClose }: DetailPanelProps) {
  const { notify } = useToast();
  const [copied, setCopied] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const title = tenant?.name ?? building.name;
  const position = tenant ? ([tenant.lng, tenant.lat] as const) : building.center;

  // When a tenant opens from search or the floor list, move focus to its
  // name so keyboard and screen-reader users land on the new content.
  const focusKey = tenant?.id ?? building.id;
  useEffect(() => {
    const active = document.activeElement;
    const fromElsewhere =
      !active || active === document.body || active.closest('[role="combobox"], [aria-pressed]');
    if (fromElsewhere) headingRef.current?.focus({ preventScroll: true });
  }, [focusKey]);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(id);
  }, [copied]);

  const share = async () => {
    if (await copyText(shareUrl)) {
      setCopied(true);
      notify({ key: 'share', tone: 'success', message: 'Link copied to clipboard.' });
    } else {
      notify({
        key: 'share',
        tone: 'error',
        message: 'Couldn’t copy the link. Copy it from the address bar.',
      });
    }
  };

  const buildingTenants = tenant ? [] : tenantsInBuilding(building.id);

  return (
    <GlassPanel
      role="dialog"
      aria-modal="false"
      aria-labelledby="detail-title"
      className="pointer-events-auto flex max-h-full w-full flex-col overflow-hidden"
    >
      {/* Photo placeholder: no free imagery source, so a branded tile instead. */}
      <div className="relative h-32 shrink-0 overflow-hidden bg-gradient-to-br from-primary-soft via-white to-highlight-soft">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(90deg,rgb(37_99_235/0.08)_1px,transparent_1px),linear-gradient(rgb(37_99_235/0.08)_1px,transparent_1px)] [background-size:18px_18px]" />
        {tenant?.logo ? (
          <img
            src={tenant.logo}
            alt=""
            className="absolute bottom-3 left-4 h-14 w-14 rounded-lg bg-white object-contain p-1.5 shadow-soft"
          />
        ) : (
          <span
            aria-hidden="true"
            className="absolute bottom-3 left-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-white text-lg font-semibold text-primary shadow-soft"
          >
            {initials(title)}
          </span>
        )}
        <IconButton
          label="Close details"
          onClick={onClose}
          className="absolute right-1.5 top-1.5 bg-white/70 backdrop-blur hover:bg-white"
        >
          <X {...ICON_PROPS_SM} />
        </IconButton>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {tenant && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-muted">
              {tenant.category}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-highlight-soft px-2 py-0.5 text-[11px] font-semibold text-amber-800">
            <Layers size={12} strokeWidth={1.5} aria-hidden="true" />
            {tenant ? floorText(tenant) : `${building.totalFloors} floors`}
          </span>
        </div>
        <h2
          id="detail-title"
          ref={headingRef}
          tabIndex={-1}
          className="mt-2 text-lg font-semibold leading-snug tracking-tight text-ink outline-none"
        >
          {title}
        </h2>
        {tenant && <p className="text-sm text-muted">in {building.name}</p>}
        {tenant?.description && <p className="mt-2 text-sm text-ink/80">{tenant.description}</p>}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <a
            href={directionsUrl([position[0], position[1]])}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <Navigation {...ICON_PROPS_SM} />
            Get directions
          </a>
          <button
            type="button"
            onClick={share}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-medium text-ink transition-colors hover:bg-slate-50"
          >
            {copied ? (
              <Check {...ICON_PROPS_SM} className="text-success" />
            ) : (
              <Share2 {...ICON_PROPS_SM} />
            )}
            {copied ? 'Copied' : 'Share'}
          </button>
        </div>

        <ul className="mt-3 divide-y divide-line">
          <Row icon={MapPin}>
            {tenant?.address ?? building.address}
            <a
              href={osmDirectionsUrl([position[0], position[1]])}
              target="_blank"
              rel="noreferrer"
              className="mt-0.5 block text-xs text-primary hover:underline"
            >
              Directions on OpenStreetMap
            </a>
          </Row>
          {tenant?.hours && <Row icon={Clock}>{tenant.hours}</Row>}
          {tenant?.phone && (
            <Row icon={Phone}>
              <a href={telHref(tenant.phone)} className="text-primary hover:underline">
                {tenant.phone}
              </a>
            </Row>
          )}
          {tenant?.website && (
            <Row icon={Globe}>
              <a
                href={tenant.website}
                target="_blank"
                rel="noreferrer"
                className="break-all text-primary hover:underline"
              >
                {tenant.website.replace(/^https?:\/\//, '')}
              </a>
            </Row>
          )}
          {!tenant && (
            <Row icon={Layers}>
              {building.totalFloors} floors · roof {Math.round(building.heightMeters)} m ·{' '}
              {buildingTenants.length} listed tenant{buildingTenants.length === 1 ? '' : 's'}
            </Row>
          )}
        </ul>

        <p className="mt-4 flex gap-2 rounded-md bg-slate-50 p-3 text-xs text-muted">
          <Info {...ICON_PROPS_SM} className="mt-0.5 shrink-0" />
          <span>
            Floors are shown as a highlighted band at their real height. Interior layouts aren’t
            available from open data. Tenant listings here are fictional demo data.
          </span>
        </p>
      </div>
    </GlassPanel>
  );
}

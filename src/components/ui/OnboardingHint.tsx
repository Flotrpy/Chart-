import { useState } from 'react';
import { Hand, Move3d, Search, X } from 'lucide-react';
import { GlassPanel } from './GlassPanel';
import { ICON_PROPS_SM } from './icons';
import { readJSON, writeJSON } from '../../lib/storage';

const STORAGE_KEY = 'onboarding-dismissed';

const TIPS = [
  { icon: Hand, text: 'Drag to pan, scroll or pinch to zoom' },
  { icon: Move3d, text: 'Right-drag or two-finger drag to rotate and tilt' },
  { icon: Search, text: 'Search a business to see the exact floor it’s on' },
] as const;

/** First-visit tips. Dismissal is remembered (when storage is available). */
export function OnboardingHint() {
  const [visible, setVisible] = useState(() => !readJSON<boolean>(STORAGE_KEY, false));

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    writeJSON(STORAGE_KEY, true);
  };

  return (
    <GlassPanel
      role="dialog"
      aria-label="How to use the map"
      className="pointer-events-auto animate-[slide-up_280ms_var(--ease-out)] relative w-[min(22rem,calc(100vw-2rem))] p-4 pr-12"
    >
      <p className="mb-2 text-sm font-semibold text-ink">Explore New York in 3D</p>
      <ul className="space-y-1.5">
        {TIPS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-2 text-sm text-muted">
            <Icon {...ICON_PROPS_SM} className="mt-0.5 shrink-0 text-primary" />
            <span>{text}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss tips"
        className="absolute right-1.5 top-1.5 inline-flex h-11 w-11 items-center justify-center rounded-md text-muted hover:bg-slate-900/5 hover:text-ink"
      >
        <X {...ICON_PROPS_SM} />
      </button>
    </GlassPanel>
  );
}

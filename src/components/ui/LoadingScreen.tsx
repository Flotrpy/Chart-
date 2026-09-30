import { useEffect, useState } from 'react';
import { cx } from './cx';

interface LoadingScreenProps {
  /** When true the overlay fades out and then unmounts. */
  done: boolean;
}

const FADE_MS = 400;

/** Branded splash shown until the map's first render. */
export function LoadingScreen({ done }: LoadingScreenProps) {
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(() => setRemoved(true), FADE_MS);
    return () => window.clearTimeout(id);
  }, [done]);

  if (removed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={!done}
      className={cx(
        'absolute inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-bg',
        'transition-opacity duration-[400ms] ease-out',
        done ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
    >
      <div className="flex h-14 items-end gap-1.5" aria-hidden="true">
        {[0.55, 0.85, 1, 0.7, 0.4].map((h, i) => (
          <span
            key={i}
            className={cx(
              'loader-bar w-3 origin-bottom rounded-t-[3px]',
              i === 2 ? 'bg-highlight' : 'bg-primary/80',
            )}
            style={{ height: `${h * 100}%`, animationDelay: `${i * 110}ms` }}
          />
        ))}
      </div>
      <div className="text-center">
        <p className="text-base font-semibold tracking-tight text-ink">NYC Floors</p>
        <p className="text-sm text-muted">{done ? 'Map ready' : 'Loading the city in 3D…'}</p>
      </div>
    </div>
  );
}

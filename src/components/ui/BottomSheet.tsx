import { useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { cx } from './cx';
import { SHEET_HEIGHT, type SheetSnap } from './sheet';

interface BottomSheetProps {
  label: string;
  children: ReactNode;
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  /** Optional row rendered next to the drag handle (e.g. tabs). */
  header?: ReactNode;
}

const DRAG_THRESHOLD_PX = 40;

/**
 * Mobile bottom sheet with two snap points. The handle is a real button
 * (tap or Enter toggles) and also a drag target: swipe up to expand, down
 * to collapse. Content scrolls independently inside.
 */
export function BottomSheet({ label, children, snap, onSnapChange, header }: BottomSheetProps) {
  const start = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    start.current = e.clientY;
    // Optional: missing in some older browsers and in jsdom.
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (start.current !== null) setDragY(e.clientY - start.current);
  };
  const onPointerUp = () => {
    if (start.current === null) return;
    if (dragY < -DRAG_THRESHOLD_PX) onSnapChange('full');
    else if (dragY > DRAG_THRESHOLD_PX) onSnapChange('peek');
    start.current = null;
    setDragY(0);
  };

  return (
    <section
      aria-label={label}
      className={cx(
        'glass pointer-events-auto fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-lg pb-[env(safe-area-inset-bottom)]',
        dragY === 0 && 'transition-[height] duration-[260ms] ease-out',
      )}
      style={{
        height: `calc(${SHEET_HEIGHT[snap] * 100}dvh - ${dragY}px)`,
      }}
    >
      <div className="flex shrink-0 items-center gap-2 px-3 pt-1">
        <button
          type="button"
          aria-label={snap === 'full' ? 'Collapse panel' : 'Expand panel'}
          aria-expanded={snap === 'full'}
          onClick={() => {
            if (dragY === 0) onSnapChange(snap === 'full' ? 'peek' : 'full');
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="flex h-11 w-16 shrink-0 touch-none items-center justify-center"
        >
          <span className="h-1.5 w-10 rounded-full bg-slate-300" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">{header}</div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </section>
  );
}

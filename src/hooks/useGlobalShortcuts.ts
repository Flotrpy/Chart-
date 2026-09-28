import { useEffect, useRef } from 'react';

interface Shortcuts {
  /** "/" focuses search (ignored while typing in a field). */
  onFocusSearch: () => void;
  /** Escape outside inputs steps back: tenant → building → nothing. */
  onEscape: () => void;
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
}

export function useGlobalShortcuts(shortcuts: Shortcuts): void {
  const ref = useRef(shortcuts);
  useEffect(() => {
    ref.current = shortcuts;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '/' && !isTyping(e.target)) {
        e.preventDefault();
        ref.current.onFocusSearch();
      } else if (e.key === 'Escape' && !isTyping(e.target)) {
        ref.current.onEscape();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

import { useEffect, useRef } from 'react';

/** Calls back when connectivity changes (not on mount). */
export function useOnlineStatus(onChange: (online: boolean) => void): void {
  const ref = useRef(onChange);
  useEffect(() => {
    ref.current = onChange;
  });
  useEffect(() => {
    const on = () => ref.current(true);
    const off = () => ref.current(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
}

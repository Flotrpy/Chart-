import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { ToastContext, type ToastApi, type ToastInput, type ToastTone } from './toastContext';
import { ICON_PROPS_SM } from './icons';
import { cx } from './cx';

interface Toast extends Required<Pick<ToastInput, 'message' | 'key'>> {
  tone: ToastTone;
  durationMs: number;
}

const ICONS = { info: Info, success: CheckCircle2, error: AlertCircle } as const;
const TONE_CLASS: Record<ToastTone, string> = {
  info: 'text-primary',
  success: 'text-success',
  error: 'text-error',
};
const MAX_TOASTS = 3;
let counter = 0;

function ToastItem({ toast, dismiss }: { toast: Toast; dismiss: (key: string) => void }) {
  const Icon = ICONS[toast.tone];
  const onDismiss = useCallback(() => dismiss(toast.key), [dismiss, toast.key]);
  useEffect(() => {
    if (toast.durationMs <= 0) return;
    const id = window.setTimeout(onDismiss, toast.durationMs);
    return () => window.clearTimeout(id);
  }, [toast, onDismiss]);

  return (
    <li
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className="glass pointer-events-auto flex w-[min(24rem,calc(100vw-2rem))] animate-[slide-up_220ms_var(--ease-out)] items-start gap-3 rounded-md py-3 pl-3.5 pr-1.5 shadow-lift"
    >
      <Icon {...ICON_PROPS_SM} className={cx('mt-0.5 shrink-0', TONE_CLASS[toast.tone])} />
      <p className="flex-1 text-sm text-ink">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="-my-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-slate-900/5 hover:text-ink"
      >
        <X {...ICON_PROPS_SM} />
      </button>
    </li>
  );
}

/** Provides `useToast()` and renders the toast stack (bottom-centre). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((key: string) => {
    setToasts((list) => list.filter((t) => t.key !== key));
  }, []);

  const notify = useCallback((input: ToastInput) => {
    const toast: Toast = {
      message: input.message,
      tone: input.tone ?? 'info',
      key: input.key ?? `toast-${++counter}`,
      durationMs: input.durationMs ?? (input.tone === 'error' ? 7000 : 4500),
    };
    setToasts((list) => [...list.filter((t) => t.key !== toast.key), toast].slice(-MAX_TOASTS));
  }, []);

  const api = useMemo<ToastApi>(() => ({ notify, dismiss }), [notify, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ol
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-0 bottom-16 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6"
      >
        {toasts.map((t) => (
          <ToastItem key={t.key} toast={t} dismiss={dismiss} />
        ))}
      </ol>
    </ToastContext.Provider>
  );
}

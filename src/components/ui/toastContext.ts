import { createContext, useContext } from 'react';

export type ToastTone = 'info' | 'success' | 'error';

export interface ToastInput {
  message: string;
  tone?: ToastTone;
  /** Same-key toasts replace each other instead of stacking. */
  key?: string;
  durationMs?: number;
}

export interface ToastApi {
  notify: (toast: ToastInput) => void;
  dismiss: (key: string) => void;
}

export const ToastContext = createContext<ToastApi>({ notify: () => {}, dismiss: () => {} });

export function useToast(): ToastApi {
  return useContext(ToastContext);
}

import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { ToastProvider } from './Toasts';
import { useToast, type ToastInput } from './toastContext';

function Trigger({ toast }: { toast: ToastInput }) {
  const { notify } = useToast();
  return (
    <button type="button" onClick={() => notify(toast)}>
      go
    </button>
  );
}

describe('ToastProvider', () => {
  it('shows errors as alerts and auto-dismisses them', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger toast={{ message: 'Search failed', tone: 'error', durationMs: 1000 }} />
      </ToastProvider>,
    );
    act(() => screen.getByRole('button', { name: 'go' }).click());
    expect(screen.getByRole('alert')).toHaveTextContent('Search failed');
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('replaces toasts that share a key', () => {
    render(
      <ToastProvider>
        <Trigger toast={{ message: 'Offline', key: 'net' }} />
      </ToastProvider>,
    );
    const btn = screen.getByRole('button', { name: 'go' });
    act(() => btn.click());
    act(() => btn.click());
    expect(screen.getAllByText('Offline')).toHaveLength(1);
  });
});

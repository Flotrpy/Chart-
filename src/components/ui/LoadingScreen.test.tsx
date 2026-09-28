import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { LoadingScreen } from './LoadingScreen';

describe('LoadingScreen', () => {
  it('announces loading, then unmounts after fading out', () => {
    vi.useFakeTimers();
    const { rerender } = render(<LoadingScreen done={false} />);
    expect(screen.getByRole('status')).toHaveTextContent(/loading the city/i);

    rerender(<LoadingScreen done />);
    expect(screen.getByRole('status')).toHaveTextContent(/map ready/i);

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});

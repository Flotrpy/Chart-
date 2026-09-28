import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BottomSheet } from './BottomSheet';

describe('BottomSheet', () => {
  it('toggles between peek and full with the handle button', async () => {
    const onSnapChange = vi.fn();
    const { rerender } = render(
      <BottomSheet label="Details" snap="peek" onSnapChange={onSnapChange}>
        content
      </BottomSheet>,
    );
    const handle = screen.getByRole('button', { name: /expand panel/i });
    expect(handle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(handle);
    expect(onSnapChange).toHaveBeenCalledWith('full');

    rerender(
      <BottomSheet label="Details" snap="full" onSnapChange={onSnapChange}>
        content
      </BottomSheet>,
    );
    await userEvent.click(screen.getByRole('button', { name: /collapse panel/i }));
    expect(onSnapChange).toHaveBeenLastCalledWith('peek');
    expect(screen.getByRole('region', { name: 'Details' })).toHaveTextContent('content');
  });
});

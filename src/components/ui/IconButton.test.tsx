import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('exposes its label as the accessible name and fires clicks', async () => {
    const onClick = vi.fn();
    render(
      <IconButton label="Zoom in" onClick={onClick}>
        +
      </IconButton>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('reflects the active state via aria-pressed', () => {
    render(
      <IconButton label="3D" active>
        3D
      </IconButton>,
    );
    expect(screen.getByRole('button', { name: '3D' })).toHaveAttribute('aria-pressed', 'true');
  });
});

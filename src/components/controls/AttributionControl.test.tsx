import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AttributionControl } from './AttributionControl';

describe('AttributionControl', () => {
  it('always shows the OpenStreetMap credit', () => {
    render(<AttributionControl />);
    expect(screen.getByRole('link', { name: /openstreetmap contributors/i })).toHaveAttribute(
      'href',
      'https://www.openstreetmap.org/copyright',
    );
  });

  it('expands to list OpenFreeMap and MapLibre', async () => {
    render(<AttributionControl />);
    await userEvent.click(screen.getByRole('button', { name: /show all map credits/i }));
    expect(screen.getByRole('link', { name: 'OpenFreeMap' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'MapLibre' })).toBeVisible();
  });
});

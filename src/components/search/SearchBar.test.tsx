import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GeocoderClient } from '../../lib/geocoder/client';
import { SearchBar } from './SearchBar';

const geocoder: GeocoderClient = {
  search: vi.fn(async () => ({
    results: [
      {
        id: 'photon:1',
        kind: 'place' as const,
        title: 'Acme Plaza Park',
        position: [-73.9, 40.7] as [number, number],
        source: 'photon',
      },
    ],
    provider: 'photon',
  })),
};

function setup() {
  const onSelect = vi.fn();
  render(<SearchBar geocoder={geocoder} onSelect={onSelect} />);
  return { onSelect, input: screen.getByRole('combobox', { name: /search new york city/i }) };
}

describe('SearchBar', () => {
  afterEach(() => window.localStorage.clear());

  it('is an ARIA combobox that expands with local results as you type', async () => {
    const { input } = setup();
    expect(input).toHaveAttribute('aria-expanded', 'false');
    await userEvent.type(input, 'acme');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /acme corp/i })).toBeInTheDocument();
  });

  it('navigates with arrow keys and selects with Enter', async () => {
    const { input, onSelect } = setup();
    await userEvent.type(input, 'acme');
    await userEvent.keyboard('{ArrowDown}');
    const first = screen.getAllByRole('option')[0];
    expect(first).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', first?.id);
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'acme-corp' }));
  });

  it('wraps from the first option to the last with ArrowUp', async () => {
    const { input } = setup();
    await userEvent.type(input, 'finance');
    await userEvent.keyboard('{ArrowUp}');
    const options = screen.getAllByRole('option');
    expect(options[options.length - 1]).toHaveAttribute('aria-selected', 'true');
  });

  it('closes on Escape, then clears on a second Escape', async () => {
    const { input } = setup();
    await userEvent.type(input, 'acme');
    await userEvent.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    await userEvent.keyboard('{Escape}');
    expect(input).toHaveValue('');
  });

  it('announces the number of results', async () => {
    const { input } = setup();
    await userEvent.type(input, 'acme');
    expect(await screen.findByText(/results? available/i)).toBeInTheDocument();
  });

  it('shows recent searches on focus after a selection', async () => {
    const { input } = setup();
    await userEvent.type(input, 'acme');
    await userEvent.keyboard('{Enter}');
    await userEvent.clear(input);
    await userEvent.click(input);
    expect(screen.getByRole('group', { name: /recent/i })).toBeInTheDocument();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// WebGL is not available in jsdom; the map itself is exercised in the browser.
vi.mock('./components/map/MapView', () => ({
  MapView: () => <div data-testid="map" />,
}));

describe('App', () => {
  it('renders the product heading, the map and the search box', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /nyc floors/i })).toBeInTheDocument();
    expect(screen.getByTestId('map')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /search new york city/i })).toBeInTheDocument();
  });

  it('focuses search with the "/" shortcut', async () => {
    render(<App />);
    await userEvent.keyboard('/');
    expect(screen.getByRole('combobox', { name: /search new york city/i })).toHaveFocus();
  });

  // jsdom has no matchMedia, so this exercises the mobile bottom-sheet layout.
  it('opens details and floors in the sheet when a tenant is chosen, and announces it', async () => {
    render(<App />);
    await userEvent.type(screen.getByRole('combobox'), 'acme');
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('heading', { name: 'Acme Corp' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: /floors/i }));
    expect(screen.getByRole('region', { name: /empire state building/i })).toBeInTheDocument();
    expect(
      screen.getByText('Acme Corp, floors 10 to 11 of Empire State Building, highlighted.'),
    ).toBeInTheDocument();
  });
});

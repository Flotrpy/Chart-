import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

// WebGL is not available in jsdom; the map itself is exercised in the browser.
vi.mock('./components/map/MapView', () => ({
  MapView: () => <div data-testid="map" />,
}));

describe('App', () => {
  it('renders the product heading and the map', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /nyc floors/i })).toBeInTheDocument();
    expect(screen.getByTestId('map')).toBeInTheDocument();
  });
});

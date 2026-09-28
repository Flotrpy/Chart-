import { jsx as _jsx } from 'react/jsx-runtime';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
describe('App', () => {
  it('renders the product name', () => {
    render(_jsx(App, {}));
    expect(screen.getByRole('heading', { name: /nyc floors/i })).toBeInTheDocument();
  });
});

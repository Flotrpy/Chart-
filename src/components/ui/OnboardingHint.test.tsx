import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingHint } from './OnboardingHint';

describe('OnboardingHint', () => {
  afterEach(() => window.localStorage.clear());

  it('shows tips until dismissed and remembers the dismissal', async () => {
    const { unmount } = render(<OnboardingHint />);
    expect(screen.getByRole('dialog', { name: /how to use the map/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /dismiss tips/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    unmount();

    render(<OnboardingHint />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

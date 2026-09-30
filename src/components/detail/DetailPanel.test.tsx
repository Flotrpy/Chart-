import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getBuilding, getTenant } from '../../data';
import DetailPanel from './DetailPanel';

const esb = getBuilding('empire-state-building');
const acme = getTenant('acme-corp');
if (!esb || !acme) throw new Error('fixtures missing');

describe('DetailPanel', () => {
  it('shows tenant name, floor span, address and actions', () => {
    render(
      <DetailPanel
        building={esb}
        tenant={acme}
        getShareUrl={() => 'https://x/?tenant=acme-corp'}
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Acme Corp' })).toBeInTheDocument();
    expect(screen.getByText('Floors 10–11')).toBeInTheDocument();
    expect(screen.getByText(acme.address)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /get directions/i })).toHaveAttribute(
      'href',
      expect.stringContaining('destination=40.748440'),
    );
    expect(screen.getByRole('link', { name: acme.phone })).toHaveAttribute(
      'href',
      expect.stringMatching(/^tel:/),
    );
  });

  it('copies the share link', async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(
      <DetailPanel
        building={esb}
        tenant={acme}
        getShareUrl={() => 'https://x/?tenant=acme-corp'}
        onClose={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /share/i }));
    expect(writeText).toHaveBeenCalledWith('https://x/?tenant=acme-corp');
    expect(await screen.findByRole('button', { name: /copied/i })).toBeInTheDocument();
  });

  it('describes the building when no tenant is selected and can close', async () => {
    const onClose = vi.fn();
    render(
      <DetailPanel
        building={esb}
        tenant={null}
        getShareUrl={() => 'https://x/'}
        onClose={onClose}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Empire State Building' })).toBeInTheDocument();
    expect(screen.getByText(/102 floors · roof 381 m/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /close details/i }));
    expect(onClose).toHaveBeenCalled();
  });
});

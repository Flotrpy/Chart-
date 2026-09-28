import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getBuilding } from '../../data';
import { FloorSelector } from './FloorSelector';

const esb = getBuilding('empire-state-building');
if (!esb) throw new Error('fixture missing');

const setup = (floor: number | null = 10) => {
  const props = {
    onSelectFloor: vi.fn(),
    onSelectTenant: vi.fn(),
    onClose: vi.fn(),
  };
  render(<FloorSelector building={esb} floor={floor} tenantId={null} {...props} />);
  return props;
};

describe('FloorSelector', () => {
  it('lists occupied floors and marks the current one', () => {
    setup(10);
    const current = screen.getByRole('button', { name: /^floor 10: acme corp/i });
    expect(current).toHaveAttribute('aria-current', 'true');
    expect(current).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('button', { name: /^floor 61: gotham/i })).toHaveAttribute(
      'tabindex',
      '-1',
    );
  });

  it('selects floors by click and by arrow keys', async () => {
    const { onSelectFloor } = setup(10);
    await userEvent.click(screen.getByRole('button', { name: /^floor 21/i }));
    expect(onSelectFloor).toHaveBeenLastCalledWith(21);
    screen.getByRole('button', { name: /^floor 10:/i }).focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(onSelectFloor).toHaveBeenLastCalledWith(11);
  });

  it('opens tenants on the current floor', async () => {
    const { onSelectTenant } = setup(10);
    await userEvent.click(screen.getByRole('button', { name: /^acme corp/i }));
    expect(onSelectTenant).toHaveBeenCalledWith(expect.objectContaining({ id: 'acme-corp' }));
  });

  it('offers a whole-building reset and a close button', async () => {
    const { onSelectFloor, onClose } = setup(10);
    await userEvent.click(screen.getByRole('button', { name: /show whole building/i }));
    expect(onSelectFloor).toHaveBeenLastCalledWith(null);
    await userEvent.click(screen.getByRole('button', { name: /close building/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('can show every floor', async () => {
    setup(null);
    const before = screen.getAllByRole('button', { name: /^floor \d+/i }).length;
    await userEvent.click(
      screen.getByRole('checkbox', { name: /only floors with listed tenants/i }),
    );
    expect(screen.getAllByRole('button', { name: /^floor \d+/i }).length).toBe(esb.totalFloors);
    expect(before).toBeLessThan(esb.totalFloors);
  });
});

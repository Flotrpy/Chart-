import type { HTMLAttributes } from 'react';
import { cx } from './cx';

type GlassPanelProps = HTMLAttributes<HTMLDivElement> & {
  /** Rounded corner size. `lg` (16px) for sheets, `md` (12px) for toolbars. */
  radius?: 'md' | 'lg';
};

/** Frosted white surface (85% white, 16px blur, 1px hairline border). */
export function GlassPanel({ radius = 'lg', className, ...rest }: GlassPanelProps) {
  return (
    <div
      className={cx('glass', radius === 'lg' ? 'rounded-lg' : 'rounded-md', className)}
      {...rest}
    />
  );
}

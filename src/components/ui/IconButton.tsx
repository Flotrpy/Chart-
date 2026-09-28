import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cx } from './cx';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Required: icon-only buttons need an accessible name. */
  label: string;
  children: ReactNode;
  /** Visually "pressed" (e.g. 3D mode on). Also sets aria-pressed. */
  active?: boolean;
  variant?: 'ghost' | 'solid';
};

/** 44×44 touch target with a visible focus ring and hover/active states. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, children, active, variant = 'ghost', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={active === undefined ? undefined : active}
      className={cx(
        'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink',
        'transition-colors duration-150 ease-out',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'disabled:cursor-not-allowed disabled:opacity-40',
        variant === 'solid'
          ? 'bg-primary text-white hover:bg-primary-hover'
          : 'hover:bg-slate-900/5 active:bg-slate-900/10',
        active && variant === 'ghost' && 'bg-primary-soft text-primary hover:bg-primary-soft',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

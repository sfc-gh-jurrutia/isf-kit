import React, { ReactNode, ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

/* ----------------------------------------------------------------
   Card
   ---------------------------------------------------------------- */

const cardVariantClass = {
  surface: 'theme-card',
  elevated: 'theme-card-elevated',
  accent: 'theme-card-accent',
  glow: 'persona-glow-card',
} as const;

export type CardVariant = keyof typeof cardVariantClass;

export interface CardProps {
  variant?: CardVariant;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

export function Card({ variant = 'surface', className, children, onClick }: CardProps) {
  return (
    <div
      className={clsx(cardVariantClass[variant], onClick && 'cursor-pointer', className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {children}
    </div>
  );
}

/* ----------------------------------------------------------------
   SectionHeader
   ---------------------------------------------------------------- */

export interface SectionHeaderProps {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, icon, action, className }: SectionHeaderProps) {
  return (
    <div className={clsx('section-header', className)}>
      <div className="section-header-left">
        {icon && <span className="section-header-icon">{icon}</span>}
        <h3 className="section-header-title">{title}</h3>
      </div>
      {action && <div className="section-header-action">{action}</div>}
    </div>
  );
}

/* ----------------------------------------------------------------
   Badge
   ---------------------------------------------------------------- */

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span
      className={clsx(
        'theme-badge',
        variant !== 'default' && `badge-${variant}`,
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ----------------------------------------------------------------
   Button
   ---------------------------------------------------------------- */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(`theme-button-${variant}`, loading && 'is-loading', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && (
        <svg
          className="button-spinner"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="28 10" />
        </svg>
      )}
      {children}
    </button>
  );
}

/* ----------------------------------------------------------------
   StatusDot
   ---------------------------------------------------------------- */

export type StatusDotStatus = 'success' | 'warning' | 'danger' | 'idle';

export interface StatusDotProps {
  status: StatusDotStatus;
  className?: string;
}

export function StatusDot({ status, className }: StatusDotProps) {
  return <span className={clsx('status-dot', `status-dot-${status}`, className)} aria-label={status} />;
}

/* ----------------------------------------------------------------
   DataState
   Wraps children with a shimmer loading overlay and stagger
   animation. Pass `isLoading` to toggle the revalidating shimmer.
   ---------------------------------------------------------------- */

export interface DataStateProps {
  isLoading: boolean;
  className?: string;
  children: ReactNode;
}

export function DataState({ isLoading, className, children }: DataStateProps) {
  return (
    <div
      className={clsx(
        isLoading && 'data-revalidating',
        !isLoading && 'stagger-children',
        className,
      )}
    >
      {children}
    </div>
  );
}

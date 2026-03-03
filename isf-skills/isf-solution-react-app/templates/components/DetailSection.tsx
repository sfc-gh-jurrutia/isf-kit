import React, { ReactNode } from 'react';
import clsx from 'clsx';
import { DataState } from './ThemedCard';

/* ----------------------------------------------------------------
   DetailSection
   Slide-up container that appears when an entity is selected.
   Wraps children with animate-slide-up entry animation and
   DataState loading shimmer.
   ---------------------------------------------------------------- */

export interface DetailSectionProps {
  /** The selected entity ID. Section renders only when truthy. */
  entityId: string | null | undefined;
  /** Loading state for shimmer overlay. */
  isLoading?: boolean;
  /** Section header content (entity name, badges, close button). */
  header?: ReactNode;
  /** Detail content panels. */
  children: ReactNode;
  /** Called when the close/dismiss button is clicked. */
  onClose?: () => void;
  className?: string;
}

export function DetailSection({
  entityId,
  isLoading = false,
  header,
  children,
  onClose,
  className,
}: DetailSectionProps) {
  if (!entityId) return null;

  return (
    <div
      className={clsx('animate-slide-up', className)}
      style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
      }}
    >
      {/* Header bar */}
      {(header || onClose) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {header}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close detail section"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: 18,
                padding: '4px 8px',
                borderRadius: 4,
                lineHeight: 1,
              }}
            >
              &times;
            </button>
          )}
        </div>
      )}

      {/* Content with loading state */}
      <DataState isLoading={isLoading}>
        <div style={{ padding: 16 }}>
          {children}
        </div>
      </DataState>
    </div>
  );
}

/**
 * Skeleton - Loading placeholder components
 * 
 * Provides shimmer animation placeholders for content loading states.
 * Supports various shapes and sizes for different content types.
 */

import React from 'react';

// =============================================================================
// BASE SKELETON
// =============================================================================

interface SkeletonBaseProps {
  className?: string;
  animate?: boolean;
}

function SkeletonBase({ className = '', animate = true }: SkeletonBaseProps) {
  return (
    <div
      className={`
        bg-gray-200 dark:bg-gray-700 rounded
        ${animate ? 'animate-pulse' : ''}
        ${className}
      `}
    />
  );
}

// =============================================================================
// SKELETON VARIANTS
// =============================================================================

interface SkeletonProps {
  className?: string;
}

/** Single line of text */
export function SkeletonText({ className = '' }: SkeletonProps) {
  return <SkeletonBase className={`h-4 w-full ${className}`} />;
}

/** Short text (titles, labels) */
export function SkeletonTitle({ className = '' }: SkeletonProps) {
  return <SkeletonBase className={`h-6 w-48 ${className}`} />;
}

/** Circular avatar */
export function SkeletonAvatar({ className = '' }: SkeletonProps) {
  return <SkeletonBase className={`h-10 w-10 rounded-full ${className}`} />;
}

/** Rectangular image/thumbnail */
export function SkeletonImage({ className = '' }: SkeletonProps) {
  return <SkeletonBase className={`h-32 w-full ${className}`} />;
}

/** Button placeholder */
export function SkeletonButton({ className = '' }: SkeletonProps) {
  return <SkeletonBase className={`h-10 w-24 rounded-md ${className}`} />;
}

// =============================================================================
// COMPOSITE SKELETONS
// =============================================================================

/** KPI card loading state */
export function SkeletonKPI({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <SkeletonBase className="h-4 w-20 mb-2" />
      <SkeletonBase className="h-8 w-32 mb-1" />
      <SkeletonBase className="h-4 w-24" />
    </div>
  );
}

/** Chart loading state */
export function SkeletonChart({ className = '', height = 'h-64' }: SkeletonProps & { height?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <SkeletonBase className="h-5 w-40 mb-4" />
      <div className={`${height} flex items-end justify-between gap-2 pt-4`}>
        {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
          <SkeletonBase key={i} className={`flex-1 rounded-t`} style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

/** Table row loading state */
export function SkeletonTableRow({ columns = 4, className = '' }: SkeletonProps & { columns?: number }) {
  return (
    <div className={`flex items-center gap-4 py-3 ${className}`}>
      {Array.from({ length: columns }).map((_, i) => (
        <SkeletonBase key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}

/** Full table loading state */
export function SkeletonTable({ rows = 5, columns = 4, className = '' }: SkeletonProps & { rows?: number; columns?: number }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBase key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            {Array.from({ length: columns }).map((_, j) => (
              <SkeletonBase key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Card with content loading state */
export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <SkeletonAvatar />
        <div className="flex-1">
          <SkeletonBase className="h-4 w-32 mb-2" />
          <SkeletonBase className="h-3 w-24" />
        </div>
      </div>
      <SkeletonBase className="h-4 w-full mb-2" />
      <SkeletonBase className="h-4 w-full mb-2" />
      <SkeletonBase className="h-4 w-3/4" />
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export const Skeleton = {
  Base: SkeletonBase,
  Text: SkeletonText,
  Title: SkeletonTitle,
  Avatar: SkeletonAvatar,
  Image: SkeletonImage,
  Button: SkeletonButton,
  KPI: SkeletonKPI,
  Chart: SkeletonChart,
  Table: SkeletonTable,
  TableRow: SkeletonTableRow,
  Card: SkeletonCard,
};

export default Skeleton;

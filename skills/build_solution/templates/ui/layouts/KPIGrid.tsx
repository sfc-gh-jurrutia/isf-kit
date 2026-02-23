/**
 * KPIGrid - Responsive grid layout for KPI cards
 * 
 * Use cases: Executive dashboards, metric overviews, summary sections
 * Automatically handles responsive columns (1-4 based on screen size)
 */

import React from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface KPIGridProps {
  /** KPI cards to display */
  children: React.ReactNode;
  /** Number of columns (auto-responsive if not specified) */
  columns?: 2 | 3 | 4;
  /** Gap size between cards */
  gap?: 'sm' | 'md' | 'lg';
  /** Custom class name */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function KPIGrid({ 
  children, 
  columns,
  gap = 'md',
  className = '',
}: KPIGridProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  // If columns specified, use fixed grid; otherwise responsive
  const gridClasses = columns 
    ? `grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns}`
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <div className={`grid ${gridClasses} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}

// =============================================================================
// SKELETON VARIANT
// =============================================================================

export interface KPIGridSkeletonProps {
  /** Number of skeleton cards to show */
  count?: number;
  /** Number of columns */
  columns?: 2 | 3 | 4;
}

export function KPIGridSkeleton({ count = 4, columns }: KPIGridSkeletonProps) {
  return (
    <KPIGrid columns={columns}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse"
        >
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </KPIGrid>
  );
}

export default KPIGrid;

/**
 * ChartGrid - Responsive grid layout for charts
 * 
 * Use cases: Analytics dashboards, report pages, multi-chart views
 * Supports various layout patterns for mixing chart sizes
 */

import React from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface ChartGridProps {
  /** Charts to display */
  children: React.ReactNode;
  /** Layout pattern */
  layout?: 'equal' | 'featured' | 'sidebar';
  /** Gap size */
  gap?: 'sm' | 'md' | 'lg';
  /** Custom class name */
  className?: string;
}

export interface ChartGridItemProps {
  /** Chart content */
  children: React.ReactNode;
  /** Span multiple columns (for featured charts) */
  span?: 1 | 2 | 'full';
  /** Custom class name */
  className?: string;
}

// =============================================================================
// GRID ITEM
// =============================================================================

export function ChartGridItem({ 
  children, 
  span = 1, 
  className = '' 
}: ChartGridItemProps) {
  const spanClasses = {
    1: '',
    2: 'lg:col-span-2',
    full: 'col-span-full',
  };

  return (
    <div className={`${spanClasses[span]} ${className}`}>
      {children}
    </div>
  );
}

// =============================================================================
// MAIN GRID
// =============================================================================

export function ChartGrid({ 
  children, 
  layout = 'equal',
  gap = 'md',
  className = '',
}: ChartGridProps) {
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  };

  // Layout patterns
  const layoutClasses = {
    // Equal columns (1 on mobile, 2 on large screens)
    equal: 'grid-cols-1 lg:grid-cols-2',
    // Featured: first item spans 2 columns
    featured: 'grid-cols-1 lg:grid-cols-2',
    // Sidebar: 2/3 + 1/3 split
    sidebar: 'grid-cols-1 lg:grid-cols-3',
  };

  return (
    <div className={`grid ${layoutClasses[layout]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}

// =============================================================================
// PRESET LAYOUTS
// =============================================================================

/**
 * TwoColumnLayout - Simple two equal columns
 */
export function TwoColumnLayout({ 
  left, 
  right,
  gap = 'md',
}: { 
  left: React.ReactNode; 
  right: React.ReactNode;
  gap?: 'sm' | 'md' | 'lg';
}) {
  return (
    <ChartGrid layout="equal" gap={gap}>
      <ChartGridItem>{left}</ChartGridItem>
      <ChartGridItem>{right}</ChartGridItem>
    </ChartGrid>
  );
}

/**
 * FeaturedLayout - Large chart on top, two smaller below
 */
export function FeaturedLayout({ 
  featured, 
  secondary,
  gap = 'md',
}: { 
  featured: React.ReactNode; 
  secondary: React.ReactNode[];
  gap?: 'sm' | 'md' | 'lg';
}) {
  return (
    <ChartGrid layout="featured" gap={gap}>
      <ChartGridItem span={2}>{featured}</ChartGridItem>
      {secondary.map((item, i) => (
        <ChartGridItem key={i}>{item}</ChartGridItem>
      ))}
    </ChartGrid>
  );
}

/**
 * SidebarLayout - Main content (2/3) + sidebar (1/3)
 */
export function SidebarLayout({ 
  main, 
  sidebar,
  gap = 'md',
}: { 
  main: React.ReactNode; 
  sidebar: React.ReactNode;
  gap?: 'sm' | 'md' | 'lg';
}) {
  return (
    <ChartGrid layout="sidebar" gap={gap}>
      <div className="lg:col-span-2">{main}</div>
      <div>{sidebar}</div>
    </ChartGrid>
  );
}

export default ChartGrid;

/**
 * Skeleton - Loading placeholder components
 * 
 * Provides shimmer animation placeholders for content loading states.
 * Enhanced with chart-specific variants for executive dashboards.
 * 
 * Inspired by aura-marketing-guardian skeleton patterns.
 */

import React from 'react';

// =============================================================================
// BASE SKELETON
// =============================================================================

interface SkeletonBaseProps {
  className?: string;
  animate?: boolean;
  style?: React.CSSProperties;
}

function SkeletonBase({ className = '', animate = true, style }: SkeletonBaseProps) {
  return (
    <div
      className={`
        bg-slate-200 rounded
        ${animate ? 'animate-pulse' : ''}
        ${className}
      `}
      style={style}
    />
  );
}

// =============================================================================
// BASIC SKELETON VARIANTS
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

/** Badge/tag placeholder */
export function SkeletonBadge({ className = '' }: SkeletonProps) {
  return <SkeletonBase className={`h-5 w-20 rounded-full ${className}`} />;
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
// CHART-SPECIFIC SKELETONS (Executive Dashboard Grade)
// =============================================================================

/** Bar chart skeleton with staggered animation */
export function SkeletonBarChart({ 
  bars = 6, 
  className = '' 
}: SkeletonProps & { bars?: number }) {
  return (
    <div className={`flex items-end gap-3 h-48 ${className}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <div 
          key={i} 
          className="flex-1 bg-slate-200 rounded-t animate-pulse"
          style={{ 
            height: `${Math.random() * 60 + 40}%`,
            animationDelay: `${i * 100}ms`
          }}
        />
      ))}
    </div>
  );
}

/** Line chart skeleton with SVG path */
export function SkeletonLineChart({ className = '' }: SkeletonProps) {
  return (
    <div className={`relative h-48 ${className}`}>
      {/* Grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border-b border-slate-200" />
        ))}
      </div>
      {/* Line path placeholder */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <path
          d="M 0 80 Q 50 60, 100 70 T 200 50 T 300 65 T 400 40"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="3"
          className="animate-pulse"
        />
      </svg>
    </div>
  );
}

/** Sankey diagram skeleton - Light theme */
export function SkeletonSankey({ 
  className = '',
  heroMode = false 
}: SkeletonProps & { heroMode?: boolean }) {
  return (
    <div className={`relative ${heroMode ? 'h-[350px]' : 'h-[280px]'} ${className}`}>
      {/* Left nodes */}
      <div className="absolute left-4 top-0 bottom-0 flex flex-col justify-around w-24">
        {[...Array(3)].map((_, i) => (
          <div 
            key={`left-${i}`} 
            className="h-12 bg-slate-200 rounded-lg animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      
      {/* Center connections (pseudo-links) */}
      <div className="absolute left-32 right-32 top-8 bottom-8">
        <svg className="w-full h-full" preserveAspectRatio="none">
          {[...Array(5)].map((_, i) => (
            <path
              key={i}
              d={`M 0 ${20 + i * 40} C 100 ${20 + i * 40}, 150 ${30 + i * 35}, 250 ${25 + i * 38}`}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="8"
              strokeOpacity="0.5"
              className="animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </svg>
      </div>
      
      {/* Right nodes */}
      <div className="absolute right-4 top-0 bottom-0 flex flex-col justify-around w-24">
        {[...Array(4)].map((_, i) => (
          <div 
            key={`right-${i}`} 
            className="h-10 bg-slate-200 rounded-lg animate-pulse"
            style={{ animationDelay: `${i * 150 + 100}ms` }}
          />
        ))}
      </div>
      
      {/* Loading indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
          <span className="text-sm text-slate-500">Loading journey data...</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// COMPOSITE SKELETONS
// =============================================================================

/** KPI card loading state */
export function SkeletonKPI({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-white rounded-lg border border-slate-200 p-4 shadow-sm ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <SkeletonBase className="w-8 h-8 rounded-lg" />
        <SkeletonBase className="h-3 w-24" />
      </div>
      <SkeletonBase className="h-8 w-20 mb-1" />
      <SkeletonBase className="h-3 w-16" />
    </div>
  );
}

/** Generic chart loading state */
export function SkeletonChart({ className = '', height = 'h-64' }: SkeletonProps & { height?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-slate-200 p-4 shadow-sm ${className}`}>
      <SkeletonBase className="h-5 w-40 mb-4" />
      <div className={`${height} flex items-end justify-between gap-2 pt-4`}>
        {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
          <SkeletonBase 
            key={i} 
            className="flex-1 rounded-t" 
            style={{ height: `${h}%`, animationDelay: `${i * 50}ms` }} 
          />
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
    <div className={`bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 bg-slate-50 border-b border-slate-200">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBase key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-slate-200">
        {Array.from({ length: rows }).map((_, i) => (
          <div 
            key={i} 
            className="flex items-center gap-4 px-4 py-3"
            style={{ animationDelay: `${i * 50}ms` }}
          >
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
    <div className={`bg-white rounded-lg border border-slate-200 p-4 shadow-sm ${className}`}>
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
// DASHBOARD SKELETON (Full Page)
// =============================================================================

/** Full executive dashboard loading state */
export function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SkeletonBase className="w-10 h-10 rounded-xl" />
          <div className="space-y-2">
            <SkeletonTitle />
            <SkeletonBase className="h-3 w-48" />
          </div>
        </div>
        <div className="flex gap-2">
          <SkeletonBadge />
          <SkeletonBadge />
        </div>
      </div>
      
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonKPI key={i} />
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <SkeletonTitle className="mb-4" />
          <SkeletonBarChart bars={6} />
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <SkeletonTitle className="mb-4" />
          <SkeletonLineChart />
        </div>
      </div>
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
  Badge: SkeletonBadge,
  Avatar: SkeletonAvatar,
  Image: SkeletonImage,
  Button: SkeletonButton,
  // Chart-specific
  BarChart: SkeletonBarChart,
  LineChart: SkeletonLineChart,
  Sankey: SkeletonSankey,
  // Composites
  KPI: SkeletonKPI,
  Chart: SkeletonChart,
  Table: SkeletonTable,
  TableRow: SkeletonTableRow,
  Card: SkeletonCard,
  Dashboard: SkeletonDashboard,
};

export default Skeleton;

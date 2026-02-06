/**
 * Chart Configuration - Shared config for all chart types
 * 
 * Provides consistent styling, dark mode support, and common utilities
 * for Recharts-based visualizations.
 */

import { colors, chartDefaults } from './design-tokens';

// =============================================================================
// TYPES
// =============================================================================

export type ChartSize = 'sm' | 'md' | 'lg';

export interface ChartTheme {
  isDark: boolean;
  colors: {
    grid: string;
    axis: string;
    tooltip: {
      background: string;
      border: string;
      text: string;
    };
  };
}

// =============================================================================
// THEME HELPERS
// =============================================================================

/**
 * Get chart theme colors based on dark/light mode
 */
export function getChartTheme(isDark: boolean): ChartTheme {
  return {
    isDark,
    colors: {
      grid: isDark ? colors.gray[700] : colors.gray[200],
      axis: isDark ? colors.gray[400] : colors.gray[500],
      tooltip: {
        background: isDark ? colors.gray[800] : '#ffffff',
        border: isDark ? colors.gray[700] : colors.gray[200],
        text: isDark ? colors.gray[100] : colors.gray[900],
      },
    },
  };
}

/**
 * Get chart height in pixels based on size
 */
export function getChartHeight(size: ChartSize): number {
  return chartDefaults.height[size];
}

// =============================================================================
// STANDARD CHART PALETTE
// =============================================================================

/**
 * Get color from chart palette by index (cycles through)
 */
export function getChartColor(index: number): string {
  return colors.chart[index % colors.chart.length];
}

/**
 * Get full chart color palette
 */
export function getChartPalette(): string[] {
  return [...colors.chart];
}

// =============================================================================
// RECHARTS PROP HELPERS
// =============================================================================

/**
 * Standard XAxis props
 */
export function getXAxisProps(theme: ChartTheme) {
  return {
    tick: { fontSize: 12, fill: theme.colors.axis },
    tickLine: false,
    axisLine: false,
  };
}

/**
 * Standard YAxis props
 */
export function getYAxisProps(theme: ChartTheme) {
  return {
    tick: { fontSize: 12, fill: theme.colors.axis },
    tickLine: false,
    axisLine: false,
  };
}

/**
 * Standard CartesianGrid props
 */
export function getGridProps(theme: ChartTheme) {
  return {
    strokeDasharray: '3 3',
    stroke: theme.colors.grid,
  };
}

/**
 * Standard Tooltip contentStyle
 */
export function getTooltipStyle(theme: ChartTheme) {
  return {
    backgroundColor: theme.colors.tooltip.background,
    border: `1px solid ${theme.colors.tooltip.border}`,
    borderRadius: '0.5rem',
    color: theme.colors.tooltip.text,
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  };
}

// =============================================================================
// CHART WRAPPER STYLES (Tailwind classes)
// =============================================================================

export const chartWrapperClasses = {
  container: 'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm',
  title: 'text-lg font-semibold text-gray-900 dark:text-white mb-4',
  subtitle: 'text-sm text-gray-500 dark:text-gray-400 mb-4',
  chartArea: {
    sm: 'h-48',
    md: 'h-64',
    lg: 'h-80',
  },
};

// =============================================================================
// STANDARD CHART DATA SHAPES
// =============================================================================

/**
 * Time series data point (for LineChart, AreaChart)
 */
export interface TimeSeriesPoint {
  date: string;
  value: number;
  [key: string]: string | number; // Allow additional series
}

/**
 * Category data point (for BarChart, PieChart)
 */
export interface CategoryPoint {
  name: string;
  value: number;
  color?: string;
}

/**
 * Ranking data point (for HorizontalBarChart)
 */
export interface RankingPoint {
  name: string;
  value: number;
  secondaryValue?: number;
}

/**
 * KPI data
 */
export interface KPIData {
  value: number;
  label: string;
  change?: number;        // Percent change
  changeLabel?: string;   // e.g., "vs last month"
  format?: 'currency' | 'number' | 'percent';
}

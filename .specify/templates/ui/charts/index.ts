/**
 * Standard Chart Components
 * 
 * A collection of 6 standardized chart types built on Recharts with:
 * - Consistent API and styling
 * - Built-in dark mode support
 * - Standard color palette
 * - Responsive containers
 * 
 * Usage:
 * ```tsx
 * import { LineChart, BarChart, KPICard } from './charts';
 * 
 * <LineChart 
 *   data={timeSeriesData}
 *   title="Revenue Trend"
 *   isDark={isDark}
 * />
 * ```
 */

// Chart components
export { LineChart } from './LineChart';
export { BarChart } from './BarChart';
export { HorizontalBarChart } from './HorizontalBarChart';
export { PieChart } from './PieChart';
export { AreaChart } from './AreaChart';
export { KPICard } from './KPICard';

// Types
export type { LineChartProps } from './LineChart';
export type { BarChartProps } from './BarChart';
export type { HorizontalBarChartProps } from './HorizontalBarChart';
export type { PieChartProps } from './PieChart';
export type { AreaChartProps } from './AreaChart';
export type { KPICardProps } from './KPICard';

// Re-export chart config utilities
export {
  getChartTheme,
  getChartHeight,
  getChartColor,
  getChartPalette,
  chartWrapperClasses,
} from '../chart-config';

// Re-export data types
export type {
  ChartSize,
  ChartTheme,
  TimeSeriesPoint,
  CategoryPoint,
  RankingPoint,
  KPIData,
} from '../chart-config';

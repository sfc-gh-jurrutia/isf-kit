/**
 * Standard Chart Components
 * 
 * A collection of chart types built on Recharts/D3 with:
 * - Consistent API and styling
 * - Built-in dark mode support
 * - Standard color palette
 * - Responsive containers
 * - Executive dashboard grade visualizations
 * 
 * Usage:
 * ```tsx
 * import { LineChart, BarChart, KPICard, SankeyChart, NetworkGraph } from './charts';
 * 
 * <LineChart 
 *   data={timeSeriesData}
 *   title="Revenue Trend"
 *   isDark={isDark}
 * />
 * 
 * <SankeyChart
 *   nodes={journeyNodes}
 *   links={journeyLinks}
 *   title="Customer Journey Flow"
 *   crisisMode={isAlert}
 * />
 * ```
 */

// Basic chart components
export { LineChart } from './LineChart';
export { BarChart } from './BarChart';
export { HorizontalBarChart } from './HorizontalBarChart';
export { PieChart } from './PieChart';
export { AreaChart } from './AreaChart';
export { KPICard } from './KPICard';

// Advanced visualization components
export { SankeyChart } from './SankeyChart';
export { NetworkGraph } from './NetworkGraph';

// Basic chart types
export type { LineChartProps } from './LineChart';
export type { BarChartProps } from './BarChart';
export type { HorizontalBarChartProps } from './HorizontalBarChart';
export type { PieChartProps } from './PieChart';
export type { AreaChartProps } from './AreaChart';
export type { KPICardProps } from './KPICard';

// Advanced visualization types
export type { 
  SankeyChartProps, 
  SankeyNode, 
  SankeyLink, 
  SankeyNodeType 
} from './SankeyChart';
export type { 
  NetworkGraphProps, 
  NetworkNode, 
  NetworkEdge, 
  NetworkNodeCategory 
} from './NetworkGraph';

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

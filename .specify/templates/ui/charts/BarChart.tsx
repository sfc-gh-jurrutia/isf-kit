/**
 * BarChart - Standard vertical bar chart for category comparisons
 * 
 * Use cases: Monthly sales, product comparisons, regional performance
 * Data shape: { name: string, value: number }[]
 */

import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import {
  ChartSize,
  CategoryPoint,
  getChartTheme,
  getChartHeight,
  getChartColor,
  getXAxisProps,
  getYAxisProps,
  getGridProps,
  getTooltipStyle,
  chartWrapperClasses,
} from '../chart-config';

// =============================================================================
// PROPS
// =============================================================================

export interface BarChartProps {
  /** Chart data - array of category points */
  data: CategoryPoint[];
  /** Data key for bar values (defaults to 'value') */
  dataKey?: string;
  /** X-axis data key (defaults to 'name') */
  xKey?: string;
  /** Chart title */
  title?: string;
  /** Chart subtitle */
  subtitle?: string;
  /** Chart size */
  size?: ChartSize;
  /** Dark mode enabled */
  isDark?: boolean;
  /** Show grid lines */
  showGrid?: boolean;
  /** Show legend */
  showLegend?: boolean;
  /** Y-axis tick formatter */
  formatYAxis?: (value: number) => string;
  /** Tooltip value formatter */
  formatTooltip?: (value: number) => string;
  /** Single color for all bars */
  color?: string;
  /** Use individual colors per bar (from data.color or palette) */
  colorByCategory?: boolean;
  /** Custom class name for container */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function BarChart({
  data,
  dataKey = 'value',
  xKey = 'name',
  title,
  subtitle,
  size = 'md',
  isDark = false,
  showGrid = true,
  showLegend = false,
  formatYAxis,
  formatTooltip,
  color,
  colorByCategory = false,
  className = '',
}: BarChartProps) {
  const theme = getChartTheme(isDark);
  const height = getChartHeight(size);
  const defaultColor = color ?? getChartColor(0);

  return (
    <div className={`${chartWrapperClasses.container} ${className}`}>
      {title && <h3 className={chartWrapperClasses.title}>{title}</h3>}
      {subtitle && <p className={chartWrapperClasses.subtitle}>{subtitle}</p>}
      
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            {showGrid && <CartesianGrid {...getGridProps(theme)} vertical={false} />}
            
            <XAxis 
              dataKey={xKey} 
              {...getXAxisProps(theme)}
            />
            
            <YAxis 
              {...getYAxisProps(theme)}
              tickFormatter={formatYAxis}
            />
            
            <Tooltip
              contentStyle={getTooltipStyle(theme)}
              formatter={formatTooltip ? (value: number) => [formatTooltip(value)] : undefined}
              cursor={{ fill: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
            />
            
            {showLegend && <Legend />}
            
            <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
              {colorByCategory
                ? data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color ?? getChartColor(index)} />
                  ))
                : data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={defaultColor} />
                  ))
              }
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default BarChart;

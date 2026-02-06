/**
 * LineChart - Standard line chart for time series / trend data
 * 
 * Use cases: Revenue over time, daily active users, metric trends
 * Data shape: { date: string, value: number, [series]?: number }[]
 */

import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  ChartSize,
  TimeSeriesPoint,
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

export interface LineChartProps {
  /** Chart data - array of time series points */
  data: TimeSeriesPoint[];
  /** Data keys to render as lines (defaults to ['value']) */
  dataKeys?: string[];
  /** X-axis data key (defaults to 'date') */
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
  /** Custom colors for lines */
  colors?: string[];
  /** Custom class name for container */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function LineChart({
  data,
  dataKeys = ['value'],
  xKey = 'date',
  title,
  subtitle,
  size = 'md',
  isDark = false,
  showGrid = true,
  showLegend = false,
  formatYAxis,
  formatTooltip,
  colors,
  className = '',
}: LineChartProps) {
  const theme = getChartTheme(isDark);
  const height = getChartHeight(size);

  return (
    <div className={`${chartWrapperClasses.container} ${className}`}>
      {title && <h3 className={chartWrapperClasses.title}>{title}</h3>}
      {subtitle && <p className={chartWrapperClasses.subtitle}>{subtitle}</p>}
      
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            {showGrid && <CartesianGrid {...getGridProps(theme)} />}
            
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
            />
            
            {showLegend && <Legend />}
            
            {dataKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors?.[index] ?? getChartColor(index)}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default LineChart;

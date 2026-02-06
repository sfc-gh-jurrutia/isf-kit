/**
 * AreaChart - Standard area chart for cumulative/volume trends
 * 
 * Use cases: Revenue accumulation, traffic volume, stacked comparisons
 * Data shape: { date: string, value: number, [series]?: number }[]
 */

import React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
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

export interface AreaChartProps {
  /** Chart data - array of time series points */
  data: TimeSeriesPoint[];
  /** Data keys to render as areas (defaults to ['value']) */
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
  /** Stack areas on top of each other */
  stacked?: boolean;
  /** Y-axis tick formatter */
  formatYAxis?: (value: number) => string;
  /** Tooltip value formatter */
  formatTooltip?: (value: number) => string;
  /** Custom colors for areas */
  colors?: string[];
  /** Fill opacity (0-1) */
  fillOpacity?: number;
  /** Custom class name for container */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function AreaChart({
  data,
  dataKeys = ['value'],
  xKey = 'date',
  title,
  subtitle,
  size = 'md',
  isDark = false,
  showGrid = true,
  showLegend = false,
  stacked = false,
  formatYAxis,
  formatTooltip,
  colors,
  fillOpacity = 0.3,
  className = '',
}: AreaChartProps) {
  const theme = getChartTheme(isDark);
  const height = getChartHeight(size);

  return (
    <div className={`${chartWrapperClasses.container} ${className}`}>
      {title && <h3 className={chartWrapperClasses.title}>{title}</h3>}
      {subtitle && <p className={chartWrapperClasses.subtitle}>{subtitle}</p>}
      
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsAreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <defs>
              {dataKeys.map((key, index) => {
                const color = colors?.[index] ?? getChartColor(index);
                return (
                  <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                );
              })}
            </defs>
            
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
            
            {dataKeys.map((key, index) => {
              const color = colors?.[index] ?? getChartColor(index);
              return (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stackId={stacked ? 'stack' : undefined}
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#gradient-${key})`}
                  fillOpacity={fillOpacity}
                />
              );
            })}
          </RechartsAreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AreaChart;

/**
 * HorizontalBarChart - Standard horizontal bar chart for rankings/Top N
 * 
 * Use cases: Top products, best performers, leaderboards
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
  Cell,
} from 'recharts';
import {
  ChartSize,
  RankingPoint,
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

export interface HorizontalBarChartProps {
  /** Chart data - array of ranking points */
  data: RankingPoint[];
  /** Data key for bar values (defaults to 'value') */
  dataKey?: string;
  /** Y-axis data key (defaults to 'name') */
  yKey?: string;
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
  /** X-axis tick formatter */
  formatXAxis?: (value: number) => string;
  /** Tooltip value formatter */
  formatTooltip?: (value: number) => string;
  /** Single color for all bars */
  color?: string;
  /** Use gradient colors (first to last) */
  useGradient?: boolean;
  /** Custom class name for container */
  className?: string;
  /** Maximum label width in pixels */
  labelWidth?: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function HorizontalBarChart({
  data,
  dataKey = 'value',
  yKey = 'name',
  title,
  subtitle,
  size = 'md',
  isDark = false,
  showGrid = true,
  formatXAxis,
  formatTooltip,
  color,
  useGradient = false,
  className = '',
  labelWidth = 100,
}: HorizontalBarChartProps) {
  const theme = getChartTheme(isDark);
  const height = getChartHeight(size);
  const defaultColor = color ?? getChartColor(0);

  // Calculate gradient colors (full saturation to lighter)
  const getGradientColor = (index: number, total: number) => {
    const baseColor = color ?? getChartColor(0);
    const opacity = 1 - (index / total) * 0.5;
    return baseColor + Math.round(opacity * 255).toString(16).padStart(2, '0').slice(0, 2);
  };

  return (
    <div className={`${chartWrapperClasses.container} ${className}`}>
      {title && <h3 className={chartWrapperClasses.title}>{title}</h3>}
      {subtitle && <p className={chartWrapperClasses.subtitle}>{subtitle}</p>}
      
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 20, bottom: 5, left: labelWidth }}
          >
            {showGrid && <CartesianGrid {...getGridProps(theme)} horizontal={false} />}
            
            <XAxis 
              type="number"
              {...getXAxisProps(theme)}
              tickFormatter={formatXAxis}
            />
            
            <YAxis 
              type="category"
              dataKey={yKey}
              {...getYAxisProps(theme)}
              width={labelWidth - 10}
              tickLine={false}
            />
            
            <Tooltip
              contentStyle={getTooltipStyle(theme)}
              formatter={formatTooltip ? (value: number) => [formatTooltip(value)] : undefined}
              cursor={{ fill: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
            />
            
            <Bar dataKey={dataKey} radius={[0, 4, 4, 0]}>
              {data.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={useGradient ? getGradientColor(index, data.length) : defaultColor} 
                />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default HorizontalBarChart;

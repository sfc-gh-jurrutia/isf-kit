/**
 * PieChart - Standard pie/donut chart for part-to-whole relationships
 * 
 * Use cases: Market share, category breakdown, distribution
 * Data shape: { name: string, value: number }[]
 */

import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  ChartSize,
  CategoryPoint,
  getChartTheme,
  getChartHeight,
  getChartColor,
  getChartPalette,
  getTooltipStyle,
  chartWrapperClasses,
} from '../chart-config';

// =============================================================================
// PROPS
// =============================================================================

export interface PieChartProps {
  /** Chart data - array of category points */
  data: CategoryPoint[];
  /** Data key for values (defaults to 'value') */
  dataKey?: string;
  /** Name key for labels (defaults to 'name') */
  nameKey?: string;
  /** Chart title */
  title?: string;
  /** Chart subtitle */
  subtitle?: string;
  /** Chart size */
  size?: ChartSize;
  /** Dark mode enabled */
  isDark?: boolean;
  /** Show legend */
  showLegend?: boolean;
  /** Show labels on slices */
  showLabels?: boolean;
  /** Render as donut chart (with inner radius) */
  donut?: boolean;
  /** Tooltip value formatter */
  formatTooltip?: (value: number) => string;
  /** Custom colors (uses palette by default) */
  colors?: string[];
  /** Custom class name for container */
  className?: string;
}

// =============================================================================
// CUSTOM LABEL
// =============================================================================

interface LabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
}

const RADIAN = Math.PI / 180;

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: LabelProps) {
  if (percent < 0.05) return null; // Don't show labels for tiny slices
  
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={500}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PieChart({
  data,
  dataKey = 'value',
  nameKey = 'name',
  title,
  subtitle,
  size = 'md',
  isDark = false,
  showLegend = true,
  showLabels = true,
  donut = false,
  formatTooltip,
  colors,
  className = '',
}: PieChartProps) {
  const theme = getChartTheme(isDark);
  const height = getChartHeight(size);
  const palette = colors ?? getChartPalette();

  // Calculate radius based on size
  const outerRadius = size === 'sm' ? 60 : size === 'md' ? 80 : 100;
  const innerRadius = donut ? outerRadius * 0.6 : 0;

  return (
    <div className={`${chartWrapperClasses.container} ${className}`}>
      {title && <h3 className={chartWrapperClasses.title}>{title}</h3>}
      {subtitle && <p className={chartWrapperClasses.subtitle}>{subtitle}</p>}
      
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={showLabels ? renderCustomLabel : undefined}
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              dataKey={dataKey}
              nameKey={nameKey}
              paddingAngle={donut ? 2 : 0}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color ?? palette[index % palette.length]} 
                />
              ))}
            </Pie>
            
            <Tooltip
              contentStyle={getTooltipStyle(theme)}
              formatter={formatTooltip ? (value: number) => [formatTooltip(value)] : undefined}
            />
            
            {showLegend && (
              <Legend
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ paddingTop: 16 }}
                formatter={(value) => (
                  <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{value}</span>
                )}
              />
            )}
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default PieChart;

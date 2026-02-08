/**
 * KPICard - Key Performance Indicator display card
 * 
 * Use cases: Total revenue, user count, conversion rate, any single metric
 * Data shape: { value: number, label: string, change?: number }
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { KPIData, chartWrapperClasses } from '../chart-config';
import { formatCurrency, formatNumber, formatPercent } from '../formatters';

// =============================================================================
// PROPS
// =============================================================================

export interface KPICardProps extends KPIData {
  /** Dark mode enabled */
  isDark?: boolean;
  /** Icon to display (optional) */
  icon?: React.ReactNode;
  /** Custom class name for container */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

// =============================================================================
// HELPERS
// =============================================================================

function formatValue(value: number, format?: 'currency' | 'number' | 'percent'): string {
  switch (format) {
    case 'currency':
      return formatCurrency(value, { compact: value >= 10000 });
    case 'percent':
      return formatPercent(value / 100);
    case 'number':
    default:
      return formatNumber(value, { compact: value >= 10000 });
  }
}

function getTrendIcon(change?: number) {
  if (change === undefined || change === 0) {
    return <Minus className="w-4 h-4" />;
  }
  return change > 0 
    ? <TrendingUp className="w-4 h-4" />
    : <TrendingDown className="w-4 h-4" />;
}

function getTrendColor(change?: number, isDark?: boolean) {
  if (change === undefined || change === 0) {
    return isDark ? 'text-gray-400' : 'text-gray-500';
  }
  return change > 0 ? 'text-green-500' : 'text-red-500';
}

// =============================================================================
// COMPONENT
// =============================================================================

export function KPICard({
  value,
  label,
  change,
  changeLabel,
  format,
  isDark = false,
  icon,
  className = '',
  size = 'md',
}: KPICardProps) {
  const sizeClasses = {
    sm: {
      container: 'p-3',
      value: 'text-xl',
      label: 'text-xs',
      change: 'text-xs',
    },
    md: {
      container: 'p-4',
      value: 'text-2xl',
      label: 'text-sm',
      change: 'text-sm',
    },
    lg: {
      container: 'p-6',
      value: 'text-4xl',
      label: 'text-base',
      change: 'text-base',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div 
      className={`
        bg-white dark:bg-gray-800 
        rounded-lg border border-gray-200 dark:border-gray-700 
        shadow-sm ${sizes.container} ${className}
      `}
    >
      {/* Header with icon and label */}
      <div className="flex items-center justify-between mb-2">
        <span className={`${sizes.label} text-gray-500 dark:text-gray-400 font-medium`}>
          {label}
        </span>
        {icon && (
          <span className="text-gray-400 dark:text-gray-500">
            {icon}
          </span>
        )}
      </div>

      {/* Main value */}
      <div className={`${sizes.value} font-bold text-gray-900 dark:text-white mb-1`}>
        {formatValue(value, format)}
      </div>

      {/* Change indicator */}
      {change !== undefined && (
        <div className={`flex items-center gap-1 ${sizes.change} ${getTrendColor(change, isDark)}`}>
          {getTrendIcon(change)}
          <span className="font-medium">
            {change > 0 ? '+' : ''}{formatPercent(Math.abs(change) / 100)}
          </span>
          {changeLabel && (
            <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
              {changeLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default KPICard;

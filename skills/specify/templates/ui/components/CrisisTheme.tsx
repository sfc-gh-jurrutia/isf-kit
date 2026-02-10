/**
 * CrisisTheme - Threshold-based alert styling component
 * 
 * Dynamically applies crisis/warning/healthy styling to dashboard elements
 * based on metric thresholds. Perfect for KPI cards that need to signal
 * status visually to executives.
 * 
 * Inspired by aura-marketing-guardian's crisis mode theming.
 * 
 * Usage:
 * ```tsx
 * <CrisisTheme value={sentimentScore} warningThreshold={0.3} crisisThreshold={0.15} invert>
 *   <KPICard title="Sentiment Score" value={sentimentScore} />
 * </CrisisTheme>
 * ```
 */

import React, { useMemo } from 'react';
import { getCrisisTheme, crisisColors } from '../design-tokens';

// =============================================================================
// TYPES
// =============================================================================

export type CrisisLevel = 'healthy' | 'warning' | 'crisis';

export interface CrisisThemeProps {
  /** Current metric value */
  value: number;
  /** Threshold to trigger warning state */
  warningThreshold: number;
  /** Threshold to trigger crisis state */
  crisisThreshold: number;
  /** If true, lower values trigger alerts (e.g., conversion rate dropping) */
  invert?: boolean;
  /** Children to wrap with crisis styling */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Visual style variant */
  variant?: 'subtle' | 'bordered' | 'glow';
  /** Show pulse animation in crisis mode */
  pulseOnCrisis?: boolean;
  /** Custom render function for full control */
  render?: (props: {
    level: CrisisLevel;
    colors: typeof crisisColors.healthy;
    isWarning: boolean;
    isCrisis: boolean;
  }) => React.ReactNode;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate crisis level from value and thresholds
 */
export function getCrisisLevel(
  value: number,
  warningThreshold: number,
  crisisThreshold: number,
  invert = false
): CrisisLevel {
  if (invert) {
    if (value <= crisisThreshold) return 'crisis';
    if (value <= warningThreshold) return 'warning';
    return 'healthy';
  } else {
    if (value >= crisisThreshold) return 'crisis';
    if (value >= warningThreshold) return 'warning';
    return 'healthy';
  }
}

/**
 * Get CSS class names for crisis level
 */
export function getCrisisClasses(
  level: CrisisLevel,
  variant: 'subtle' | 'bordered' | 'glow' = 'subtle'
): string {
  const baseClasses = 'transition-all duration-300';
  
  const levelStyles = {
    healthy: {
      subtle: 'bg-emerald-50/50',
      bordered: 'bg-emerald-50/50 border-2 border-emerald-300',
      glow: 'bg-emerald-50/50 border-2 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]',
    },
    warning: {
      subtle: 'bg-amber-50/50',
      bordered: 'bg-amber-50/50 border-2 border-amber-300',
      glow: 'bg-amber-50/50 border-2 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]',
    },
    crisis: {
      subtle: 'bg-rose-50/50',
      bordered: 'bg-rose-50/50 border-2 border-rose-300',
      glow: 'bg-rose-50/50 border-2 border-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.3)]',
    },
  };
  
  return `${baseClasses} ${levelStyles[level][variant]}`;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CrisisTheme({
  value,
  warningThreshold,
  crisisThreshold,
  invert = false,
  children,
  className = '',
  variant = 'subtle',
  pulseOnCrisis = true,
  render,
}: CrisisThemeProps) {
  const crisisState = useMemo(() => {
    const level = getCrisisLevel(value, warningThreshold, crisisThreshold, invert);
    const colors = getCrisisTheme(value, warningThreshold, crisisThreshold, invert);
    return {
      level,
      colors,
      isWarning: level === 'warning',
      isCrisis: level === 'crisis',
    };
  }, [value, warningThreshold, crisisThreshold, invert]);

  // Custom render function takes full control
  if (render) {
    return <>{render(crisisState)}</>;
  }

  const crisisClasses = getCrisisClasses(crisisState.level, variant);
  const pulseClass = pulseOnCrisis && crisisState.isCrisis ? 'animate-pulse' : '';

  return (
    <div className={`${crisisClasses} ${pulseClass} ${className}`}>
      {children}
    </div>
  );
}

// =============================================================================
// CRISIS INDICATOR - Standalone visual indicator
// =============================================================================

export interface CrisisIndicatorProps {
  level: CrisisLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CrisisIndicator({
  level,
  showLabel = false,
  size = 'md',
  className = '',
}: CrisisIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const colorClasses = {
    healthy: 'bg-emerald-500',
    warning: 'bg-amber-500',
    crisis: 'bg-rose-500',
  };

  const labels = {
    healthy: 'Healthy',
    warning: 'Warning',
    crisis: 'Critical',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className={`
          ${sizeClasses[size]} 
          ${colorClasses[level]} 
          rounded-full
          ${level === 'crisis' ? 'animate-ping' : ''}
        `}
      />
      {level === 'crisis' && (
        <span className={`${sizeClasses[size]} ${colorClasses[level]} rounded-full absolute`} />
      )}
      {showLabel && (
        <span className={`text-sm font-medium ${
          level === 'healthy' ? 'text-emerald-700' :
          level === 'warning' ? 'text-amber-700' :
          'text-rose-700'
        }`}>
          {labels[level]}
        </span>
      )}
    </div>
  );
}

// =============================================================================
// CRISIS KPI CARD - Pre-styled KPI with crisis theming
// =============================================================================

export interface CrisisKPIProps {
  title: string;
  value: number | string;
  formattedValue?: string;
  subtitle?: string;
  warningThreshold: number;
  crisisThreshold: number;
  invert?: boolean;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function CrisisKPI({
  title,
  value,
  formattedValue,
  subtitle,
  warningThreshold,
  crisisThreshold,
  invert = false,
  icon,
  trend,
  className = '',
}: CrisisKPIProps) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value);
  const level = getCrisisLevel(numericValue, warningThreshold, crisisThreshold, invert);
  
  const colorStyles = {
    healthy: {
      bg: 'bg-white',
      border: 'border-emerald-200',
      accent: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
    },
    warning: {
      bg: 'bg-amber-50/30',
      border: 'border-amber-300',
      accent: 'text-amber-600',
      iconBg: 'bg-amber-100',
    },
    crisis: {
      bg: 'bg-rose-50/30',
      border: 'border-rose-300',
      accent: 'text-rose-600',
      iconBg: 'bg-rose-100',
    },
  };

  const styles = colorStyles[level];

  return (
    <div 
      className={`
        ${styles.bg} 
        ${styles.border}
        border rounded-xl p-4 shadow-sm
        transition-all duration-300
        ${level === 'crisis' ? 'shadow-[0_0_15px_rgba(244,63,94,0.15)]' : ''}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && (
            <div className={`p-2 rounded-lg ${styles.iconBg}`}>
              {icon}
            </div>
          )}
          <span className="text-sm font-medium text-slate-600">{title}</span>
        </div>
        <CrisisIndicator level={level} size="sm" />
      </div>
      
      {/* Value */}
      <div className={`text-2xl font-bold ${styles.accent} mb-1`}>
        {formattedValue ?? value}
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between">
        {subtitle && (
          <span className="text-xs text-slate-500">{subtitle}</span>
        )}
        {trend && (
          <span className={`text-xs font-medium flex items-center gap-1 ${
            trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// CRISIS ALERT BANNER - Full-width alert for dashboard headers
// =============================================================================

export interface CrisisAlertBannerProps {
  level: CrisisLevel;
  title: string;
  message?: string;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function CrisisAlertBanner({
  level,
  title,
  message,
  onDismiss,
  action,
  className = '',
}: CrisisAlertBannerProps) {
  if (level === 'healthy') return null;

  const styles = {
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      icon: '⚠️',
      titleColor: 'text-amber-800',
      textColor: 'text-amber-700',
    },
    crisis: {
      bg: 'bg-rose-50',
      border: 'border-rose-300',
      icon: '🚨',
      titleColor: 'text-rose-800',
      textColor: 'text-rose-700',
    },
    healthy: {
      bg: '',
      border: '',
      icon: '',
      titleColor: '',
      textColor: '',
    },
  };

  const s = styles[level];

  return (
    <div
      className={`
        ${s.bg} ${s.border} border rounded-lg p-4
        flex items-center justify-between
        ${level === 'crisis' ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{s.icon}</span>
        <div>
          <p className={`font-semibold ${s.titleColor}`}>{title}</p>
          {message && <p className={`text-sm ${s.textColor}`}>{message}</p>}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {action && (
          <button
            onClick={action.onClick}
            className={`
              px-3 py-1.5 rounded-md text-sm font-medium
              ${level === 'crisis' ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-amber-600 text-white hover:bg-amber-700'}
            `}
          >
            {action.label}
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`p-1 rounded hover:bg-black/5 ${s.textColor}`}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default CrisisTheme;

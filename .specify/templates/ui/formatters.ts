/**
 * Formatting Utilities - Standardized data formatters
 * 
 * Usage: Import these utilities for consistent number, currency, date, and text formatting.
 */

// =============================================================================
// CURRENCY FORMATTING
// =============================================================================

export interface CurrencyOptions {
  currency?: string;
  locale?: string;
  compact?: boolean;        // Use K/M/B notation
  decimals?: number;
}

/**
 * Format a number as currency
 * @example formatCurrency(1234.56) // "$1,235"
 * @example formatCurrency(1234567, { compact: true }) // "$1.2M"
 */
export function formatCurrency(
  value: number | null | undefined,
  options: CurrencyOptions = {}
): string {
  if (value == null || isNaN(value)) return '—';

  const {
    currency = 'USD',
    locale = 'en-US',
    compact = false,
    decimals,
  } = options;

  if (compact && Math.abs(value) >= 1000) {
    return formatCompactNumber(value, { locale, prefix: '$' });
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals ?? 0,
    maximumFractionDigits: decimals ?? 0,
  }).format(value);
}

// =============================================================================
// NUMBER FORMATTING
// =============================================================================

export interface NumberOptions {
  locale?: string;
  compact?: boolean;        // Use K/M/B notation
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

/**
 * Format a number with locale-aware separators
 * @example formatNumber(1234567) // "1,234,567"
 * @example formatNumber(1234567, { compact: true }) // "1.2M"
 */
export function formatNumber(
  value: number | null | undefined,
  options: NumberOptions = {}
): string {
  if (value == null || isNaN(value)) return '—';

  const {
    locale = 'en-US',
    compact = false,
    decimals,
    prefix = '',
    suffix = '',
  } = options;

  if (compact && Math.abs(value) >= 1000) {
    return prefix + formatCompactNumber(value, { locale }) + suffix;
  }

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals ?? 0,
    maximumFractionDigits: decimals ?? 0,
  }).format(value);

  return prefix + formatted + suffix;
}

/**
 * Format number with K/M/B suffix
 */
function formatCompactNumber(
  value: number,
  options: { locale?: string; prefix?: string } = {}
): string {
  const { locale = 'en-US', prefix = '' } = options;
  const absValue = Math.abs(value);

  let divisor = 1;
  let suffix = '';

  if (absValue >= 1_000_000_000) {
    divisor = 1_000_000_000;
    suffix = 'B';
  } else if (absValue >= 1_000_000) {
    divisor = 1_000_000;
    suffix = 'M';
  } else if (absValue >= 1_000) {
    divisor = 1_000;
    suffix = 'K';
  }

  const result = value / divisor;
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(result);

  return prefix + formatted + suffix;
}

// =============================================================================
// PERCENT FORMATTING
// =============================================================================

export interface PercentOptions {
  locale?: string;
  decimals?: number;
  showSign?: boolean;       // Show +/- for positive/negative
}

/**
 * Format a number as percentage
 * @example formatPercent(0.1234) // "12.3%" (input is decimal)
 * @example formatPercent(12.34, { isDecimal: false }) // "12.3%" (input is already %)
 */
export function formatPercent(
  value: number | null | undefined,
  options: PercentOptions & { isDecimal?: boolean } = {}
): string {
  if (value == null || isNaN(value)) return '—';

  const {
    locale = 'en-US',
    decimals = 1,
    showSign = false,
    isDecimal = true,
  } = options;

  const percentValue = isDecimal ? value * 100 : value;
  
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(percentValue));

  const sign = showSign && percentValue > 0 ? '+' : percentValue < 0 ? '-' : '';
  return `${sign}${formatted}%`;
}

// =============================================================================
// DATE FORMATTING
// =============================================================================

export type DateFormat = 
  | 'short'      // Jan 5
  | 'medium'     // Jan 5, 2026
  | 'long'       // January 5, 2026
  | 'iso'        // 2026-01-05
  | 'relative';  // 2 days ago

export interface DateOptions {
  format?: DateFormat;
  locale?: string;
}

/**
 * Format a date string or Date object
 * @example formatDate('2026-01-05') // "Jan 5"
 * @example formatDate('2026-01-05', { format: 'long' }) // "January 5, 2026"
 */
export function formatDate(
  value: string | Date | null | undefined,
  options: DateOptions = {}
): string {
  if (value == null) return '—';

  const { format = 'short', locale = 'en-US' } = options;
  const date = typeof value === 'string' ? new Date(value) : value;

  if (isNaN(date.getTime())) return '—';

  switch (format) {
    case 'short':
      return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    case 'medium':
      return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
    case 'long':
      return date.toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' });
    case 'iso':
      return date.toISOString().split('T')[0];
    case 'relative':
      return formatRelativeDate(date);
    default:
      return date.toLocaleDateString(locale);
  }
}

/**
 * Format date as relative time (e.g., "2 days ago")
 */
function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

// =============================================================================
// DATETIME FORMATTING
// =============================================================================

/**
 * Format a datetime with time component
 * @example formatDateTime('2026-01-05T14:30:00') // "Jan 5, 2:30 PM"
 */
export function formatDateTime(
  value: string | Date | null | undefined,
  options: { locale?: string } = {}
): string {
  if (value == null) return '—';

  const { locale = 'en-US' } = options;
  const date = typeof value === 'string' ? new Date(value) : value;

  if (isNaN(date.getTime())) return '—';

  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// =============================================================================
// TEXT UTILITIES
// =============================================================================

/**
 * Truncate text with ellipsis
 * @example truncate("Long text here", 10) // "Long te..."
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Convert to title case
 */
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// =============================================================================
// EMPTY STATE HELPERS
// =============================================================================

/**
 * Check if a value is empty (null, undefined, empty array, empty string)
 */
export function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'string') return value.trim() === '';
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Get display value or placeholder
 */
export function valueOr<T>(value: T | null | undefined, fallback: T): T {
  return value ?? fallback;
}

/**
 * Design Tokens - Standardized values for consistent UI
 * 
 * Usage: Import these tokens in components for consistent styling.
 * These values align with Tailwind CSS defaults where applicable.
 */

// =============================================================================
// COLOR PALETTE
// =============================================================================

export const colors = {
  // Primary brand colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',  // Main primary
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Semantic colors
  success: {
    light: '#dcfce7',
    main: '#22c55e',
    dark: '#15803d',
  },
  warning: {
    light: '#fef3c7',
    main: '#f59e0b',
    dark: '#b45309',
  },
  error: {
    light: '#fee2e2',
    main: '#ef4444',
    dark: '#b91c1c',
  },
  info: {
    light: '#dbeafe',
    main: '#3b82f6',
    dark: '#1d4ed8',
  },

  // Chart palette (colorblind-friendly)
  chart: [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
  ],

  // Grayscale (for text, borders, backgrounds)
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
} as const;

// =============================================================================
// SPACING (4px grid system)
// =============================================================================

export const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem', // 40px
  12: '3rem',   // 48px
  16: '4rem',   // 64px
} as const;

// =============================================================================
// SHADOWS
// =============================================================================

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.25rem',  // 4px
  md: '0.5rem',   // 8px
  lg: '0.75rem',  // 12px
  xl: '1rem',     // 16px
  full: '9999px',
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'JetBrains Mono, Menlo, Monaco, monospace',
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// =============================================================================
// TRANSITIONS
// =============================================================================

export const transitions = {
  fast: '150ms ease-in-out',
  normal: '200ms ease-in-out',
  slow: '300ms ease-in-out',
} as const;

// =============================================================================
// BREAKPOINTS (matches Tailwind)
// =============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// =============================================================================
// Z-INDEX SCALE
// =============================================================================

export const zIndex = {
  dropdown: 10,
  sticky: 20,
  modal: 30,
  popover: 40,
  tooltip: 50,
} as const;

// =============================================================================
// CHART DEFAULTS
// =============================================================================

export const chartDefaults = {
  height: {
    sm: 192,   // h-48
    md: 256,   // h-64
    lg: 320,   // h-80
  },
  margin: {
    top: 5,
    right: 20,
    bottom: 5,
    left: 10,
  },
  animation: {
    duration: 300,
  },
} as const;

/**
 * Design Tokens - Sovereign Light Theme System
 * 
 * Enterprise-grade visual system for executive dashboards.
 * Inspired by aura-marketing-guardian's "Sovereign Light" palette.
 * 
 * Features:
 * - Light theme with clean, flat design (no excessive glows)
 * - Persona-based accent colors for role customization
 * - Industry overlays for vertical-specific theming
 * - Crisis/alert state theming with threshold detection
 * 
 * Usage: Import tokens and use CSS custom properties for dynamic theming.
 */

// =============================================================================
// SOVEREIGN LIGHT PALETTE
// =============================================================================

export const colors = {
  // Background system
  background: {
    main: '#f1f5f9',      // Slate 100 - Main app background
    card: '#ffffff',       // Pure white cards
    elevated: '#f8fafc',   // Slate 50 - Hover/elevated surfaces
    overlay: 'rgba(15, 23, 42, 0.4)', // Modal overlays
  },

  // Border system
  border: {
    subtle: '#e2e8f0',    // Slate 200 - Primary borders
    strong: '#cbd5e1',    // Slate 300 - Emphasized borders
  },

  // Text system (dark for maximum readability)
  text: {
    primary: '#0f172a',   // Slate 900 - Headers
    secondary: '#334155', // Slate 700 - Body text
    muted: '#64748b',     // Slate 500 - Subtext
    dim: '#94a3b8',       // Slate 400 - Disabled/placeholder
  },

  // Primary brand colors (Indigo)
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',  // Main primary (Indigo)
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  
  // Semantic colors
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    light: '#a7f3d0',
    main: '#10b981',  // Emerald
    dark: '#059669',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    light: '#fde68a',
    main: '#f59e0b',  // Amber
    dark: '#d97706',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    light: '#fecaca',
    main: '#ef4444',  // Red
    dark: '#dc2626',
  },
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    light: '#bfdbfe',
    main: '#3b82f6',  // Blue
    dark: '#2563eb',
  },

  // Chart palette (professional, colorblind-friendly)
  chart: [
    '#6366f1', // Indigo - primary
    '#10b981', // Emerald - success
    '#f59e0b', // Amber - warning
    '#f43f5e', // Rose - crisis
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#84cc16', // Lime
  ],

  // Slate scale (utility)
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
} as const;

// =============================================================================
// PERSONA ACCENT SYSTEM
// =============================================================================
// Role-based theming for different user personas

export type PersonaType = 'executive' | 'analyst' | 'operations' | 'default';

export const personaAccents = {
  // Executive/CMO - Indigo (authority, trust)
  executive: {
    accent: '#6366f1',
    accentRgb: '99, 102, 241',
    accentHover: '#4f46e5',
    accentMuted: '#e0e7ff',
    accentLight: '#c7d2fe',
    accentDark: '#4338ca',
  },
  
  // Brand Strategist/Analyst - Emerald (growth, success)
  analyst: {
    accent: '#10b981',
    accentRgb: '16, 185, 129',
    accentHover: '#059669',
    accentMuted: '#d1fae5',
    accentLight: '#a7f3d0',
    accentDark: '#047857',
  },
  
  // Operations/Sentinel - Amber (alertness, action)
  operations: {
    accent: '#f59e0b',
    accentRgb: '245, 158, 11',
    accentHover: '#d97706',
    accentMuted: '#fef3c7',
    accentLight: '#fde68a',
    accentDark: '#b45309',
  },
  
  // Default fallback
  default: {
    accent: '#6366f1',
    accentRgb: '99, 102, 241',
    accentHover: '#4f46e5',
    accentMuted: '#e0e7ff',
    accentLight: '#c7d2fe',
    accentDark: '#4338ca',
  },
} as const;

// =============================================================================
// INDUSTRY OVERLAY SYSTEM
// =============================================================================
// Vertical-specific color tints for industry customization

export type IndustryType = 'retail' | 'finance' | 'healthcare' | 'technology' | 'default';

export const industryTints = {
  retail: {
    tint: '#f97316',       // Orange
    tintRgb: '249, 115, 22',
    tintLight: '#ffedd5',
  },
  finance: {
    tint: '#0ea5e9',       // Sky blue
    tintRgb: '14, 165, 233',
    tintLight: '#e0f2fe',
  },
  healthcare: {
    tint: '#14b8a6',       // Teal
    tintRgb: '20, 184, 166',
    tintLight: '#ccfbf1',
  },
  technology: {
    tint: '#8b5cf6',       // Violet
    tintRgb: '139, 92, 246',
    tintLight: '#ede9fe',
  },
  default: {
    tint: '#6366f1',       // Indigo
    tintRgb: '99, 102, 241',
    tintLight: '#e0e7ff',
  },
} as const;

// =============================================================================
// CRISIS/ALERT THEMING
// =============================================================================
// Dynamic colors based on data thresholds (crisis mode)

export const crisisColors = {
  // Normal/healthy state
  healthy: {
    primary: '#10b981',    // Teal/emerald
    background: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.3)',
    glow: 'rgba(16, 185, 129, 0.25)',
  },
  
  // Warning state
  warning: {
    primary: '#f59e0b',    // Amber
    background: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.3)',
    glow: 'rgba(245, 158, 11, 0.25)',
  },
  
  // Crisis/critical state
  crisis: {
    primary: '#f43f5e',    // Rose
    background: 'rgba(244, 63, 94, 0.1)',
    border: 'rgba(244, 63, 94, 0.3)',
    glow: 'rgba(244, 63, 94, 0.25)',
  },
} as const;

/**
 * Get theme colors based on crisis threshold
 * @param value Current metric value
 * @param warningThreshold Threshold for warning state
 * @param crisisThreshold Threshold for crisis state
 * @param invertThresholds If true, lower values trigger alerts (e.g., conversion rate)
 */
export function getCrisisTheme(
  value: number,
  warningThreshold: number,
  crisisThreshold: number,
  invertThresholds = false
) {
  if (invertThresholds) {
    if (value <= crisisThreshold) return crisisColors.crisis;
    if (value <= warningThreshold) return crisisColors.warning;
    return crisisColors.healthy;
  } else {
    if (value >= crisisThreshold) return crisisColors.crisis;
    if (value >= warningThreshold) return crisisColors.warning;
    return crisisColors.healthy;
  }
}

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

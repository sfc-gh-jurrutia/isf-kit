/**
 * UI Templates Library
 * 
 * A standardized set of UI primitives, charts, and UX components
 * for building consistent data-driven dashboards.
 * 
 * ## Structure
 * 
 * - **design-tokens.ts** - Colors, spacing, typography, shadows
 * - **formatters.ts** - Currency, number, percent, date formatters
 * - **chart-config.ts** - Recharts configuration and theme helpers
 * - **charts/** - 6 standard chart types (Line, Bar, HBar, Pie, Area, KPI)
 * - **components/** - UX components (Skeleton, EmptyState, ErrorState)
 * 
 * ## Quick Start
 * 
 * ```tsx
 * // Import what you need
 * import { colors, spacing } from './design-tokens';
 * import { formatCurrency, formatPercent } from './formatters';
 * import { LineChart, BarChart, KPICard } from './charts';
 * import { Skeleton, EmptyState, ErrorState } from './components';
 * 
 * // Use in components
 * function Dashboard() {
 *   const { isDark } = useTheme();
 *   
 *   if (isLoading) return <Skeleton.Chart />;
 *   if (error) return <ErrorState type="server" onRetry={refetch} />;
 *   if (!data.length) return <EmptyState title="No data" icon="chart" />;
 *   
 *   return (
 *     <LineChart
 *       data={data}
 *       title="Revenue Trend"
 *       isDark={isDark}
 *       formatYAxis={formatCurrency}
 *     />
 *   );
 * }
 * ```
 * 
 * ## Design Tokens
 * 
 * Use design tokens for consistent styling:
 * - `colors.primary[500]` - Primary blue
 * - `colors.chart[0-7]` - Chart color palette
 * - `spacing.md` - Standard spacing (16px)
 * - `shadows.md` - Card shadow
 * 
 * ## Formatters
 * 
 * - `formatCurrency(1234.56)` → "$1,234.56"
 * - `formatCurrency(1234567, { compact: true })` → "$1.2M"
 * - `formatPercent(0.156)` → "15.6%"
 * - `formatNumber(1234567, { compact: true })` → "1.2M"
 * - `formatDate(date, { format: 'short' })` → "Jan 15"
 */

// Design foundations
export * from './design-tokens';
export * from './formatters';
export * from './chart-config';

// Chart components
export * from './charts';

// UX components
export * from './components';

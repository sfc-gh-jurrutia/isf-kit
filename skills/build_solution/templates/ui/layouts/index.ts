/**
 * Layout Templates Index
 * 
 * Export all layout components for easy importing
 */

// Dashboard shell
export { 
  DashboardShell, 
  defaultNavItems,
  type DashboardShellProps, 
  type NavItem 
} from './DashboardShell';

// KPI grid
export { 
  KPIGrid, 
  KPIGridSkeleton,
  type KPIGridProps,
  type KPIGridSkeletonProps,
} from './KPIGrid';

// Chart grid
export { 
  ChartGrid, 
  ChartGridItem,
  TwoColumnLayout,
  FeaturedLayout,
  SidebarLayout,
  type ChartGridProps,
  type ChartGridItemProps,
} from './ChartGrid';

// Split view
export { 
  SplitView,
  ChatWithAnalytics,
  AnalyticsWithChat,
  type SplitViewProps,
} from './SplitView';

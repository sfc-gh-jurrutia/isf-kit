/**
 * UX Components
 * 
 * Standard components for handling loading, empty, and error states.
 * Use these to provide consistent user feedback across the application.
 * 
 * Usage:
 * ```tsx
 * import { Skeleton, EmptyState, ErrorState } from './components';
 * 
 * // Loading state
 * {isLoading && <Skeleton.Chart />}
 * 
 * // Empty state  
 * {!data.length && <EmptyState title="No results" icon="search" />}
 * 
 * // Error state
 * {error && <ErrorState type="server" onRetry={refetch} />}
 * ```
 */

export { 
  Skeleton,
  SkeletonText,
  SkeletonTitle,
  SkeletonBadge,
  SkeletonAvatar,
  SkeletonImage,
  SkeletonButton,
  SkeletonBarChart,
  SkeletonLineChart,
  SkeletonSankey,
  SkeletonKPI,
  SkeletonChart,
  SkeletonTable,
  SkeletonTableRow,
  SkeletonCard,
  SkeletonDashboard,
} from './Skeleton';

export { EmptyState, EmptyStatePresets } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export { ErrorState, getErrorTypeFromStatus, errorToProps } from './ErrorState';
export type { ErrorStateProps, ErrorType } from './ErrorState';

export { TechnicalMetadata } from './TechnicalMetadata';
export type { TechnicalMetadataProps, LineageNode, LineageNodeType } from './TechnicalMetadata';

export { 
  CrisisTheme, 
  CrisisIndicator, 
  CrisisKPI, 
  CrisisAlertBanner,
  getCrisisLevel,
  getCrisisClasses,
} from './CrisisTheme';
export type { 
  CrisisThemeProps, 
  CrisisIndicatorProps, 
  CrisisKPIProps, 
  CrisisAlertBannerProps,
  CrisisLevel,
} from './CrisisTheme';

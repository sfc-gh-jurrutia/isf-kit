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

export { Skeleton } from './Skeleton';
export type { } from './Skeleton'; // Re-export types as needed

export { EmptyState, EmptyStatePresets } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export { ErrorState, getErrorTypeFromStatus, errorToProps } from './ErrorState';
export type { ErrorStateProps, ErrorType } from './ErrorState';

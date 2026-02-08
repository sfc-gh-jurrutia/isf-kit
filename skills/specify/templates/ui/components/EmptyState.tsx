/**
 * EmptyState - Placeholder for empty data scenarios
 * 
 * Use when a list, table, or view has no data to display.
 * Provides helpful messaging and optional action buttons.
 */

import React from 'react';
import { 
  Inbox, 
  Search, 
  FileQuestion, 
  Database,
  BarChart3,
  Users,
  ShoppingCart,
  type LucideIcon 
} from 'lucide-react';

// =============================================================================
// PRESET ICONS
// =============================================================================

const presetIcons: Record<string, LucideIcon> = {
  inbox: Inbox,
  search: Search,
  file: FileQuestion,
  database: Database,
  chart: BarChart3,
  users: Users,
  cart: ShoppingCart,
};

// =============================================================================
// PROPS
// =============================================================================

export interface EmptyStateProps {
  /** Main title */
  title: string;
  /** Description text */
  description?: string;
  /** Icon preset name or custom icon component */
  icon?: keyof typeof presetIcons | React.ReactNode;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom class name */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function EmptyState({
  title,
  description,
  icon = 'inbox',
  action,
  secondaryAction,
  size = 'md',
  className = '',
}: EmptyStateProps) {
  // Resolve icon
  const IconComponent = typeof icon === 'string' 
    ? presetIcons[icon] ?? Inbox
    : null;

  const sizeClasses = {
    sm: {
      container: 'py-6 px-4',
      icon: 'w-8 h-8',
      title: 'text-sm',
      description: 'text-xs',
      button: 'px-3 py-1.5 text-sm',
    },
    md: {
      container: 'py-12 px-6',
      icon: 'w-12 h-12',
      title: 'text-lg',
      description: 'text-sm',
      button: 'px-4 py-2 text-sm',
    },
    lg: {
      container: 'py-16 px-8',
      icon: 'w-16 h-16',
      title: 'text-xl',
      description: 'text-base',
      button: 'px-6 py-2.5 text-base',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div 
      className={`
        flex flex-col items-center justify-center text-center
        ${sizes.container} ${className}
      `}
    >
      {/* Icon */}
      <div className="mb-4 text-gray-400 dark:text-gray-500">
        {IconComponent ? (
          <IconComponent className={sizes.icon} strokeWidth={1.5} />
        ) : (
          icon
        )}
      </div>

      {/* Title */}
      <h3 className={`${sizes.title} font-semibold text-gray-900 dark:text-white mb-1`}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className={`${sizes.description} text-gray-500 dark:text-gray-400 max-w-sm mb-4`}>
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-2">
          {action && (
            <button
              onClick={action.onClick}
              className={`
                ${sizes.button} font-medium rounded-lg
                bg-blue-500 hover:bg-blue-600 text-white
                transition-colors
              `}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className={`
                ${sizes.button} font-medium rounded-lg
                bg-gray-100 hover:bg-gray-200 text-gray-700
                dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200
                transition-colors
              `}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// PRESET EMPTY STATES
// =============================================================================

export const EmptyStatePresets = {
  /** No search results */
  NoResults: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon="search"
      title="No results found"
      description="Try adjusting your search or filters to find what you're looking for."
      {...props}
    />
  ),

  /** No data in table/list */
  NoData: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon="database"
      title="No data available"
      description="There's no data to display yet."
      {...props}
    />
  ),

  /** No chart data */
  NoChartData: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon="chart"
      title="No data to display"
      description="There's not enough data to render this chart."
      size="sm"
      {...props}
    />
  ),

  /** Empty cart/list */
  EmptyList: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon="inbox"
      title="Nothing here yet"
      description="Items you add will appear here."
      {...props}
    />
  ),
};

export default EmptyState;

/**
 * ErrorState - Error display and recovery component
 * 
 * Use when an operation fails and the user needs to understand
 * what went wrong and how to recover.
 */

import React from 'react';
import { 
  AlertCircle, 
  WifiOff, 
  ServerCrash, 
  ShieldAlert,
  RefreshCw,
  type LucideIcon 
} from 'lucide-react';

// =============================================================================
// ERROR TYPES
// =============================================================================

export type ErrorType = 'generic' | 'network' | 'server' | 'permission' | 'notFound';

const errorConfig: Record<ErrorType, { icon: LucideIcon; defaultTitle: string; defaultDescription: string }> = {
  generic: {
    icon: AlertCircle,
    defaultTitle: 'Something went wrong',
    defaultDescription: 'An unexpected error occurred. Please try again.',
  },
  network: {
    icon: WifiOff,
    defaultTitle: 'Connection error',
    defaultDescription: 'Unable to connect to the server. Check your internet connection and try again.',
  },
  server: {
    icon: ServerCrash,
    defaultTitle: 'Server error',
    defaultDescription: 'The server encountered an error. Please try again later.',
  },
  permission: {
    icon: ShieldAlert,
    defaultTitle: 'Access denied',
    defaultDescription: 'You don\'t have permission to access this resource.',
  },
  notFound: {
    icon: AlertCircle,
    defaultTitle: 'Not found',
    defaultDescription: 'The requested resource could not be found.',
  },
};

// =============================================================================
// PROPS
// =============================================================================

export interface ErrorStateProps {
  /** Error type for preset styling */
  type?: ErrorType;
  /** Custom title (overrides preset) */
  title?: string;
  /** Custom description (overrides preset) */
  description?: string;
  /** Technical error details (shown in collapsible) */
  details?: string;
  /** Retry action */
  onRetry?: () => void;
  /** Custom retry button label */
  retryLabel?: string;
  /** Additional action */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Inline mode (less padding, for embedding in cards) */
  inline?: boolean;
  /** Custom class name */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ErrorState({
  type = 'generic',
  title,
  description,
  details,
  onRetry,
  retryLabel = 'Try again',
  action,
  size = 'md',
  inline = false,
  className = '',
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  
  const config = errorConfig[type];
  const Icon = config.icon;
  const displayTitle = title ?? config.defaultTitle;
  const displayDescription = description ?? config.defaultDescription;

  const sizeClasses = {
    sm: {
      container: inline ? 'py-4 px-3' : 'py-6 px-4',
      icon: 'w-8 h-8',
      title: 'text-sm',
      description: 'text-xs',
      button: 'px-3 py-1.5 text-sm',
    },
    md: {
      container: inline ? 'py-6 px-4' : 'py-12 px-6',
      icon: 'w-12 h-12',
      title: 'text-lg',
      description: 'text-sm',
      button: 'px-4 py-2 text-sm',
    },
    lg: {
      container: inline ? 'py-8 px-6' : 'py-16 px-8',
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
      <div className="mb-4 text-red-500 dark:text-red-400">
        <Icon className={sizes.icon} strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h3 className={`${sizes.title} font-semibold text-gray-900 dark:text-white mb-1`}>
        {displayTitle}
      </h3>

      {/* Description */}
      <p className={`${sizes.description} text-gray-500 dark:text-gray-400 max-w-sm mb-4`}>
        {displayDescription}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className={`
              ${sizes.button} font-medium rounded-lg
              bg-blue-500 hover:bg-blue-600 text-white
              transition-colors inline-flex items-center gap-2
            `}
          >
            <RefreshCw className="w-4 h-4" />
            {retryLabel}
          </button>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className={`
              ${sizes.button} font-medium rounded-lg
              bg-gray-100 hover:bg-gray-200 text-gray-700
              dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200
              transition-colors
            `}
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Technical details (collapsible) */}
      {details && (
        <div className="mt-4 w-full max-w-md">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            {showDetails ? 'Hide' : 'Show'} technical details
          </button>
          {showDetails && (
            <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-left text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-32">
              {details}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// HELPER FUNCTION
// =============================================================================

/**
 * Determine error type from HTTP status code
 */
export function getErrorTypeFromStatus(status: number): ErrorType {
  if (status === 401 || status === 403) return 'permission';
  if (status === 404) return 'notFound';
  if (status >= 500) return 'server';
  if (status === 0 || !navigator.onLine) return 'network';
  return 'generic';
}

/**
 * Create ErrorState props from an Error object
 */
export function errorToProps(error: Error & { status?: number }): Partial<ErrorStateProps> {
  const type = error.status ? getErrorTypeFromStatus(error.status) : 'generic';
  return {
    type,
    details: error.stack ?? error.message,
  };
}

export default ErrorState;

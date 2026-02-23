/**
 * SplitView - Side-by-side layout for chat + analytics
 * 
 * Use cases: AI chat with live data visualization, conversational analytics
 * Configurable split ratios and collapsible panels
 */

import React, { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export interface SplitViewProps {
  /** Left panel content (usually chat) */
  leftPanel: React.ReactNode;
  /** Right panel content (usually analytics) */
  rightPanel: React.ReactNode;
  /** Left panel title */
  leftTitle?: string;
  /** Right panel title */
  rightTitle?: string;
  /** Split ratio - left panel width */
  splitRatio?: '1/3' | '1/2' | '2/3';
  /** Allow collapsing the right panel */
  collapsible?: boolean;
  /** Initially collapsed */
  defaultCollapsed?: boolean;
  /** Dark mode */
  isDark?: boolean;
  /** Custom class name */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SplitView({
  leftPanel,
  rightPanel,
  leftTitle,
  rightTitle,
  splitRatio = '1/2',
  collapsible = true,
  defaultCollapsed = false,
  isDark = false,
  className = '',
}: SplitViewProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  // Grid column classes based on split ratio
  const gridClasses = {
    '1/3': collapsed ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3',
    '1/2': collapsed ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2',
    '2/3': collapsed ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[2fr_1fr]',
  };

  const leftColSpan = {
    '1/3': 'lg:col-span-1',
    '1/2': 'lg:col-span-1',
    '2/3': 'lg:col-span-1',
  };

  const rightColSpan = {
    '1/3': 'lg:col-span-2',
    '1/2': 'lg:col-span-1',
    '2/3': 'lg:col-span-1',
  };

  return (
    <div className={`grid ${gridClasses[splitRatio]} gap-0 h-full ${className}`}>
      {/* Left Panel */}
      <div 
        className={`
          flex flex-col h-full
          bg-white dark:bg-gray-800
          border-r border-gray-200 dark:border-gray-700
          ${leftColSpan[splitRatio]}
        `}
      >
        {/* Left Panel Header */}
        {(leftTitle || collapsible) && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            {leftTitle && (
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {leftTitle}
              </h2>
            )}
            {collapsible && collapsed && (
              <button
                onClick={() => setCollapsed(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                title="Show analytics panel"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Left Panel Content */}
        <div className="flex-1 overflow-auto">
          {leftPanel}
        </div>
      </div>

      {/* Right Panel */}
      {!collapsed && (
        <div 
          className={`
            flex flex-col h-full
            bg-gray-50 dark:bg-gray-900
            ${rightColSpan[splitRatio]}
          `}
        >
          {/* Right Panel Header */}
          {(rightTitle || collapsible) && (
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              {rightTitle && (
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {rightTitle}
                </h2>
              )}
              {collapsible && (
                <button
                  onClick={() => setCollapsed(true)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                  title="Hide analytics panel"
                >
                  <PanelLeftClose className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Right Panel Content */}
          <div className="flex-1 overflow-auto p-4">
            {rightPanel}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// PRESET VARIANTS
// =============================================================================

/**
 * ChatWithAnalytics - Chat on left, analytics dashboard on right
 */
export function ChatWithAnalytics({
  chatContent,
  analyticsContent,
  collapsible = true,
  isDark = false,
}: {
  chatContent: React.ReactNode;
  analyticsContent: React.ReactNode;
  collapsible?: boolean;
  isDark?: boolean;
}) {
  return (
    <SplitView
      leftPanel={chatContent}
      rightPanel={analyticsContent}
      leftTitle="Assistant"
      rightTitle="Analytics"
      splitRatio="1/2"
      collapsible={collapsible}
      isDark={isDark}
    />
  );
}

/**
 * AnalyticsWithChat - Large analytics area with chat sidebar
 */
export function AnalyticsWithChat({
  analyticsContent,
  chatContent,
  collapsible = true,
  isDark = false,
}: {
  analyticsContent: React.ReactNode;
  chatContent: React.ReactNode;
  collapsible?: boolean;
  isDark?: boolean;
}) {
  return (
    <SplitView
      leftPanel={analyticsContent}
      rightPanel={chatContent}
      leftTitle="Dashboard"
      rightTitle="AI Assistant"
      splitRatio="2/3"
      collapsible={collapsible}
      isDark={isDark}
    />
  );
}

export default SplitView;

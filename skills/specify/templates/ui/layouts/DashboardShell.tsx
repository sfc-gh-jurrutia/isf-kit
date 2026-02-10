/**
 * DashboardShell - Main application shell with sidebar navigation
 * 
 * Use cases: Executive dashboards, admin panels, analytics apps
 * Provides consistent navigation, header, and main content area
 */

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

export interface DashboardShellProps {
  /** Application title */
  title: string;
  /** Optional subtitle or breadcrumb */
  subtitle?: string;
  /** Navigation items for sidebar */
  navItems?: NavItem[];
  /** Currently active nav item id */
  activeNavId?: string;
  /** Main content */
  children: React.ReactNode;
  /** Header actions (buttons, user menu, etc.) */
  headerActions?: React.ReactNode;
  /** Dark mode enabled */
  isDark?: boolean;
  /** Sidebar initially collapsed */
  defaultCollapsed?: boolean;
  /** Logo or brand element */
  logo?: React.ReactNode;
}

// =============================================================================
// DEFAULT NAV ITEMS
// =============================================================================

export const defaultNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-5 h-5" /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function DashboardShell({
  title,
  subtitle,
  navItems = defaultNavItems,
  activeNavId = 'dashboard',
  children,
  headerActions,
  isDark = false,
  defaultCollapsed = false,
  logo,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className={`min-h-screen flex ${isDark ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Sidebar - Desktop */}
      <aside 
        className={`
          hidden md:flex flex-col
          ${collapsed ? 'w-16' : 'w-64'}
          bg-white dark:bg-gray-800 
          border-r border-gray-200 dark:border-gray-700
          transition-all duration-300
        `}
      >
        {/* Logo/Brand */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700 px-4">
          {logo || (
            <span className={`font-bold text-xl text-gray-900 dark:text-white ${collapsed ? 'hidden' : ''}`}>
              {title.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-colors duration-150
                ${activeNavId === item.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }
              `}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg
              text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/50
              transition-colors"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-64
          bg-white dark:bg-gray-800 
          border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-300 md:hidden
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-16 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4">
          <span className="font-bold text-xl text-gray-900 dark:text-white">{title}</span>
          <button onClick={() => setMobileMenuOpen(false)} className="p-2">
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <nav className="py-4 px-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                item.onClick?.();
                setMobileMenuOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                ${activeNavId === item.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }
              `}
            >
              {item.icon}
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 
          bg-white dark:bg-gray-800 
          border-b border-gray-200 dark:border-gray-700">
          {/* Mobile menu button + Title */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Header Actions */}
          {headerActions && (
            <div className="flex items-center gap-2">
              {headerActions}
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardShell;

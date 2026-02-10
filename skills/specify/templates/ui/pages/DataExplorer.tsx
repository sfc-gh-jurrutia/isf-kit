/**
 * DataExplorer - Query results with auto-visualization
 * 
 * Use cases: Ad-hoc data exploration, SQL playground with visualizations
 * Features: Query input, result table, automatic chart suggestions
 * 
 * CUSTOMIZATION GUIDE:
 * 1. Replace executeQuery with your Cortex Analyst API call
 * 2. Customize the query suggestions for your domain
 * 3. Update chart type detection logic based on your data patterns
 */

'use client';

import React, { useState } from 'react';
import { Play, Table, BarChart3, LineChart as LineChartIcon, Download } from 'lucide-react';

// Import from your local copies
import { LineChart } from '../charts/LineChart';
import { BarChart } from '../charts/BarChart';
import { PieChart } from '../charts/PieChart';
import { formatNumber, formatCurrency } from '../formatters';

// =============================================================================
// TYPES
// =============================================================================

export interface DataExplorerProps {
  /** Page title */
  title?: string;
  /** Dark mode */
  isDark?: boolean;
  /** Query execution handler */
  onExecuteQuery?: (query: string) => Promise<QueryResult>;
  /** Example queries to show */
  exampleQueries?: ExampleQuery[];
}

interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  executionTime?: number;
  rowCount?: number;
}

interface ExampleQuery {
  label: string;
  sql: string;
}

type ViewMode = 'table' | 'chart';
type ChartType = 'bar' | 'line' | 'pie';

// =============================================================================
// DEFAULT DATA
// =============================================================================

const defaultExampleQueries: ExampleQuery[] = [
  {
    label: 'Revenue by Channel',
    sql: `SELECT channel_name, SUM(revenue) as total_revenue
FROM orders o
JOIN channels c ON o.channel_id = c.channel_id
GROUP BY channel_name
ORDER BY total_revenue DESC`,
  },
  {
    label: 'Monthly Trends',
    sql: `SELECT DATE_TRUNC('month', order_date) as month,
       COUNT(*) as orders,
       SUM(revenue) as revenue
FROM orders
GROUP BY 1
ORDER BY 1`,
  },
  {
    label: 'Customer Segments',
    sql: `SELECT segment,
       COUNT(*) as customers,
       AVG(lifetime_value) as avg_ltv
FROM customers
GROUP BY segment
ORDER BY avg_ltv DESC`,
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function DataExplorer({
  title = 'Data Explorer',
  isDark = false,
  onExecuteQuery,
  exampleQueries = defaultExampleQueries,
}: DataExplorerProps) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [chartType, setChartType] = useState<ChartType>('bar');

  const executeQuery = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = onExecuteQuery 
        ? await onExecuteQuery(query)
        : await mockExecuteQuery(query);
      
      setResult(res);
      
      // Auto-detect best chart type
      if (res.columns.length >= 2) {
        const hasDate = res.columns.some(c => 
          c.toLowerCase().includes('date') || c.toLowerCase().includes('month')
        );
        setChartType(hasDate ? 'line' : 'bar');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query execution failed');
    } finally {
      setIsLoading(false);
    }
  };

  const loadExample = (example: ExampleQuery) => {
    setQuery(example.sql);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      executeQuery();
    }
  };

  // Transform result data for charts
  const chartData = result?.rows.map(row => {
    const keys = Object.keys(row);
    return {
      name: String(row[keys[0]]),
      value: Number(row[keys[1]]) || 0,
      date: String(row[keys[0]]),
    };
  }) || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
      </div>

      {/* Query Editor */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">SQL Query</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Ctrl+Enter to run</span>
          </div>
        </div>
        
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your SQL query..."
          className="w-full h-40 p-4 font-mono text-sm
            bg-transparent border-0 focus:ring-0
            text-gray-900 dark:text-white
            placeholder-gray-500 resize-none"
        />

        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          {/* Example Queries */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Examples:</span>
            {exampleQueries.map((ex, i) => (
              <button
                key={i}
                onClick={() => loadExample(ex)}
                className="text-xs px-2 py-1 rounded
                  bg-gray-200 dark:bg-gray-700
                  hover:bg-gray-300 dark:hover:bg-gray-600
                  text-gray-700 dark:text-gray-300
                  transition-colors"
              >
                {ex.label}
              </button>
            ))}
          </div>

          {/* Run Button */}
          <button
            onClick={executeQuery}
            disabled={!query.trim() || isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg
              bg-blue-500 hover:bg-blue-600
              disabled:opacity-50 disabled:cursor-not-allowed
              text-white text-sm font-medium
              transition-colors"
          >
            <Play className="w-4 h-4" />
            {isLoading ? 'Running...' : 'Run Query'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Results Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {result.rowCount ?? result.rows.length} rows
                {result.executionTime && ` • ${result.executionTime}ms`}
              </span>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-200 dark:bg-gray-700">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded ${
                  viewMode === 'table' 
                    ? 'bg-white dark:bg-gray-600 shadow-sm' 
                    : 'hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <Table className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`p-1.5 rounded ${
                  viewMode === 'chart' 
                    ? 'bg-white dark:bg-gray-600 shadow-sm' 
                    : 'hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* Results Content */}
          {viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    {result.columns.map((col) => (
                      <th
                        key={col}
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {result.rows.slice(0, 100).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      {result.columns.map((col) => (
                        <td
                          key={col}
                          className="px-4 py-2 text-sm text-gray-900 dark:text-white whitespace-nowrap"
                        >
                          {formatCell(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.rows.length > 100 && (
                <div className="px-4 py-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-900">
                  Showing first 100 of {result.rows.length} rows
                </div>
              )}
            </div>
          ) : (
            <div className="p-4">
              {/* Chart Type Selector */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-500">Chart type:</span>
                {(['bar', 'line', 'pie'] as ChartType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`px-3 py-1 rounded text-sm ${
                      chartType === type
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>

              {/* Chart */}
              {chartType === 'line' ? (
                <LineChart
                  data={chartData}
                  xKey="date"
                  dataKeys={['value']}
                  size="lg"
                  isDark={isDark}
                  showGrid
                />
              ) : chartType === 'pie' ? (
                <PieChart
                  data={chartData}
                  size="lg"
                  isDark={isDark}
                  showLegend
                />
              ) : (
                <BarChart
                  data={chartData}
                  size="lg"
                  isDark={isDark}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') {
    return value >= 1000 ? formatNumber(value, { compact: true }) : String(value);
  }
  return String(value);
}

// Mock query execution
async function mockExecuteQuery(sql: string): Promise<QueryResult> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return mock data based on query content
  if (sql.toLowerCase().includes('channel')) {
    return {
      columns: ['channel_name', 'total_revenue'],
      rows: [
        { channel_name: 'Email', total_revenue: 450000 },
        { channel_name: 'Organic', total_revenue: 320000 },
        { channel_name: 'Paid Ads', total_revenue: 280000 },
        { channel_name: 'Social', total_revenue: 120000 },
      ],
      executionTime: 234,
      rowCount: 4,
    };
  }
  
  return {
    columns: ['month', 'revenue'],
    rows: [
      { month: '2024-01', revenue: 850000 },
      { month: '2024-02', revenue: 920000 },
      { month: '2024-03', revenue: 1050000 },
      { month: '2024-04', revenue: 1120000 },
    ],
    executionTime: 156,
    rowCount: 4,
  };
}

export default DataExplorer;

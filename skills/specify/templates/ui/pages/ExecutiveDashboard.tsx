/**
 * ExecutiveDashboard - Complete dashboard page for executive audiences
 * 
 * Use cases: C-level demos, board presentations, high-level metrics overview
 * Features: KPI cards, trend charts, key insights section
 * 
 * CUSTOMIZATION GUIDE:
 * 1. Replace sample data with your data fetching logic
 * 2. Update KPI definitions in the kpis array
 * 3. Modify chart configurations for your metrics
 * 4. Customize insights section based on your domain
 */

'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Target, RefreshCw } from 'lucide-react';

// Import from your local copies of these components
import { KPICard } from '../charts/KPICard';
import { LineChart } from '../charts/LineChart';
import { BarChart } from '../charts/BarChart';
import { PieChart } from '../charts/PieChart';
import { KPIGrid } from '../layouts/KPIGrid';
import { ChartGrid, FeaturedLayout } from '../layouts/ChartGrid';
import { formatCurrency, formatNumber, formatPercent } from '../formatters';

// =============================================================================
// TYPES
// =============================================================================

export interface ExecutiveDashboardProps {
  /** Dashboard title */
  title?: string;
  /** Time period label */
  periodLabel?: string;
  /** Dark mode */
  isDark?: boolean;
  /** Data refresh callback */
  onRefresh?: () => Promise<void>;
  /** Custom KPI data */
  kpiData?: KPIDataItem[];
  /** Custom trend data */
  trendData?: TrendDataPoint[];
  /** Custom breakdown data */
  breakdownData?: BreakdownItem[];
}

interface KPIDataItem {
  id: string;
  label: string;
  value: number;
  change?: number;
  changeLabel?: string;
  format: 'currency' | 'number' | 'percent';
  icon: React.ReactNode;
}

interface TrendDataPoint {
  date: string;
  value: number;
  [key: string]: string | number;
}

interface BreakdownItem {
  name: string;
  value: number;
}

// =============================================================================
// SAMPLE DATA (Replace with your data fetching)
// =============================================================================

const sampleKPIs: KPIDataItem[] = [
  {
    id: 'revenue',
    label: 'Total Revenue',
    value: 1250000,
    change: 12.5,
    changeLabel: 'vs last month',
    format: 'currency',
    icon: <DollarSign className="w-5 h-5" />,
  },
  {
    id: 'customers',
    label: 'Active Customers',
    value: 48500,
    change: 8.2,
    changeLabel: 'vs last month',
    format: 'number',
    icon: <Users className="w-5 h-5" />,
  },
  {
    id: 'conversion',
    label: 'Conversion Rate',
    value: 3.8,
    change: 0.5,
    changeLabel: 'vs last month',
    format: 'percent',
    icon: <Target className="w-5 h-5" />,
  },
  {
    id: 'growth',
    label: 'Month-over-Month',
    value: 15.2,
    change: 3.1,
    changeLabel: 'acceleration',
    format: 'percent',
    icon: <TrendingUp className="w-5 h-5" />,
  },
];

const sampleTrendData: TrendDataPoint[] = [
  { date: 'Jan', value: 850000, target: 800000 },
  { date: 'Feb', value: 920000, target: 850000 },
  { date: 'Mar', value: 980000, target: 900000 },
  { date: 'Apr', value: 1050000, target: 950000 },
  { date: 'May', value: 1120000, target: 1000000 },
  { date: 'Jun', value: 1250000, target: 1050000 },
];

const sampleBreakdownData: BreakdownItem[] = [
  { name: 'Direct', value: 450000 },
  { name: 'Organic Search', value: 320000 },
  { name: 'Paid Ads', value: 280000 },
  { name: 'Social', value: 120000 },
  { name: 'Referral', value: 80000 },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function ExecutiveDashboard({
  title = 'Executive Dashboard',
  periodLabel = 'Last 30 days',
  isDark = false,
  onRefresh,
  kpiData = sampleKPIs,
  trendData = sampleTrendData,
  breakdownData = sampleBreakdownData,
}: ExecutiveDashboardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
        setLastUpdated(new Date());
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {periodLabel} • Updated {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg
              bg-white dark:bg-gray-800 
              border border-gray-200 dark:border-gray-700
              hover:bg-gray-50 dark:hover:bg-gray-700
              disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <KPIGrid columns={4}>
        {kpiData.map((kpi) => (
          <KPICard
            key={kpi.id}
            label={kpi.label}
            value={kpi.value}
            change={kpi.change}
            changeLabel={kpi.changeLabel}
            format={kpi.format}
            icon={kpi.icon}
            isDark={isDark}
          />
        ))}
      </KPIGrid>

      {/* Charts Section */}
      <FeaturedLayout
        featured={
          <LineChart
            data={trendData}
            dataKeys={['value', 'target']}
            title="Revenue Trend"
            subtitle="Actual vs Target"
            size="lg"
            isDark={isDark}
            showLegend
            showGrid
            formatYAxis={(v) => formatCurrency(v, { compact: true })}
            formatTooltip={(v) => formatCurrency(v)}
            colors={['#3b82f6', '#9ca3af']}
          />
        }
        secondary={[
          <BarChart
            key="breakdown"
            data={breakdownData}
            title="Revenue by Channel"
            size="md"
            isDark={isDark}
            formatYAxis={(v) => formatCurrency(v, { compact: true })}
          />,
          <PieChart
            key="distribution"
            data={breakdownData}
            title="Channel Distribution"
            size="md"
            isDark={isDark}
            showLegend
          />,
        ]}
      />

      {/* Insights Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Key Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InsightCard
            title="Top Performer"
            description="Direct channel leads with 36% of total revenue, up from 32% last month."
            sentiment="positive"
          />
          <InsightCard
            title="Growth Opportunity"
            description="Social channel shows 45% MoM growth but only 10% of revenue share."
            sentiment="neutral"
          />
          <InsightCard
            title="Action Required"
            description="Paid ads CAC increased 15% - recommend campaign optimization review."
            sentiment="negative"
          />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// INSIGHT CARD SUB-COMPONENT
// =============================================================================

function InsightCard({ 
  title, 
  description, 
  sentiment 
}: { 
  title: string; 
  description: string; 
  sentiment: 'positive' | 'neutral' | 'negative';
}) {
  const colors = {
    positive: 'border-l-green-500 bg-green-50 dark:bg-green-900/10',
    neutral: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10',
    negative: 'border-l-red-500 bg-red-50 dark:bg-red-900/10',
  };

  return (
    <div className={`border-l-4 ${colors[sentiment]} rounded-r-lg p-4`}>
      <h4 className="font-medium text-gray-900 dark:text-white mb-1">{title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

export default ExecutiveDashboard;

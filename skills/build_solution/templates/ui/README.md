# UI Templates Catalog

Executive-ready dashboard templates for Snowflake Cortex solutions.

## Quick Start

```tsx
// 1. Import what you need
import { ExecutiveDashboard } from './templates/ui/pages';
import { KPICard, LineChart, SankeyChart, NetworkGraph } from './templates/ui/charts';
import { DashboardShell, KPIGrid } from './templates/ui/layouts';
import { TechnicalMetadata, CrisisKPI, Skeleton } from './templates/ui/components';
import { colors, personaAccents, getCrisisTheme } from './templates/ui/design-tokens';

// 2. Use the page template as-is or customize
<ExecutiveDashboard
  title="Marketing Analytics"
  kpiData={yourKPIs}
  trendData={yourTrends}
  onRefresh={fetchData}
/>
```

---

## Design System: Sovereign Light

Executive-grade visual system with enterprise theming capabilities.

### Theme System

```tsx
import { colors, personaAccents, industryTints, getCrisisTheme } from './design-tokens';

// Sovereign Light palette
colors.background.main    // #f1f5f9 - Main app background
colors.background.card    // #ffffff - Card surfaces
colors.primary[500]       // #6366f1 - Indigo primary
colors.success.main       // #10b981 - Emerald success
colors.warning.main       // #f59e0b - Amber warning
colors.error.main         // #ef4444 - Rose crisis
```

### Persona-Based Theming

Apply role-specific colors for different user types:

```tsx
import { personaAccents, PersonaType } from './design-tokens';

// Executive (CMO, CEO) - Indigo (authority, trust)
personaAccents.executive.accent      // #6366f1

// Analyst - Emerald (growth, data)
personaAccents.analyst.accent        // #10b981

// Operations - Amber (alertness, action)
personaAccents.operations.accent     // #f59e0b
```

### Industry Overlays

Customize colors by vertical:

```tsx
import { industryTints, IndustryType } from './design-tokens';

industryTints.retail.tint       // #f97316 - Orange
industryTints.finance.tint      // #0ea5e9 - Sky blue
industryTints.healthcare.tint   // #14b8a6 - Teal
industryTints.technology.tint   // #8b5cf6 - Violet
```

### Crisis/Alert Theming

Dynamic colors based on metric thresholds:

```tsx
import { getCrisisTheme, crisisColors } from './design-tokens';

// Get theme based on value vs thresholds
const theme = getCrisisTheme(
  currentValue,      // e.g., 0.15 (15% conversion rate)
  warningThreshold,  // e.g., 0.20 (20%)
  crisisThreshold,   // e.g., 0.10 (10%)
  invertThresholds   // true = lower values trigger alerts
);

// Returns { primary, background, border, glow } colors
<div style={{ 
  backgroundColor: theme.background,
  borderColor: theme.border,
}}>
  Crisis-aware component
</div>
```

---

## Executive Components

### TechnicalMetadata

Data transparency component proving real Snowflake data to executives:

```tsx
import { TechnicalMetadata } from './components';

<TechnicalMetadata
  chartName="Customer Journey Flow"
  chartType="sankey"
  sqlQuery="SELECT source, target, value FROM journey_flows..."
  queryRole="ANALYTICS_ROLE"
  queryLatencyMs={142}
  rowsReturned={1250}
  lineage={[
    { name: 'RAW_EVENTS', type: 'stream' },
    { name: 'JOURNEY_FLOWS', type: 'dynamic_table' },
  ]}
  dataSource="MARKETING_DB.ANALYTICS.JOURNEY_FLOWS"
  lastRefreshed={new Date()}
  position="top-right"
/>
```

**Shows:** Small database icon that expands to show SQL, lineage DAG, latency metrics.

### CrisisKPI

KPI card with threshold-based alert styling:

```tsx
import { CrisisKPI, CrisisIndicator, CrisisAlertBanner } from './components';

<CrisisKPI
  title="Conversion Rate"
  value={0.15}
  formattedValue="15%"
  warningThreshold={0.20}
  crisisThreshold={0.10}
  invert={true}  // Lower is worse
  trend={{ value: -2.5, isPositive: false }}
/>

// Full-width alert banner
<CrisisAlertBanner
  level="crisis"
  title="Conversion rate below threshold"
  message="Conversion dropped 25% in the last hour"
  action={{ label: "View Details", onClick: () => {} }}
/>
```

### Skeleton Loaders (Chart-Specific)

Loading states that match chart shapes:

```tsx
import { 
  Skeleton,
  SkeletonSankey,
  SkeletonBarChart,
  SkeletonLineChart,
  SkeletonKPI,
  SkeletonDashboard,
} from './components';

// Full dashboard skeleton
{isLoading && <SkeletonDashboard />}

// Chart-specific skeletons
{isLoading ? <SkeletonSankey heroMode /> : <SankeyChart {...props} />}
{isLoading ? <SkeletonBarChart bars={6} /> : <BarChart {...props} />}
{isLoading ? <SkeletonLineChart /> : <LineChart {...props} />}

// Object syntax
<Skeleton.Dashboard />
<Skeleton.Sankey />
<Skeleton.KPI />
```

---

## Advanced Visualizations

### SankeyChart

Flow visualization for customer journeys, conversion funnels, data lineage:

```tsx
import { SankeyChart } from './charts';

<SankeyChart
  nodes={[
    { name: 'Organic Search', type: 'source' },
    { name: 'Landing Page', type: 'channel' },
    { name: 'Purchase', type: 'conversion' },
    { name: 'Churn', type: 'crisis' },
  ]}
  links={[
    { source: 0, target: 1, value: 5000 },
    { source: 1, target: 2, value: 3500 },
    { source: 1, target: 3, value: 1500 },
  ]}
  title="Customer Journey Flow"
  subtitle="Last 30 days"
  height={350}
  crisisMode={conversionRate < 0.15}
  onNodeClick={(node) => drillDown(node)}
/>
```

**Features:**
- Crisis mode styling when metrics breach thresholds
- Auto-inferred node colors by name (purchase→green, churn→red)
- Smooth gradient links
- Built-in loading skeleton

### NetworkGraph

Force-directed graph for relationships and influence mapping:

```tsx
import { NetworkGraph } from './charts';

<NetworkGraph
  nodes={[
    { id: '1', label: 'Marketing', category: 'primary', value: 100 },
    { id: '2', label: 'Sales', category: 'secondary', value: 80 },
    { id: '3', label: 'Support', category: 'tertiary', value: 60 },
  ]}
  edges={[
    { source: '1', target: '2', weight: 0.8 },
    { source: '2', target: '3', weight: 0.5 },
  ]}
  title="Department Relationships"
  height={400}
  onNodeClick={(node) => showDetails(node)}
  forceStrength={0.5}
/>
```

**Features:**
- D3 force-directed layout
- Node sizing by importance/value
- Drag interaction
- Zoom and pan
- Category-based coloring

---

## Page Templates

Pre-built pages ready to customize for your solution.

### ExecutiveDashboard
KPIs + trend charts + insights section. Best for C-level presentations.

```tsx
import { ExecutiveDashboard } from './pages';

<ExecutiveDashboard
  title="Q4 Performance Review"
  periodLabel="Oct - Dec 2024"
  kpiData={[
    { id: 'revenue', label: 'Revenue', value: 1250000, change: 12.5, format: 'currency', icon: <DollarSign /> },
    { id: 'customers', label: 'Customers', value: 48500, change: 8.2, format: 'number', icon: <Users /> },
  ]}
  trendData={monthlyRevenue}
  breakdownData={channelBreakdown}
  onRefresh={refetchData}
/>
```

**When to use:** Board meetings, investor updates, quarterly reviews

---

### ChatAnalytics
Split view with AI chat on left, live analytics on right.

```tsx
import { ChatAnalytics } from './pages';

<ChatAnalytics
  title="Marketing Assistant"
  suggestedQuestions={[
    "What's our best performing channel?",
    "Show me CAC trends",
    "Compare Q3 vs Q4",
  ]}
  onSendMessage={async (msg) => {
    // Call your Cortex Agent here
    const response = await cortexAgent.query(msg);
    return {
      content: response.text,
      data: {
        chartType: 'bar',
        rows: response.data,
      }
    };
  }}
  initialKPIs={summaryKPIs}
/>
```

**When to use:** Conversational BI solutions, AI-powered analytics

---

### DataExplorer
SQL query editor with auto-visualization.

```tsx
import { DataExplorer } from './pages';

<DataExplorer
  title="Campaign Data Explorer"
  exampleQueries={[
    { label: 'Top Campaigns', sql: 'SELECT campaign_name, SUM(revenue)...' },
    { label: 'Monthly Trends', sql: 'SELECT DATE_TRUNC(month, ...)...' },
  ]}
  onExecuteQuery={async (sql) => {
    // Execute via Cortex Analyst
    const result = await cortexAnalyst.executeSQL(sql);
    return {
      columns: result.columns,
      rows: result.rows,
      executionTime: result.queryTime,
    };
  }}
/>
```

**When to use:** Data exploration solutions, Cortex Analyst showcases

---

## Layout Templates

Building blocks for custom pages.

### DashboardShell
Full app shell with sidebar navigation.

```tsx
import { DashboardShell } from './layouts';

<DashboardShell
  title="Analytics Hub"
  navItems={[
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard />, onClick: () => setPage('dashboard') },
    { id: 'chat', label: 'AI Assistant', icon: <MessageSquare />, onClick: () => setPage('chat') },
  ]}
  activeNavId={currentPage}
  headerActions={<UserMenu />}
>
  {/* Your page content */}
</DashboardShell>
```

---

### KPIGrid
Responsive grid for KPI cards.

```tsx
import { KPIGrid, KPIGridSkeleton } from './layouts';
import { KPICard } from './charts';

// During loading
<KPIGridSkeleton count={4} />

// With data
<KPIGrid columns={4}>
  <KPICard label="Revenue" value={1250000} change={12.5} format="currency" />
  <KPICard label="Customers" value={48500} change={8.2} format="number" />
  <KPICard label="Conversion" value={3.8} change={0.5} format="percent" />
  <KPICard label="Growth" value={15.2} change={3.1} format="percent" />
</KPIGrid>
```

---

### ChartGrid
Flexible chart layout patterns.

```tsx
import { ChartGrid, FeaturedLayout, SidebarLayout } from './layouts';

// Equal two-column layout
<ChartGrid layout="equal">
  <LineChart data={trends} title="Revenue Trend" />
  <BarChart data={channels} title="By Channel" />
</ChartGrid>

// Featured chart with smaller charts below
<FeaturedLayout
  featured={<LineChart data={mainTrend} size="lg" />}
  secondary={[
    <BarChart data={data1} size="md" />,
    <PieChart data={data2} size="md" />,
  ]}
/>

// Main content with sidebar
<SidebarLayout
  main={<LineChart data={detailed} size="lg" />}
  sidebar={<KPIStack kpis={summaryKPIs} />}
/>
```

---

### SplitView
Side-by-side panels for chat + analytics.

```tsx
import { SplitView, ChatWithAnalytics, AnalyticsWithChat } from './layouts';

// Custom split view
<SplitView
  leftPanel={<ChatInterface />}
  rightPanel={<AnalyticsPanel />}
  leftTitle="Assistant"
  rightTitle="Analytics"
  splitRatio="1/2"  // or "1/3" or "2/3"
  collapsible
/>

// Pre-configured variants
<ChatWithAnalytics
  chatContent={<ChatInterface />}
  analyticsContent={<Dashboard />}
/>

<AnalyticsWithChat
  analyticsContent={<Dashboard />}
  chatContent={<ChatInterface />}
/>
```

---

## Chart Components

### KPICard
```tsx
<KPICard
  label="Total Revenue"
  value={1250000}
  change={12.5}          // Optional: shows trend indicator
  changeLabel="vs last month"
  format="currency"      // "currency" | "number" | "percent"
  icon={<DollarSign />}  // Optional
  size="md"              // "sm" | "md" | "lg"
/>
```

### LineChart
```tsx
<LineChart
  data={[
    { date: 'Jan', revenue: 850000, target: 800000 },
    { date: 'Feb', revenue: 920000, target: 850000 },
  ]}
  xKey="date"
  dataKeys={['revenue', 'target']}
  title="Revenue Trend"
  colors={['#3b82f6', '#9ca3af']}
  showLegend
  showGrid
/>
```

### BarChart
```tsx
<BarChart
  data={[
    { name: 'Email', value: 450000 },
    { name: 'Organic', value: 320000 },
  ]}
  title="Revenue by Channel"
  horizontal={false}
/>
```

### PieChart
```tsx
<PieChart
  data={[
    { name: 'Direct', value: 450000 },
    { name: 'Organic', value: 320000 },
  ]}
  title="Channel Distribution"
  showLegend
/>
```

---

## Formatters

```tsx
import { formatCurrency, formatNumber, formatPercent } from './formatters';

formatCurrency(1250000)                    // "$1,250,000.00"
formatCurrency(1250000, { compact: true }) // "$1.25M"

formatNumber(48500)                        // "48,500"
formatNumber(48500, { compact: true })     // "48.5K"

formatPercent(0.125)                       // "12.5%"
formatPercent(3.8, { isRaw: true })        // "3.8%" (value already a percent)
```

---

## Pattern: Cortex Agent Integration

```tsx
// In your ChatAnalytics page
async function sendToCortexAgent(message: string): Promise<ChatResponse> {
  const response = await fetch('/api/cortex-agent', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
  
  const data = await response.json();
  
  return {
    content: data.response,
    data: data.chart_data ? {
      chartType: data.chart_type,
      rows: data.chart_data,
    } : undefined,
  };
}

<ChatAnalytics onSendMessage={sendToCortexAgent} />
```

---

## Pattern: Cortex Analyst Integration

```tsx
// In your DataExplorer page
async function executeWithCortexAnalyst(sql: string): Promise<QueryResult> {
  const response = await fetch('/api/cortex-analyst', {
    method: 'POST',
    body: JSON.stringify({ 
      semantic_model: '@STAGE/model.yaml',
      query: sql,
    }),
  });
  
  const data = await response.json();
  
  return {
    columns: data.columns,
    rows: data.results,
    executionTime: data.query_time_ms,
    rowCount: data.row_count,
  };
}

<DataExplorer onExecuteQuery={executeWithCortexAnalyst} />
```

---

## Customization Checklist

When adapting templates for your solution:

- [ ] Replace sample data with your actual data fetching
- [ ] Update KPI definitions to match your domain
- [ ] Customize suggested questions for your use case
- [ ] Adjust color scheme using design tokens
- [ ] Add your logo to DashboardShell
- [ ] Wire up Cortex Agent/Analyst API calls
- [ ] Update example queries for your schema

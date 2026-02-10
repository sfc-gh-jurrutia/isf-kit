# Visualization Selection Matrix

> Intelligent mapping from demo inputs to visualization recommendations.
> Used by `plan/SKILL.md` Step 5.5 to generate UI strategy.

## Question Pattern → Chart Type

Analyze `sample-questions.yaml` tags to recommend charts.

| Question Tags | Primary Chart | Alternative | When to Use Alternative |
|---------------|--------------|-------------|------------------------|
| `time_series`, `trend` | LineChart | AreaChart | Cumulative/stacked metrics |
| `breakdown`, `group_by` | BarChart | HorizontalBarChart | >5 categories or long labels |
| `distribution`, `percent`, `share` | PieChart | BarChart | >6 segments (use bar instead) |
| `ranking`, `top_n`, `leaderboard` | HorizontalBarChart | BarChart | Vertical space constrained |
| `single_value`, `kpi`, `metric` | KPICard | CrisisKPI | Has threshold/alert condition |
| `comparison`, `vs`, `benchmark` | BarChart | LineChart | Comparing over time |
| `flow`, `journey`, `funnel`, `conversion` | SankeyChart | HorizontalBarChart | Data doesn't have flow structure |
| `relationship`, `network`, `influence` | NetworkGraph | — | Need D3, complex setup |
| `geographic`, `location`, `region` | BarChart (by region) | — | Maps require extra setup |

### Result Type Mapping

From `expected.result_type` in questions:

| result_type | Default Visualization |
|-------------|----------------------|
| `single_value` | KPICard |
| `table` | DataTable + optional chart |
| `chart` | Use `chart_type` field or infer from tags |
| `text` | Text response (no chart) |

---

## Industry × Persona → Page Template

### Page Template Selection

| Persona | Primary Use Case | Recommended Template |
|---------|-----------------|---------------------|
| **Executive / Decision Maker** | KPIs, trends, high-level insights | `ExecutiveDashboard` |
| **Business Analyst** | Exploratory queries, ad-hoc analysis | `ChatAnalytics` or `DataExplorer` |
| **Data Analyst / Scientist** | SQL exploration, detailed data | `DataExplorer` |
| **Operations / Front-line** | Alerts, real-time monitoring | `ExecutiveDashboard` + `CrisisKPI` |
| **Developer / Engineer** | API testing, technical validation | `DataExplorer` |

### Cortex Feature → Template Affinity

| Cortex Feature | Best Template | Why |
|----------------|--------------|-----|
| Cortex Analyst (Text-to-SQL) | `ChatAnalytics` | Natural language interface |
| Cortex Agent | `ChatAnalytics` | Conversational, multi-turn |
| Direct SQL | `DataExplorer` | Query-centric workflow |
| Dashboard only (no NL) | `ExecutiveDashboard` | Pre-built visualizations |

---

## Industry → Theme Configuration

### Industry Overlay Colors

| Industry | Tint Color | CSS Variable | Use For |
|----------|-----------|--------------|---------|
| Retail & CPG | Orange `#f97316` | `industryTints.retail` | Accents, highlights |
| Financial Services | Sky `#0ea5e9` | `industryTints.finance` | Accents, highlights |
| Healthcare & Life Sciences | Teal `#14b8a6` | `industryTints.healthcare` | Accents, highlights |
| Technology / SaaS | Violet `#8b5cf6` | `industryTints.technology` | Accents, highlights |
| Manufacturing | Amber `#f59e0b` | Use `operations` persona | Alert-focused |
| Energy & Utilities | Emerald `#10b981` | Use `analyst` persona | Growth metrics |
| Media & Entertainment | Rose `#f43f5e` | Custom | Engagement metrics |

### Persona Accent Colors

| Persona | Accent Color | CSS Variable | Conveys |
|---------|-------------|--------------|---------|
| Executive (CMO, CEO, VP) | Indigo `#6366f1` | `personaAccents.executive` | Authority, trust |
| Analyst | Emerald `#10b981` | `personaAccents.analyst` | Growth, data-driven |
| Operations | Amber `#f59e0b` | `personaAccents.operations` | Alertness, action |

---

## Executive Components Selection

### When to Use CrisisKPI vs KPICard

Use **CrisisKPI** when:
- [ ] KPI has a defined threshold (target, SLA, budget)
- [ ] Breaching threshold triggers business action
- [ ] Stakeholder expects visual alert on bad values
- [ ] Examples: conversion rate < 2%, inventory < safety stock, error rate > 1%

Use **KPICard** when:
- [ ] Metric is informational (no threshold)
- [ ] Trend matters more than absolute value
- [ ] Examples: total revenue, customer count, average order value

### When to Use TechnicalMetadata

Add **TechnicalMetadata** component when:
- [ ] Audience may question data accuracy
- [ ] Demo needs to prove "real Snowflake data"
- [ ] Executive stakeholders are skeptical
- [ ] Compliance/audit context (show query provenance)

**Placement:** Top-right corner of charts, collapsed by default.

### When to Use Skeleton Loaders

Use **chart-specific skeletons** when:
- [ ] Data fetch takes >500ms
- [ ] Demo will show loading states intentionally
- [ ] Multiple charts load independently

| Chart Type | Skeleton |
|------------|----------|
| SankeyChart | `SkeletonSankey` |
| BarChart | `SkeletonBarChart` |
| LineChart/AreaChart | `SkeletonLineChart` |
| KPICard | `SkeletonKPI` |
| Full dashboard | `SkeletonDashboard` |

---

## Advanced Visualizations

### SankeyChart - Customer Journey / Funnel

**Use when questions include:**
- "How do customers flow through our funnel?"
- "Where do we lose customers?"
- "What's the conversion path?"
- "Show me the customer journey"

**Data requirements:**
- Source → Target → Value structure
- At least 3 stages
- Clear flow direction (left to right)

**Backend support needed:**
- Aggregation query grouping by touchpoints
- Dynamic table recommended for complex flows

### NetworkGraph - Relationships / Influence

**Use when questions include:**
- "How are entities related?"
- "What influences X?"
- "Show connections between..."
- "Map the relationships"

**Data requirements:**
- Nodes with IDs and labels
- Edges with source, target, weight
- Category for node coloring

**Caution:** Complex to implement, use only when explicitly needed.

---

## Dashboard Layout Patterns

### Executive Dashboard Layout

```
┌─────────────────────────────────────────────────────┐
│  Header: Title + Date Range Selector + Refresh      │
├─────────────────────────────────────────────────────┤
│  KPI Grid (4 cards)                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ KPI 1   │ │ KPI 2   │ │ KPI 3   │ │ KPI 4   │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
├─────────────────────────────────────────────────────┤
│  Primary Chart (full width)                         │
│  ┌─────────────────────────────────────────────┐   │
│  │                 LineChart                    │   │
│  │              (main trend)                    │   │
│  └─────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│  Secondary Charts (2x2 grid)                        │
│  ┌──────────────────┐ ┌──────────────────┐         │
│  │    BarChart      │ │    PieChart      │         │
│  └──────────────────┘ └──────────────────┘         │
│  ┌──────────────────┐ ┌──────────────────┐         │
│  │  HorizontalBar   │ │    AreaChart     │         │
│  └──────────────────┘ └──────────────────┘         │
└─────────────────────────────────────────────────────┘
```

**Best for:** Executive persona, quarterly reviews, KPI-focused demos

### Chat + Analytics Layout

```
┌─────────────────────────────────────────────────────┐
│  Header: Title + Connection Status                  │
├───────────────────────┬─────────────────────────────┤
│                       │                             │
│   Chat Interface      │    Analytics Panel          │
│   ┌───────────────┐   │    ┌───────────────────┐   │
│   │ Messages      │   │    │ Dynamic Chart     │   │
│   │               │   │    │ (responds to chat)│   │
│   │               │   │    └───────────────────┘   │
│   ├───────────────┤   │    ┌───────────────────┐   │
│   │ Input         │   │    │ Data Table        │   │
│   └───────────────┘   │    └───────────────────┘   │
│   Suggested Questions │                             │
│                       │                             │
├───────────────────────┴─────────────────────────────┤
│  KPI Summary Row (optional)                         │
└─────────────────────────────────────────────────────┘
```

**Best for:** Cortex Analyst/Agent demos, conversational BI, analyst persona

### Data Explorer Layout

```
┌─────────────────────────────────────────────────────┐
│  Header: Title + Connection + Example Queries       │
├─────────────────────────────────────────────────────┤
│  Query Editor (Monaco/CodeMirror)                   │
│  ┌─────────────────────────────────────────────┐   │
│  │ SELECT * FROM ...                            │   │
│  │                                [Run Query]   │   │
│  └─────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│  Results Panel                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  Tab: Table | Chart | JSON                   │   │
│  │  ┌───────────────────────────────────────┐  │   │
│  │  │     Auto-visualized results           │  │   │
│  │  └───────────────────────────────────────┘  │   │
│  │  Execution time: 142ms | Rows: 1,250        │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Best for:** Data analyst persona, SQL exploration, technical demos

---

## Quick Reference: Tag → Chart Decision Tree

```
START
  │
  ├─ Is it a single metric/KPI?
  │   ├─ Yes + has threshold → CrisisKPI
  │   └─ Yes, no threshold → KPICard
  │
  ├─ Is it time-based?
  │   ├─ Yes + cumulative → AreaChart
  │   └─ Yes, trend only → LineChart
  │
  ├─ Is it a comparison/breakdown?
  │   ├─ Yes + >5 categories → HorizontalBarChart
  │   ├─ Yes + ranking → HorizontalBarChart  
  │   └─ Yes, few categories → BarChart
  │
  ├─ Is it a distribution/share?
  │   ├─ Yes + ≤6 segments → PieChart
  │   └─ Yes + >6 segments → BarChart
  │
  ├─ Is it a flow/journey?
  │   └─ Yes → SankeyChart
  │
  ├─ Is it relationships/network?
  │   └─ Yes → NetworkGraph
  │
  └─ Default → DataTable
```

---

## Implementation Checklist

When applying visualization decisions in implementation:

- [ ] Import correct chart components from `templates/ui/charts`
- [ ] Apply industry tint to theme configuration
- [ ] Apply persona accent to primary colors
- [ ] Use CrisisKPI for metrics with thresholds
- [ ] Add TechnicalMetadata to key charts (if proving data source)
- [ ] Include chart-specific skeleton loaders
- [ ] Wire up data fetching to backend endpoints
- [ ] Test responsive breakpoints for all charts

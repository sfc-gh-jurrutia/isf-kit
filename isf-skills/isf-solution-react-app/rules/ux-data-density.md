# Rule: Minimum Data Density per Page

## Impact: CRITICAL - Prevents chat-only copilot UIs

## Problem

Without enforced minimums, AI-generated ISF solutions default to the simplest possible layout: a sidebar navigation with a chat window. This produces Knowledge-Assistant-level output for AI Copilot and Predictive Analytics archetypes, wasting the ML pipeline, data architecture, and Cortex investment.

## Rule

Every page in an ISF solution must meet the minimum data density for its archetype. Verify these requirements during scaffold review (Step 2) and implementation review (Step 5).

## Density Matrix

| Archetype | Page Template | Min KPIs | Data Table | Min Charts | Agent Sidebar | Detail Section | ML Viz |
|-----------|--------------|----------|------------|------------|---------------|----------------|--------|
| AI Copilot | CommandCenter | 4 | Required | 2 | Required | Required | If ML models exist |
| Operational Dashboard | CommandCenter | 6 | Required | 3 | Optional | Required | If ML models exist |
| Predictive Analytics | CommandCenter | 4 | Required | 2 (inc. 1 ML) | Required | Required | Required |
| Data Quality Monitor | AnalyticsExplorer | 4 | Required | 2 | None | Required | Optional |
| Self-Service Analytics | AnalyticsExplorer | 4 | Required | 1 | None | Optional | Optional |
| Knowledge Assistant | AssistantLayout | 0 | Not required | 0 | N/A | Context panel | Not required |

## What Counts as a "Chart"

Each of these counts as one chart toward the minimum:

- Line / area / bar chart (Recharts, Nivo)
- Heatmap grid
- `RiskFactorPanel` (factor decomposition bars)
- `FeatureImportanceChart` (SHAP horizontal bars)
- Gauge / meter visualization
- Treemap
- Network / DAG (ReactFlow)

These do NOT count:

- KPI stat cards (counted separately)
- Data tables (counted separately)
- Badges and status dots
- Progress bars used as inline indicators in table cells

## Enforcement

### During Scaffold (Step 2)

Before implementing pages, verify the plan meets minimums:

```
Archetype: AI Copilot → CommandCenter template
  [x] KPI strip planned: 6 cards (Flights at Risk, Critical, PAX, Revenue, OTP, Crew)
  [x] Data table planned: Active Flights with 8 columns
  [x] Charts planned: Risk Factor bars + SHAP explainability = 2 charts
  [x] Agent sidebar: yes
  [x] Detail section: yes (entity drill-down)
  [x] ML viz: yes (SHAP from risk model)
```

### During Implementation Review (Step 5)

Count components on each page:

```
Page: Dashboard
  KPIs: 8 (Flights at Risk, Critical Flights, PAX at Risk, Revenue,
         Projected OTP, Crew Timeouts, ATC Impacts, MEL Flights)    → pass (min 4)
  Data table: Active Flights table                                   → pass
  Charts: RiskFactorPanel + FeatureImportanceChart + WeatherImpact   → pass (3 >= 2)
  Agent sidebar: AgentSidebarPanel                                   → pass
  Detail section: slide-up on flight select                          → pass
```

### Failure Mode

If a page does not meet the minimum density:

1. Do NOT proceed to deployment
2. Identify which zones are missing
3. Add the missing components using template components from `templates/components/`
4. Re-verify before continuing

## Examples

### Pass: IROP Network Disruption Intelligence

- 8 KPIs in 2 rows
- Active Flights sortable table
- Risk Factor progress bars + SHAP horizontal bars + Weather Impact map = 3 charts
- Agent sidebar with Chat + Workflow
- Detail section with flight drill-down

### Fail: Bare Chat Copilot

- 0 KPIs
- No data table
- 0 charts
- Chat window occupying entire content area
- No detail section

Fix: Apply CommandCenter template. Add KPI strip from data endpoints, entity data table, detail section with factor/SHAP panels, move chat to agent sidebar.

### Fail: Nav + Chat Only (Agentic Commerce pattern)

- Sidebar navigation with 3 pages
- Each page is just a chat interface with different system prompts
- No data visualization on any page

Fix: Make the landing page a CommandCenter with KPIs and data table. Keep one page as AssistantLayout (with context panel). Add an AnalyticsExplorer page for the analytics view.

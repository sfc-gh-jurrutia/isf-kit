---
name: specify-plan
description: "Create technical architecture plan from demo specification. Use for: architecture decisions, zone patterns, Cortex implementation, component design. Triggers: /speckit.plan, create plan, architecture"
parent_skill: specify
---

# Plan - Technical Architecture Planning

> Analyze a demo specification and produce a technical architecture plan

## When to Load

After `clarify/SKILL.md` has resolved specification ambiguities (or directly after specify if clarification skipped).

## Prerequisites

Files must exist in `specs/{demo-name}/`:
- `spec.md`
- `domain-model.yaml`
- `sample-questions.yaml`

If missing, prompt user to run `/speckit.specify` first.

## Workflow

### Step 1: Load and Validate Spec

```
Reading specification from specs/{demo}/...

✓ spec.md loaded
✓ domain-model.yaml loaded  
✓ sample-questions.yaml loaded

Analyzing requirements...
```

### Step 2: Determine Zone Architecture

```
┌─────────────────────────────────────────────────────────────┐
│   ZONE A (Snowflake Postgres)     ZONE B (Snowflake)       │
│   ┌─────────────────────────┐     ┌─────────────────────┐  │
│   │ • OLTP workloads        │     │ • Analytics/OLAP    │  │
│   │ • User management       │     │ • Cortex AI         │  │
│   │ • Session state         │     │ • Semantic models   │  │
│   │ • Real-time CRUD        │     │ • Large-scale data  │  │
│   └─────────────────────────┘     └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Decision Matrix:**

| Requirement | Zone A Only | Zone B Only | Both Zones |
|-------------|-------------|-------------|------------|
| Simple analytics dashboard | | ✓ | |
| User authentication | ✓ | | |
| Cortex Analyst queries | | ✓ | |
| Session/chat history | ✓ | | |
| Cortex Agent with context | | | ✓ |

### Step 3: Identify Request Patterns

| Pattern | Use For |
|---------|---------|
| A (CRUD) | User login/logout, stateful operations |
| B (Analytics) | Dashboard metrics, read-only aggregations |
| C (RAG) | Chat with context, document Q&A |
| D (Streaming) | Real-time responses, SSE |

### Step 4: Map Cortex Features

```
Does demo need natural language queries?
├─ Yes → Cortex Analyst
│   └─ Multi-turn? → Cortex Agent with Analyst tool
└─ No → Direct SQL or LLM functions

Does demo need document search?
├─ Yes → Cortex Search + RAG pattern
└─ No → Skip search service

Does demo need real-time responses?
├─ Yes → SSE Streaming (Pattern D)
└─ No → Standard JSON responses
```

### Step 5: Present Architecture Analysis

**⚠️ MANDATORY STOPPING POINT**: Present analysis and wait for confirmation.

```
## Architecture Analysis

**Demo**: {name}
**Industry**: {industry}
**Features**: {feature list}

### Recommended Architecture

**Zone Pattern**: {recommendation}
**Request Patterns**: {list}
**Cortex Features**: {implementation approach}

Does this architecture approach look right?

[Yes, continue to UI strategy] [Modify] [Cancel]
```

### Step 5.5: UI Strategy Selection

**Reference**: `templates/ui/visualization-matrix.md` for decision logic.

After architecture is confirmed, analyze questions and recommend visualizations.

#### 5.5.1 Analyze Questions

Read `sample-questions.yaml` and categorize by tags:

| Category | Tags to Look For | Count |
|----------|-----------------|-------|
| Time Series | `time_series`, `trend` | {n} |
| Breakdowns | `breakdown`, `group_by` | {n} |
| Rankings | `ranking`, `top_n` | {n} |
| KPIs | `single_value`, `kpi`, `metric` | {n} |
| Flows | `flow`, `journey`, `funnel` | {n} |
| Distributions | `distribution`, `percent` | {n} |

#### 5.5.2 Determine Recommendations

Apply visualization matrix to generate:

1. **Page Template** - Based on persona + Cortex features:
   - Executive → `ExecutiveDashboard`
   - Analyst + Cortex Agent/Analyst → `ChatAnalytics`
   - Analyst + SQL focus → `DataExplorer`
   - Operations → `ExecutiveDashboard` + `CrisisKPI`

2. **Theme Configuration**:
   - Industry overlay: `industryTints.{industry}`
   - Persona accent: `personaAccents.{persona}`

3. **Chart Mix** - For each question:
   - Map tags → recommended chart type
   - Identify KPIs needing threshold alerts (→ CrisisKPI)
   - Flag flows/journeys needing Sankey

4. **Executive Components**:
   - TechnicalMetadata: Yes if proving data provenance matters
   - CrisisKPI: Yes if any KPI has threshold
   - Skeleton loaders: Yes if data fetch >500ms expected

#### 5.5.3 Present UI Recommendations

**⚠️ MANDATORY STOPPING POINT**: Present recommendations and wait for confirmation.

```
## UI Strategy Recommendation

Based on your inputs:
- **Industry**: {industry}
- **Persona**: {persona}
- **Cortex Features**: {features}
- **Questions**: {breakdown by category}

### Page Template: {template_name}

{Brief description of why this template fits}

### Theme Configuration

| Setting | Value | Rationale |
|---------|-------|-----------|
| Industry Overlay | {industry} ({color}) | Matches target vertical |
| Persona Accent | {persona} ({color}) | Matches primary user role |

### Chart Recommendations

| Question | Tags | Recommended Chart |
|----------|------|-------------------|
| "{q1 text}" | {tags} | {chart_type} |
| "{q2 text}" | {tags} | {chart_type} |
| "{q3 text}" | {tags} | {chart_type} |
| ... | ... | ... |

### KPIs with Thresholds

{If any KPIs have business thresholds, list them for CrisisKPI treatment}

| KPI | Threshold | Alert Condition |
|-----|-----------|-----------------|
| {kpi_name} | {value} | {when to alert} |

### Executive Components

- [ ] TechnicalMetadata: {Yes/No} - {rationale}
- [ ] CrisisKPI: {Yes/No} - {rationale}
- [ ] Skeleton Loaders: {Yes/No} - {rationale}

### Dashboard Layout

{ASCII diagram of recommended layout}

Does this UI strategy look right?

[Yes, generate plan] [Modify charts] [Modify layout] [Change template] [Cancel]
```

#### 5.5.4 Handle Modifications

If user requests changes:
- **Modify charts**: Ask which question to change, present alternatives from matrix
- **Modify layout**: Show layout options (KPI count, chart grid configuration)
- **Change template**: Present all 3 templates with pros/cons

After confirmation, include UI Strategy in generated plan.

### Step 6: Generate Plan

Upon confirmation, create `specs/{demo-name}/plan.md` with:
- Executive summary
- Architecture decisions
- Component breakdown
- Data flow diagrams
- API specification
- SSE event contract
- **UI Strategy** (page template, theme, chart selections, executive components)
- Implementation sequence

## Stopping Points

- ✋ After presenting architecture analysis (Step 5) - confirm before UI strategy
- ✋ After presenting UI strategy recommendations (Step 5.5) - confirm before generating plan

## Output

```
✓ Created specs/{demo}/plan.md

Plan Summary:
- {X} frontend components
- {Y} backend services  
- {Z} database objects
- {N} API endpoints

Next step: Run `/speckit.tasks` to generate implementation checklist
```

## Next Skill

After completion → Load `tasks/SKILL.md`

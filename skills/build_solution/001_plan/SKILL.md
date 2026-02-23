---
name: build-plan
description: "Create technical architecture plan from solution specification. Use for: architecture decisions, zone patterns, Cortex implementation, component design. Triggers: /speckit.plan, create plan, architecture"
parent_skill: build_solution
---

# Plan - Technical Architecture Planning

> Analyze a solution specification and produce a technical architecture plan

## When to Load

After `build_solution/SKILL.md` has validated spec artifacts (Step 1).

## Prerequisites

Files must exist in `specs/{solution-name}/`:
- `spec.md`
- `domain-model.yaml`
- `sample-questions.yaml`

If missing, prompt user to run `specify_solution` first.

## Workflow

### Step 1: Load and Validate Spec

```
Reading specification from specs/{solution}/...

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
Does solution need natural language queries?
├─ Yes → Cortex Analyst
│   └─ Multi-turn? → Cortex Agent with Analyst tool
└─ No → Direct SQL or LLM functions

Does solution need document search?
├─ Yes → Cortex Search + RAG pattern
└─ No → Skip search service

Does solution need real-time responses?
├─ Yes → SSE Streaming (Pattern D)
└─ No → Standard JSON responses
```

### Step 5: Present Architecture Analysis

**⚠️ MANDATORY STOPPING POINT**: Present analysis and wait for confirmation. In Express mode, if architecture is straightforward (Zone B only, single pattern), auto-confirm and proceed.

```
## Architecture Analysis

**Solution**: {name}
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

### Step 6: Generate Plan Files

Upon confirmation, create plan artifacts:

**1. `specs/{solution-name}/plan.md`** with:
- Executive summary
- Architecture decisions
- Component breakdown
- Data flow diagrams
- API specification
- SSE event contract
- **UI Strategy** (page template, theme, chart selections, executive components)
- Implementation sequence

**2. `specs/{solution-name}/prompt_plan.md`** with reasoning capture:

**Load** `templates/prompt-plan-template.md` for structure.

**Include in prompt_plan.md:**
- All intake answers with interpretation
- Architecture decision rationale
- Feature inclusion/exclusion reasoning
- Zone pattern justification
- UI strategy reasoning
- Prompts used for generation

### Step 7: Generate Task Checklist

Using the architecture decisions and component breakdown from the plan, generate an implementation task checklist. This runs immediately after plan generation — no separate skill load required.

#### 7.1 Extract Architecture Decisions

From the plan just generated, extract:
- Zones used (A, B, or both)
- Patterns used (CRUD, Analytics, RAG, Streaming)
- Cortex features (Analyst, Agent, Search)
- Components (frontend pages, backend services, database tables)
- Multi-tenancy requirements

#### 7.2 Generate Task Categories

**Foundation (F)**: Setup, configuration, infrastructure
**Database (D)**: Schema creation, data loading, Cortex setup
**Backend (B)**: API development, service implementation
**Frontend (U)**: UI components and pages
**Integration (I)**: E2E testing, polish, documentation

#### 7.3 Present Task Summary

**⚠️ MANDATORY CHECKPOINT**: Present summary before generating. Auto-proceed in Full Auto mode or Express mode, pause otherwise.

```
## Task Generation Summary

**Architecture**: {zone pattern}
**Patterns**: {patterns used}
**Cortex**: {features}

### Tasks by Category

| Category | Count | Key Deliverables |
|----------|-------|------------------|
| Foundation | {n} | Project setup, connections |
| Database | {n} | Schemas, data, Cortex objects |
| Backend | {n} | API endpoints, services |
| Frontend | {n} | Pages, components |
| Integration | {n} | Testing, polish, docs |

### Excluded (not needed)
- {tasks not required for this solution}

Generate task checklist?

[Yes] [Modify] [Cancel]
```

#### 7.4 Generate Task File

Upon confirmation, create `specs/{solution-name}/tasks.md` with:

- Tasks grouped by phase
- Dependencies marked (`Depends on: F1, D2`)
- Checkpoints at phase boundaries
- Code snippets for key implementations
- Quick reference (start commands, key files)

**Task Dependency Order:**
```
F1 → F2 → D1, D2 → D3 → D4
         ↓
B1 → B2 → B3, B4, B5 → B6
         ↓
U1 → U2 → U3, U4, U5 → U6
                    ↓
               I1 → I2 → I3
```

#### Conditional Tasks

| Condition | Include Tasks |
|-----------|---------------|
| Zone A used | D1 (Zone A schema), B3 (Auth) |
| Zone B used | D2, D4, B4, B5 |
| RAG pattern | B6 (RAG endpoints) |
| Streaming | B5 streaming, U5 SSE |
| Multi-tenant | Tenant provisioning tasks |

## Stopping Points

- ✋ **Required** after presenting architecture analysis (Step 5) - confirm before UI strategy
- ✋ **Required** after presenting UI strategy recommendations (Step 5.5) - confirm before generating plan
- ✋ **Checkpoint** after task summary (Step 7.3) - auto-proceed in Full Auto mode

## Output

```
✓ Created specs/{solution}/plan.md
✓ Created specs/{solution}/prompt_plan.md
✓ Created specs/{solution}/tasks.md

Plan Summary:
- {X} frontend components
- {Y} backend services
- {Z} database objects
- {N} API endpoints

Task Summary:
- Phase 1 (Foundation): {n} tasks
- Phase 2 (Database): {n} tasks
- Phase 3 (Backend): {n} tasks
- Phase 4 (Frontend): {n} tasks
- Phase 5 (Integration): {n} tasks

Next step: Run `/speckit.quality-gate` to validate before implementation
```

## Next Skill

After completion → Load `002_quality_gate/SKILL.md`

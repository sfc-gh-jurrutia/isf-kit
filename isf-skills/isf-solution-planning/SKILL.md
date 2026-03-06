---
name: isf-solution-planning
description: >
  Plan and orchestrate ISF solution projects. Takes a curated isf-context.md
  and produces an architecture plan, task breakdown, and scaffolded project.
  Use when: (1) starting a new ISF solution project, (2) determining which
  skill to use for a task, (3) planning implementation phases, (4) scaffolding
  a project from spec, or (5) reviewing critical constraints.
parent_skill: isf-solution-engine
---

# ISF Solution Planning

## Quick Start

### What Does This Skill Do?

Takes a curated `isf-context.md` (output of `isf-spec-curation`) and produces:
1. An architecture plan mapping ISF components to implementation tasks
2. A task breakdown ordered by dependency
3. A scaffolded project directory following the ISF standard structure

### Input

A populated `isf-context.md` in `specs/{solution}/`. At minimum needs:
- Industry and customer context (T1 fields)
- At least one business objective
- Snowflake features identified
- `isf_context.solution_archetype`

If the spec is incomplete, direct the user to run `isf-spec-curation` first.

**Optional input:** `specs/{solution}/industry-skills.md` from `isf-skill-discovery`. If present, load each approved industry skill's `SKILL.md` for domain context during architecture planning. Map industry skill capabilities to pipeline phases in `tasks.md`:

```
Example tasks.md entry:
  Phase: Data Architecture
  Primary skill: isf-data-architecture
  Companion: energy-data-patterns (provides entity schemas)
```

## Core Workflow

```
1. LOAD SPEC
   └── Read isf-context.md from specs/{solution}/
   └── Validate T1 fields are populated
   └── Validate `isf_context.solution_archetype` is set
   └── Extract architecture, features, personas, data model, runtime contract

2. PLAN ARCHITECTURE
   └── Treat `isf_context.solution_archetype` as the upstream source of truth
   └── Map Snowflake features (FT-xxx) to implementation components
   └── Design data flow: source → landing → transform → curated
   └── Select Cortex features based on use cases (UC-xxx)
   └── Define API surface (FastAPI endpoints)
   └── **PLAN UI STRATEGY** (REQUIRED — see section below)
   └── Define the shared runtime env contract for local dev + SPCS deployment
   └── Generate architecture diagram (Mermaid)
   ⚠️ STOP: Present architecture plan (including UI strategy) for review before task breakdown.

3. BREAK DOWN TASKS
   └── Group by workstream: Data, AI/Cortex, App, Deploy
   └── Order by dependency (data before AI, AI before app)
   └── Assign ISF skill per task
   └── Estimate effort per phase
   ⚠️ STOP: Present task list for approval before scaffolding.

4. SCAFFOLD PROJECT
   └── Create project directory from standard structure
   └── Generate Makefile with project-specific targets
   └── Create deploy/setup.sql from architecture plan
   └── Create `.env.example` from `implementation.runtime_contract`
   └── Create `specs/{solution}/pipeline-state.yaml` with Phase 2 marked complete
   └── Populate docs/ with architecture spec stubs
   └── Initialize schemachange migrations directory

5. OUTPUT
   └── plan.md (architecture + decisions)
   └── tasks.md (ordered task list with skill assignments)
   └── Scaffolded project directory
```

## Skill Index

### By Phase

| Phase | ISF Skill | Purpose |
|-------|-----------|---------|
| **Spec** | `isf-spec-curation` | Curate requirements into isf-context.md |
| **Plan** | `isf-solution-planning` (this skill) | Architecture, tasks, scaffold |
| **Style** | `isf-solution-style-guide` | Colors, accessibility, tokens |
| **Data** | `isf-data-architecture` → `isf-data-generation` | Schema design + synthetic data |
| **Cortex** | `isf-cortex-agent` / `isf-cortex-analyst` / `isf-cortex-search` | AI features |
| **App** | `isf-solution-react-app` | React + FastAPI application (SPCS) |
| **Notebook** | `isf-notebook` | ML notebooks with GPU support |
| **Deploy** | `isf-deployment` | SPCS deployment |
| **Test** | `isf-solution-testing` | Validation and quality gates |
| **Package** | `isf-solution-package` | Presentations, blog, video |

### By Task

| Task | ISF Skill |
|------|-----------|
| Curate solution requirements | `isf-spec-curation` |
| Plan architecture and tasks | `isf-solution-planning` |
| Database schema (schemachange migrations) | `isf-solution-planning` (scaffold) |
| Synthetic data with seed=42 | `isf-data-generation` |
| Cortex Agent (multi-tool orchestration) | `isf-cortex-agent` |
| Semantic model (text-to-SQL) | `isf-cortex-analyst` |
| RAG / document search | `isf-cortex-search` |
| React + FastAPI application | `isf-solution-react-app` |
| ML / DS notebooks | `isf-notebook` |
| SPCS container deployment | `isf-deployment` |
| Full test cycle | `isf-solution-testing` |
| Architecture diagrams, presentations | `isf-solution-package` |

## Solution Archetypes

When planning, match the user's requirements to a known archetype. Each archetype activates a subset of skills and determines the critical path.

| Archetype | Description | Key Skills Activated | Cortex Features |
|-----------|-------------|---------------------|----------------|
| **AI Copilot** | Chat-first UI with multi-tool agent, RAG search, analytics | All Cortex skills + React | Agent, Analyst, Search |
| **Operational Dashboard** | Real-time monitoring with alerts, KPIs, parameter tracking | Data arch, React, **Agent**, deployment | Agent, Analyst |
| **Predictive Analytics** | ML models with explainability, what-if scenarios | ML models, notebook, data arch, **Agent**, React | Agent, Analyst |
| **Data Quality Monitor** | Validation rules, anomaly detection, lineage tracking | Data arch, data gen, testing, deployment | Agent (optional) |
| **Self-Service Analytics** | Semantic model for natural-language SQL, no custom UI | Data arch, Cortex Analyst, deployment | Analyst |
| **Knowledge Assistant** | Document search with RAG, domain knowledge base | Industry context, Cortex Search, Agent, React | Search, Agent |

**Record the chosen archetype in `plan.md` exactly as written in `isf-context.md`** — it determines which skills run and in what order. Downstream skills consume this choice; they do not re-decide it.

### Archetype → Skill Activation

```
AI Copilot (most skills):
  data-arch → data-gen → industry-context → cortex-analyst → cortex-search → ml-models → cortex-agent → react-app → deployment

Operational Dashboard:
  data-arch → data-gen → cortex-analyst → cortex-agent → react-app → deployment

Predictive Analytics:
  data-arch → data-gen → ml-models → cortex-analyst (ML view) → cortex-agent → react-app → deployment

Knowledge Assistant:
  data-arch → industry-context → cortex-search → cortex-agent → react-app → deployment
```

### Task Parallelism

Within the Cortex phase, several skills are independent and can run in parallel:

```
                    ┌─── isf-cortex-analyst ───┐
data-generation ───┤                           ├── isf-cortex-agent
                    ├─── isf-cortex-search  ───┤
                    ├─── isf-python-udf     ───┤
                    └─── isf-ml-models      ───┘
```

The agent depends on all Cortex services being ready. Everything upstream of this fan-out is sequential; everything downstream of the fan-in (agent → app → deploy) is also sequential.

**Record parallel branches in `tasks.md`** — note which tasks can execute concurrently.

## Architecture Planning

### Data Flow Design

Map the `isf-context.md` data model to implementation:

```
Source Systems (isf-context.data_model.source_systems)
  ↓
Landing Zone (src/database/migrations/ — bronze/raw tables)
  ↓
Transform Layer (src/database/migrations/ — silver/cleansed views + procs)
  ↓
Curated Layer (src/database/migrations/ — gold/data mart)
  ↓
Cortex Layer (src/database/cortex/ — agent, Semantic View specs, search)
  ↓
API Layer (api/ — FastAPI endpoints proxying Cortex)
  ↓
UI Layer (src/ui/ — React consuming API)
```

### Cortex Feature Selection

| Need | Component | ISF Skill |
|------|-----------|-----------|
| Natural language to SQL | Cortex Analyst + Semantic Views | `isf-cortex-analyst` |
| Document search / RAG | Cortex Search Service | `isf-cortex-search` |
| Multi-tool AI orchestration | Cortex Agent | `isf-cortex-agent` |
| Text classification, summarization | Cortex LLM Functions | Inline (no dedicated skill) |
| ML training / feature engineering | Snowpark ML + Notebooks | `isf-notebook` |

### Application Type

All ISF solutions use React + FastAPI deployed to SPCS.

| Use Case | Choice | ISF Skill |
|----------|--------|-----------|
| Copilot / chat-first UI | React + FastAPI | `isf-solution-react-app` |
| Complex multi-panel analytics | React + FastAPI | `isf-solution-react-app` |
| Operational dashboard | React + FastAPI | `isf-solution-react-app` |
| ML training / exploration | Snowflake Notebook | `isf-notebook` |
| GPU / distributed training | Notebook with Container Runtime | `isf-notebook` |

## UI Strategy (REQUIRED in plan.md)

Every `plan.md` MUST include a **UI Strategy** section. This section is consumed by `isf-solution-react-app` to enforce data-rich layouts and prevent chat-only UIs. Omitting this section is a planning failure.
Planning is the sole owner of page-template, route, and activation-path decisions.

### What to Specify

| Field | Description | Example |
|-------|-------------|---------|
| **Page template** | One of: `CommandCenter`, `AnalyticsExplorer`, `AssistantLayout` (from `isf-solution-react-app/references/page-templates.md`) | `CommandCenter` |
| **KPI definitions** | 4-8 metrics with: label, source query/table, unit, critical threshold | `Flights at Risk` from `DATA_MART.FLIGHT_RISK_SUMMARY`, threshold > 50 |
| **Data table entity** | Primary entity type, columns, status field, sort default | `Active Flights`: flight_id, route, status, risk_score, pax, revenue |
| **Chart assignments** | Which visualizations to include and their data sources | `RiskFactorPanel` from factor decomposition view; `FeatureImportanceChart` from ML.GLOBAL_FEATURE_IMPORTANCE |
| **Detail section panels** | What appears on entity drill-down | Risk factors, weather impact, SHAP explainability |
| **Agent sidebar** | Whether agent sidebar is included, what tools it exposes | Yes -- Cortex Agent with Analyst + Search tools |
| **Runtime contract** | Local env vars, SPCS env vars, persona-to-agent env mapping | `CORTEX_AGENT_PERSONA_OPERATIONAL=MY_SOLUTION_OPERATIONAL_AGENT` |

### Template for plan.md

```markdown
## UI Strategy

### Page Template: CommandCenter

### KPI Strip (6 cards)
| Metric | Source | Unit | Critical Threshold |
|--------|--------|------|--------------------|
| Flights at Risk | DATA_MART.RISK_SUMMARY.AT_RISK_COUNT | count | > 50 |
| Critical Flights | DATA_MART.RISK_SUMMARY.CRITICAL_COUNT | count | > 0 |
| Passengers at Risk | DATA_MART.RISK_SUMMARY.PAX_AT_RISK | count | > 10000 |
| Revenue Exposure | DATA_MART.RISK_SUMMARY.REVENUE_EXPOSURE | USD | > $100K |
| Projected OTP | DATA_MART.OTP_METRICS.PROJECTED_OTP | % | < 80% |
| Crew Timeouts | DATA_MART.CREW_METRICS.TIMEOUT_COUNT | count | > 100 |

### Data Table: Active Flights
- Entity: FLIGHT
- Columns: flight_id, route, status (badge), risk_score, pax_count, elite_count, revenue
- Default sort: risk_score DESC
- Status badge map: { "Delayed": "danger", "On Time": "success", "Hidden": "warning" }

### Charts
1. RiskFactorPanel — factor decomposition from FLIGHT_RISK_FACTORS view
2. FeatureImportanceChart — SHAP from ML.GLOBAL_FEATURE_IMPORTANCE (risk model)
3. Weather impact visualization — domain-specific route + severity map

### Detail Section (on flight select)
- Entity header: flight ID, route badges, status
- Left panel: RiskFactorPanel (Weather, Crew, Aircraft, Connections, ATC)
- Center panel: Weather Risk Impact (route map + risk contribution)
- Right panel: FeatureImportanceChart (per-flight SHAP from ML.PREDICTION_EXPLANATIONS)

### Agent Sidebar
- Template: AgentSidebarPanel (Chat + Workflow tabs)
- Agent: IROP_INTELLIGENCE_AGENT
- Tools: Cortex Analyst (flight queries), Cortex Search (procedures/manuals)
- Context injection: selected flight ID prepended to prompts
```

### Archetype → Template Mapping

| Archetype | Template | Min KPIs | Data Table | Charts | Agent |
|-----------|----------|----------|------------|--------|-------|
| AI Copilot | CommandCenter | 4 | Required | 2 | Required |
| Operational Dashboard | CommandCenter | 6 | Required | 3 | Required |
| Predictive Analytics | CommandCenter | 4 | Required | 2 (inc. ML) | Required |
| Data Quality Monitor | AnalyticsExplorer | 4 | Required | 2 | Optional |
| Self-Service Analytics | AnalyticsExplorer | 4 | Required | 1 | None |
| Knowledge Assistant | AssistantLayout | 0 | Optional | 0 | Required |

If the archetype is AI Copilot, Operational Dashboard, or Predictive Analytics but the UI Strategy specifies fewer than 4 KPIs or no data table, **reject the plan** and add the missing elements before proceeding.
If `plan.md` omits the page template or runtime contract, **reject the plan** and fill those fields before any app or deploy work begins.

### PLAN PERSONA PAGES (Multi-Persona Solutions)

When the solution has multiple personas (Strategic, Operational, Technical), plan separate pages for each persona. Map each persona's STAR "Situation" to a page template and route.

| Persona Level | Page Template | Variant | Route | Layout Focus |
|---|---|---|---|---|
| Strategic | CommandCenter | aggregate | `/strategic` | Portfolio-level KPIs, trends, executive summary |
| Operational | CommandCenter | full | `/operational` | Entity-level monitoring, alerts, action tools |
| Technical | AnalyticsExplorer + Agent | hybrid | `/technical` | Deep analytics, ML explainability, model outputs |

Each persona page gets its own `AgentSidebarPanel` configured with the persona's agent. The default landing page is the Operational page (most common user).

**Add to plan.md UI Strategy:**

```markdown
### Persona Pages
| Persona | Route | Template | Agent |
|---------|-------|----------|-------|
| Strategic (VP) | /strategic | CommandCenter aggregate | {SOLUTION}_STRATEGIC_AGENT |
| Operational (Manager) | /operational | CommandCenter full | {SOLUTION}_OPERATIONAL_AGENT |
| Technical (Analyst) | /technical | AnalyticsExplorer + Agent | {SOLUTION}_TECHNICAL_AGENT |
```

Navigation between persona pages uses sidebar nav with persona icons. Each page manages its own agent thread independently.

## Constraints

These apply across all ISF skills:

| Constraint | Rule |
|-----------|------|
| **DDL** | CHECK unsupported; PK/FK/UNIQUE metadata-only; NOT NULL enforced |
| **Migrations** | schemachange versioning: `V{major}.{minor}.{patch}__{description}.sql` |
| **Data** | Pre-generate synthetic data with `seed=42`; commit to repo; never generate at runtime |
| **Secrets** | Never hardcode — `.env` locally, Snowflake secrets in production |
| **Connection** | Use `SNOWFLAKE_CONNECTION_NAME` env var pattern |
| **SPCS** | Readiness probe on `8080/health`; `CPU_X64_XS` default instance |
| **Style** | Load `isf-solution-style-guide` — Snowflake Blue `#29B5E8`, dark theme, no emojis, accessibility-first |
| **Errors** | Fail-fast; no silent failures |
| **HTTP** | Use `httpx` (not `requests`) for async/SSE support |

## Project Structure

See [assets/project-structure.md](assets/project-structure.md) for the full standard layout.

Key directories:

| Directory | Purpose |
|-----------|---------|
| `deploy/` | `setup.sql` (one-time infra) + `spcs/` (Dockerfile, service spec) |
| `src/ui/` | React + TypeScript + Tailwind |
| `src/database/` | schemachange migrations, procs, functions, roles, cortex objects |
| `src/data_engine/` | Generators, loaders, data shape specs |
| `api/` | FastAPI backend (deployed to SPCS) |
| `models/` | Semantic model YAML, cortex-spec.yaml |
| `docs/` | Architecture, data model, integration specs |
| `tests/` | UI (Playwright), API (pytest), Data (dbt tests) |
| `notebooks/` | Snowflake Notebooks (if ML component) |

## Runtime Env Contract

Every scaffolded project must carry one shared env contract from planning through deployment.

| Surface | Required keys |
|---------|---------------|
| Local API runtime | `SNOWFLAKE_CONNECTION_NAME`, `CORTEX_AGENT_DATABASE`, `CORTEX_AGENT_SCHEMA`, persona mappings such as `CORTEX_AGENT_PERSONA_OPERATIONAL` |
| SPCS runtime | `SNOWFLAKE_DATABASE`, `SNOWFLAKE_SCHEMA`, `SNOWFLAKE_WAREHOUSE`, persona mappings such as `CORTEX_AGENT_PERSONA_OPERATIONAL` |
| Optional fallback | `CORTEX_AGENT_NAME` only for single-persona solutions; multi-persona solutions must use persona mappings |

## Pre-Flight Checklist

Before starting implementation:

- [ ] `isf-context.md` curated with T1 fields populated
- [ ] `isf_context.solution_archetype` copied into `plan.md` without reinterpretation
- [ ] Architecture plan reviewed (data flow, Cortex features, API surface)
- [ ] **UI Strategy section in plan.md** — page template selected, KPIs defined, data table specified, charts assigned, detail section planned
- [ ] Runtime env contract captured in `.env.example` and aligned with persona-agent outputs
- [ ] Task breakdown ordered by dependency
- [ ] Project scaffolded from standard structure
- [ ] `deploy/setup.sql` created with database, schemas, roles
- [ ] `src/database/migrations/` initialized for schemachange
- [ ] `.env.example` populated with required variables
- [ ] `Makefile` configured with project-specific targets
- [ ] `isf-solution-style-guide` tokens copied to `src/ui/`
- [ ] No hardcoded credentials in any file
- [ ] `node_modules/`, `logs/`, `.env` in `.gitignore`

## Stopping Points

- After PLAN ARCHITECTURE: approve data flow, Cortex feature selection, API surface, and **UI strategy (page template, KPIs, charts, detail section)**
- After PLAN ARCHITECTURE: approve runtime env contract and persona-to-agent mapping pattern
- After BREAK DOWN TASKS: approve task list and skill assignments before scaffolding

## Output

```
specs/{solution}/
  ├── isf-context.md          # Input (from isf-spec-curation)
  ├── plan.md                 # Architecture plan with Mermaid diagrams + UI Strategy section
  ├── tasks.md                # Ordered task list with skill assignments
  └── pipeline-state.yaml     # Canonical resume state for isf-solution-engine

{project}/                     # Scaffolded project directory
  ├── deploy/
  ├── src/
  ├── api/
  ├── docs/
  ├── tests/
  ├── .env.example
  └── Makefile
```

## Contract

**Inputs:**
- `specs/{solution}/isf-context.md` — Curated spec (from `isf-spec-curation`)

**Outputs:**
- `specs/{solution}/plan.md` — Architecture plan with Mermaid diagrams + **UI Strategy section** (consumed by all downstream skills, especially `isf-solution-react-app`)
- `specs/{solution}/plan.md` — also carries the canonical page-template and runtime env decisions
- `specs/{solution}/tasks.md` — Ordered task list with skill assignments (consumed by `isf-solution-engine`)
- Scaffolded project directory (consumed by all build skills)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Spec is incomplete (missing T1 fields) | Direct user to `isf-spec-curation` to populate required fields |
| Requirements don't fit any archetype | Ask user to clarify the primary use case; consider combining elements from multiple archetypes |
| Archetype missing from spec | Stop and return to `isf-spec-curation`; planning must not infer a new archetype silently |
| App skill wants to pick a different template | Reject the change unless the user approves a `plan.md` update first |
| Scaffolding conflicts with existing files | Ask user if they want to overwrite or merge; back up existing files first |
| Industry skills mapping unclear | Load the industry skill's SKILL.md and check its `provides:` field for capabilities |
| Task dependencies are circular | Review the dependency graph; Cortex skills can run in parallel but Agent depends on all |

## Next Skill

After planning is complete and the project is scaffolded:

**Continue to** `../isf-data-architecture/SKILL.md` to design the database schema and generate migrations.

If running the full ISF pipeline via `isf-solution-engine`, return to the engine for Phase 3.

### Implementation Order

```
1. DATA ARCHITECTURE → isf-data-architecture (schema design + migrations)
2. DATA GENERATION  → isf-data-generation (synthetic seed data)
3. CORTEX           → isf-cortex-analyst + isf-cortex-search + isf-cortex-agent
4. APP              → isf-solution-react-app + isf-solution-style-guide
5. NOTEBOOK         → isf-notebook (if ML component)
6. DEPLOY           → isf-deployment (SPCS)
7. TEST             → isf-solution-testing
8. PACKAGE          → isf-solution-package
```

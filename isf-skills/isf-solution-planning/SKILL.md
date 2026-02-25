---
name: isf-solution-planning
description: >
  Plan and orchestrate ISF solution projects. Takes a curated isf-context.md
  and produces an architecture plan, task breakdown, and scaffolded project.
  Use when: (1) starting a new ISF solution project, (2) determining which
  skill to use for a task, (3) planning implementation phases, (4) scaffolding
  a project from spec, or (5) reviewing critical constraints.
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

If the spec is incomplete, direct the user to run `isf-spec-curation` first.

## Core Workflow

```
1. LOAD SPEC
   └── Read isf-context.md from specs/{solution}/
   └── Validate T1 fields are populated
   └── Extract architecture, features, personas, data model

2. PLAN ARCHITECTURE
   └── Map Snowflake features (FT-xxx) to implementation components
   └── Design data flow: source → landing → transform → curated
   └── Select Cortex features based on use cases (UC-xxx)
   └── Define API surface (FastAPI endpoints)
   └── Generate architecture diagram (Mermaid)
   ⚠️ STOP: Present architecture plan for review before task breakdown.

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
| **Data** | `isf-data-generate` | Synthetic data generation |
| **Cortex** | `isf-cortex-agent` / `isf-cortex-analyst` / `isf-cortex-search` | AI features |
| **App** | `isf-react-app` | React + FastAPI application |
| **Notebook** | `isf-notebook` | ML notebooks with GPU support |
| **Deploy** | `isf-deploy` | SPCS deployment |
| **Test** | `isf-testing` | Validation and quality gates |
| **Package** | `isf-solution-package` | Presentations, blog, video |

### By Task

| Task | ISF Skill |
|------|-----------|
| Curate solution requirements | `isf-spec-curation` |
| Plan architecture and tasks | `isf-solution-planning` |
| Database schema (schemachange migrations) | `isf-solution-planning` (scaffold) |
| Synthetic data with seed=42 | `isf-data-generate` |
| Cortex Agent (multi-tool orchestration) | `isf-cortex-agent` |
| Semantic model (text-to-SQL) | `isf-cortex-analyst` |
| RAG / document search | `isf-cortex-search` |
| React + FastAPI application | `isf-react-app` |
| ML / DS notebooks | `isf-notebook` |
| SPCS container deployment | `isf-deploy` |
| Full test cycle | `isf-testing` |
| Architecture diagrams, presentations | `isf-solution-package` |

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
Cortex Layer (src/database/cortex/ — agent, semantic model, search)
  ↓
API Layer (api/ — FastAPI endpoints proxying Cortex)
  ↓
UI Layer (src/ui/ — React consuming API)
```

### Cortex Feature Selection

| Need | Component | ISF Skill |
|------|-----------|-----------|
| Natural language to SQL | Cortex Analyst + Semantic Model | `isf-cortex-analyst` |
| Document search / RAG | Cortex Search Service | `isf-cortex-search` |
| Multi-tool AI orchestration | Cortex Agent | `isf-cortex-agent` |
| Text classification, summarization | Cortex LLM Functions | Inline (no dedicated skill) |
| ML training / feature engineering | Snowpark ML + Notebooks | `isf-notebook` |

### Application Type

| Use Case | Choice |
|----------|--------|
| Copilot / chat-first UI | React + FastAPI (default) |
| Complex multi-panel analytics | React + FastAPI |
| Interactive exploration app | Streamlit in Snowflake (SiS) |
| ML training / exploration | Snowflake Notebook |
| GPU / distributed training | Notebook with Container Runtime |

React + FastAPI is the default for ISF solutions. SiS is valid for lightweight interactive apps. Both deploy to Snowflake — React via SPCS, SiS natively.

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

## Pre-Flight Checklist

Before starting implementation:

- [ ] `isf-context.md` curated with T1 fields populated
- [ ] Architecture plan reviewed (data flow, Cortex features, API surface)
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

- After PLAN ARCHITECTURE: approve data flow, Cortex feature selection, and API surface
- After BREAK DOWN TASKS: approve task list and skill assignments before scaffolding

## Output

```
specs/{solution}/
  ├── isf-context.md          # Input (from isf-spec-curation)
  ├── plan.md                 # Architecture plan with Mermaid diagrams
  └── tasks.md                # Ordered task list with skill assignments

{project}/                     # Scaffolded project directory
  ├── deploy/
  ├── src/
  ├── api/
  ├── docs/
  ├── tests/
  ├── .env.example
  └── Makefile
```

## Downstream

After planning, implementation follows the task order. Each task maps to an ISF skill:

```
1. DATA
   └── isf-data-generate (synthetic data from isf-context data model)

2. DATABASE
   └── schemachange migrations (from scaffold)

3. CORTEX
   └── isf-cortex-analyst (semantic model)
   └── isf-cortex-search (RAG service)
   └── isf-cortex-agent (multi-tool orchestration)

4. APP
   └── isf-react-app (React + FastAPI from plan.md UI strategy)
   └── isf-solution-style-guide (tokens + accessibility)

5. NOTEBOOK (if ML component)
   └── isf-notebook

6. TEST
   └── isf-testing (data + API + UI)

7. DEPLOY
   └── isf-deploy (SPCS)

8. PACKAGE
   └── isf-solution-package (presentations, blog, video)
```

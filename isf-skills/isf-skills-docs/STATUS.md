# ISF Skills — Comprehensive Workflow Status

Last updated: 2026-02-24

## Workflow Overview

The ISF Solution Generation Engine is an 18-skill workflow that takes customer requirements and produces a fully deployed Snowflake solution with presentation materials.

```mermaid
flowchart TD
  subgraph input [Input Layer]
    SC[isf-spec-curation]
    RS[isf-repo-scanner]
  end

  subgraph plan [Planning Layer]
    SP[isf-solution-planning]
    SG[isf-solution-style-guide]
  end

  subgraph arch [Architecture Layer]
    DA[isf-data-architecture]
    DG[isf-data-generation]
  end

  subgraph build [Build Layer]
    RA[isf-solution-react-app]
    CA[isf-cortex-agent]
    CS[isf-cortex-search]
    CL[isf-cortex-analyst]
    PU[isf-python-udf]
    NB[isf-notebook]
  end

  subgraph deploy [Deploy Layer]
    DP[isf-deployment]
  end

  subgraph quality [Quality Layer]
    ST[isf-solution-testing]
    RP[isf-solution-reflection-persona]
    PC[isf-solution-prepublication-checklist]
  end

  subgraph output [Output Layer]
    PK[isf-solution-package]
  end

  subgraph support [Support]
    DX[isf-diagnostics]
  end

  RS -->|"repo context"| SC
  SC -->|"isf-context.md"| SP
  SG -.->|"tokens + colors"| RA
  SG -.->|"dark theme"| NB
  SP -->|"plan.md + tasks.md"| DA
  DA -->|"entity YAMLs + migrations"| DG
  DA -->|"schema design"| DP
  DG -->|"seed data"| DP
  SP -->|"UI strategy"| RA
  CA --> DP
  CS --> CA
  CL --> CA
  PU --> CA
  RA --> DP
  NB --> DP
  DP --> ST
  ST --> RP
  RP --> PC
  PC --> PK
  DX -.->|"troubleshoot any layer"| deploy
  DX -.->|"troubleshoot any layer"| build
```

## The Pipeline

### Phase 1: Input

The user provides requirements through one of three paths:

| Path | Skill | Input | Output |
|------|-------|-------|--------|
| A: Document Import | `isf-spec-curation` | JSON, PDF, pasted text | Populated `isf-context.md` |
| B: Conversational | `isf-spec-curation` | Interview-style Q&A | Populated `isf-context.md` |
| C: Repo Analysis | `isf-repo-scanner` → `isf-spec-curation` | GitHub URL or local path | Populated `isf-context.md` |

**Key artifact**: `isf-context.md` — a structured YAML specification with T1 (user-provided), T2 (recommended), and T3 (skill-generated) fields covering customer context, stakeholders, requirements, architecture, and implementation.

### Phase 2: Planning

| Skill | Input | Output |
|-------|-------|--------|
| `isf-solution-planning` | `isf-context.md` | `plan.md`, `tasks.md`, scaffolded project directory |
| `isf-solution-style-guide` | — (cross-cutting) | Design tokens, color palette, accessibility rules |

**Key artifact**: Scaffolded project following the ISF standard structure with Makefile, schemachange, SPCS deployment.

### Phase 3: Architecture & Data

| Skill | Input | Output |
|-------|-------|--------|
| `isf-data-architecture` | `isf-context.md` data_model, entity YAMLs | schemachange migrations in `src/database/migrations/` |
| `isf-data-generation` | Entity YAMLs + behavior profiles | Seed CSVs in `src/data_engine/output/` |

**Key artifacts**: Versioned DDL migrations and pre-generated seed data (seed=42, committed to repo).

### Phase 4: Build

| Skill | Input | Output |
|-------|-------|--------|
| `isf-cortex-analyst` | DATA_MART views | `src/database/cortex/semantic_model.yaml` |
| `isf-cortex-search` | Documents/text | `src/database/cortex/search_service.sql` |
| `isf-python-udf` | Business logic requirements | `src/database/functions/*.sql` |
| `isf-cortex-agent` | Analyst + Search + UDFs | `src/database/cortex/agent.sql` |
| `isf-solution-react-app` | `plan.md` UI strategy | `src/ui/` + `api/` |
| `isf-notebook` | ML requirements | `notebooks/*.ipynb` |

**Key artifacts**: Working application code, Cortex objects, and notebooks.

### Phase 5: Deploy

| Skill | Input | Output |
|-------|-------|--------|
| `isf-deployment` | Migrations, seed data, app code, SPCS config | Running SPCS service |

**Stages**: `deploy/setup.sql` → schemachange → seed data load → SPCS (Docker build, push, service create).

### Phase 6: Quality

| Skill | Input | Output | Order |
|-------|-------|--------|-------|
| `isf-solution-testing` | Deployed solution | 8-layer test results | First |
| `isf-solution-reflection-persona` | App + isf-context personas | STAR journey audit | Second |
| `isf-solution-prepublication-checklist` | Full project | Release decision (Ship/No Ship/Conditional) | Third |

### Phase 7: Package

| Skill | Input | Output |
|-------|-------|--------|
| `isf-solution-package` | Completed solution + isf-context | Presentation page, architecture SVGs, blog, LinkedIn blurb, slides, video script |

### Support (Any Phase)

| Skill | Purpose |
|-------|---------|
| `isf-diagnostics` | 8-layer troubleshooting: connection → roles → warehouse → objects → Cortex → SPCS → project structure → migrations |

## Complete Skill Inventory

### 18 Skills

| # | Skill | Lines | Files | Category |
|---|-------|-------|-------|----------|
| 1 | `isf-spec-curation` | 409 | 3 | Input |
| 2 | `isf-repo-scanner` | 184 | 1 | Input |
| 3 | `isf-solution-planning` | 249 | 2 | Planning |
| 4 | `isf-solution-style-guide` | 90 | 3 | Planning (cross-cutting) |
| 5 | `isf-data-architecture` | 266 | 14 | Architecture |
| 6 | `isf-data-generation` | 277 | 10 | Architecture |
| 7 | `isf-cortex-agent` | 279 | 2 | Build (Cortex) |
| 8 | `isf-cortex-analyst` | 236 | 2 | Build (Cortex) |
| 9 | `isf-cortex-search` | 231 | 2 | Build (Cortex) |
| 10 | `isf-python-udf` | 187 | 1 | Build (Cortex) |
| 11 | `isf-solution-react-app` | 201 | 31 | Build (App) |
| 12 | `isf-notebook` | 185 | 5 | Build (ML) |
| 13 | `isf-deployment` | 300 | 5 | Deploy |
| 14 | `isf-solution-testing` | 183 | 5 | Quality |
| 15 | `isf-solution-reflection-persona` | 133 | 1 | Quality |
| 16 | `isf-solution-prepublication-checklist` | 124 | 1 | Quality |
| 17 | `isf-solution-package` | 237 | 9 | Output |
| 18 | `isf-diagnostics` | 178 | 1 | Support |
| | **Total** | **4,148** | **98** | |

## Key Artifacts Across the Pipeline

```
specs/{solution}/
├── isf-context.md               # From isf-spec-curation (the contract)
├── plan.md                      # From isf-solution-planning
├── tasks.md                     # From isf-solution-planning
└── repomix-output.xml           # From isf-repo-scanner (if Path C)

{project}/                        # Scaffolded by isf-solution-planning
├── Makefile                     # Build orchestration
├── .env.example                 # Connection config template
├── deploy/
│   ├── setup.sql                # One-time infra provisioning
│   └── spcs/
│       ├── Dockerfile           # Multi-stage React+FastAPI
│       └── service-spec.yaml    # SPCS service config
├── src/
│   ├── ui/                      # React + TypeScript + Tailwind
│   ├── database/
│   │   ├── migrations/          # schemachange versioned DDL
│   │   ├── functions/           # Python UDFs
│   │   ├── procs/               # Stored procedures
│   │   ├── roles/               # RBAC config
│   │   └── cortex/
│   │       ├── agent.sql
│   │       ├── semantic_model.yaml
│   │       └── search_service.sql
│   └── data_engine/
│       ├── generators/          # Generation scripts
│       ├── loaders/             # COPY INTO scripts
│       ├── specs/               # Data shape specs
│       └── output/              # Pre-generated CSVs + manifest.json
├── api/                         # FastAPI backend
├── models/                      # Semantic models
├── docs/                        # Architecture specs
├── tests/                       # UI + API + data tests
├── notebooks/                   # Snowflake Notebooks (if ML)
└── solution_presentation/       # Package deliverables
```

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| `isf-context.md` is the contract | Structured YAML with T1/T2/T3 tiers replaces flat markdown specs |
| React+FastAPI is default frontend | Consistent pipeline, SPCS deployment, eliminates framework mismatch |
| YAML entity files replace CSVs | 34MB → ~2,000 lines; fits in LLM context; includes generation rules |
| No Snowflake dependency for skills | YAML is source of truth; works offline |
| schemachange for migrations | Versioned DDL, CI/CD compatible |
| Makefile replaces shell scripts | `make deploy`, `make test` — simpler orchestration |
| `setup.sql` for provisioning | One-time SQL, no Terraform/Python provisioning |
| `npx repomix` for repo scanning | No global install; only needs Node.js |
| Entity contribution saves locally | Repo contribution (feature branch + PR) planned for later |
| Skills are modular, not monolithic | Each skill has clear input/output; no nested sub-skills |
| References loaded selectively | Only load entity/pattern files relevant to the spec's industry |
| Hidden discovery is first-class | Data generation verifies the insight; testing validates it; persona reflection checks it's accessible |

## What's Not Built Yet

| Item | Status | Notes |
|------|--------|-------|
| Decision log sidecar | Designed (schema + DDL exist in old `skills/`) | Not wired into isf-skills; needs isf-context integration |
| Entity contribution to repo | Documented in isf-data-architecture | Git automation (branch + PR) not implemented |
| ISF ID catalog | Referenced throughout | No actual catalog of SOL-xxx, UC-xxx, PAIN-xxx values yet |
| CI/CD pipeline | `ci_test_cycle.sh` template exists | No GitHub Actions workflow file |
| Industry YAML files | 9 created | AME and GOV not yet created |

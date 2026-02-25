# ISF Skills — Status & Progress

Last updated: 2026-02-24

## Architecture

```
                    isf-spec-curation (input)
                           |
                    isf-solution-planning (orchestrator)
                           |
              +------------+------------+
              |            |            |
       isf-data-      isf-solution-  isf-diagnostics
       architecture   style-guide    (support)
       (cross-cutting)
              |
       +------+------+
       |             |
  isf-deploy    isf-data-generate
       |             |
       +------+------+
              |
    +---------+---------+---------+
    |         |         |         |
isf-react  isf-      isf-     isf-cortex-
  -app    notebook  streamlit   agent
                                /    \
                        isf-cortex  isf-cortex
                         -analyst    -search
                            \       /
                          isf-python-udf
    |         |
    +---------+
         |
  isf-testing
  isf-persona-reflection
  isf-prepublication
         |
  isf-solution-package
```

## Completed Skills (5)

### isf-spec-curation
- **Purpose**: Generate ISF Solution Specifications from unstructured input
- **What was done**:
  - Rewrote SKILL.md from old `snowflake-demo-drd-generation` copy
  - Merged ISF frontmatter (input_types, industry_scope, isf_components_mapped)
  - 9 spec sections with Title Case names and machine-readable aliases
  - Intake questions mapped to spec sections
  - STAR framework, persona framework, hidden discovery kept from original
  - Snowflake component vocabulary organized by layer
  - Quality checklist rebuilt for 9 sections
  - Downstream skills table (planned ISF skills)
- **Files**:
  - `SKILL.md` (409 lines)
  - `references/isf-context.md` (353 lines) — YAML template with T1/T2/T3 tier annotations
  - `scripts/scripts_suggestion.md` (158 lines) — rewritten for ISF workflow

### isf-solution-planning
- **Purpose**: Plan and orchestrate ISF solution projects from curated spec
- **What was done**:
  - Rewrote SKILL.md from old `snowflake-demo-planning` copy
  - Takes isf-context.md as input, produces plan.md, tasks.md, scaffolded project
  - 5-step workflow: load spec, plan architecture, break down tasks, scaffold, output
  - Skill index mapping phases and tasks to ISF skills
  - Updated project structure to ISF standard (schemachange, Makefile, SPCS, React+FastAPI)
  - Removed Terraform, CloudFormation — uses setup.sql + snow CLI
  - Constraints updated for ISF (schemachange, httpx, style guide)
- **Files**:
  - `SKILL.md` (250 lines)
  - `assets/project-structure.md` (97 lines) — ISF standard project layout

### isf-solution-style-guide
- **Purpose**: Cross-cutting style guide for all ISF skills
- **What was done**:
  - User-created skill (not modified by us)
  - Covers: color palette, accessibility, no-emoji rule, dark theme, documentation style
  - Integration instructions for React, Streamlit, Notebooks, Charts
- **Files**:
  - `SKILL.md` (91 lines)
  - `assets/tokens.css` (26 lines) — CSS design tokens
  - `references/snowflake_color_scheme.md` (25 lines)

### isf-data-architecture
- **Purpose**: Design layered data architectures (RAW -> ATOMIC -> DATA_MART)
- **What was done**:
  - Built from scratch using original `snowflake-demo-data-architecture` as content source
  - Replaced 34MB / 170,000 rows of CSV data dictionaries with compact YAML entity files
  - 10 entity reference files: _core + 9 industries (total ~1,800 lines)
  - Each entity includes columns, types, FK relationships, and generation rules for synthetic data
  - Uses `extends: _core` pattern to eliminate cross-industry redundancy
  - Selective loading pattern: only loads entity files relevant to the spec's industry
  - schemachange migration versioning (not flat numbered SQL)
  - Cortex objects section (agent DDL, semantic model, search service)
  - Entity contribution workflow: save new entities to local YAML, repo contribution planned for later
  - Zero Snowflake dependencies — YAML files are the source of truth
- **Files**:
  - `SKILL.md` (362 lines)
  - `references/entities/_core.yaml` (231 lines) — CUSTOMER, TRANSACTION, PRODUCT, ADDRESS, EVENT
  - `references/entities/financial.yaml` (228 lines) — ACCOUNT, POSITION, TRADE, FRAUD_ALERT
  - `references/entities/healthcare.yaml` (212 lines) — PROVIDER, ENCOUNTER, DIAGNOSIS, CLAIM
  - `references/entities/manufacturing.yaml` (239 lines) — EQUIPMENT, WORK_ORDER, PRODUCTION_RUN, SENSOR_READING, QUALITY_INSPECTION
  - `references/entities/retail.yaml` (193 lines) — ORDER, ORDER_LINE, INVENTORY, STORE
  - `references/entities/aerospace.yaml` (154 lines) — BOOKING, FLIGHT_SEGMENT, AIRCRAFT
  - `references/entities/media.yaml` (143 lines) — CONTENT, SESSION, SUBSCRIPTION
  - `references/entities/telecom.yaml` (136 lines) — SUBSCRIBER, USAGE_RECORD, NETWORK_EVENT
  - `references/entities/energy.yaml` (149 lines) — ASSET, ASSET_READING, OUTAGE, METER
  - `references/entities/public_sector.yaml` (115 lines) — CASE, SERVICE_REQUEST
  - `assets/migration_template.sql` (16 lines)

### isf-diagnostics
- **Purpose**: Troubleshoot Snowflake environment and ISF solution issues
- **What was done**:
  - Rewrote SKILL.md from old `snowflake-diagnostics` copy
  - Expanded from 6 to 8 diagnostic layers (added Cortex, SPCS, project structure, migrations)
  - Output format follows style guide: [OK], [ERROR], [WARN] instead of emojis
  - Folded 3 scenarios from deleted README into SKILL.md
  - Added debug order guidance (Layer 1 up)
  - Deleted redundant README.md
- **Files**:
  - `SKILL.md` (180 lines)

## Remaining Skills (13)

### Build Layer
| Skill | Purpose | Source Material |
|-------|---------|---------------|
| `isf-deploy` | schemachange migrations, SPCS deployment, setup.sql | `skills/build_solution/005_deploy/`, `skills/build_solution/deployment/` |
| `isf-data-generate` | Synthetic data from entity YAMLs + generation rules | `skills/build_solution/003_generate/`, `skills/build_solution/generators/` |
| `isf-react-app` | React+FastAPI scaffold, components, Cortex integration | `skills/build_solution/react-app/` |
| `isf-notebook` | Snowflake Notebooks, GPU, distributed training | `skills/build_solution/notebook/` |
| `isf-streamlit` | Streamlit in Snowflake (secondary to React) | Reference project `snowflake-streamlit` |

### Cortex Layer
| Skill | Purpose | Source Material |
|-------|---------|---------------|
| `isf-cortex-agent` | Multi-tool agent DDL, tool_resources, streaming | `skills/build_solution/cortex-agent/` |
| `isf-cortex-analyst` | Semantic model/view, verified queries | `skills/build_solution/cortex-analyst/` |
| `isf-cortex-search` | RAG pipelines, document parsing, search service | `skills/build_solution/cortex-search/` |
| `isf-python-udf` | UDFs and UDTFs for business logic | New |

### Quality & Packaging
| Skill | Purpose | Source Material |
|-------|---------|---------------|
| `isf-testing` | Test cycle, validation, quality gates | `skills/build_solution/references/testing-spec.md` |
| `isf-persona-reflection` | STAR journey review, persona coverage audit | Reference project `snowflake-demo-reflection-persona` |
| `isf-prepublication` | Pre-ship validation, block-release signals | Reference project `snowflake-demo-prepublication-checklist` |
| `isf-solution-package` | Presentations, blog, video, architecture diagrams | `skills/solution-package/` |

### Utilities (discussed, not yet in isf-skills/)
| Capability | Status |
|-----------|--------|
| `isf-repo-scanner` | Designed in old skills/, needs ISF version |
| Decision log (sidecar) | Schema + DDL created in old skills/, needs wiring into isf-skills/ |

## Design Decisions Made

| Decision | Rationale |
|----------|-----------|
| React+FastAPI is default frontend | Consistent pipeline, SPCS deployment, eliminates Streamlit/React mismatch |
| SiS (Streamlit) is secondary option | Valid for lightweight interactive apps, not the default |
| YAML entity files replace CSVs | 34MB -> ~1,800 lines, fits in LLM context, includes generation rules |
| No Snowflake dependency for skills | YAML is source of truth, Snowflake table is optional project-level enhancement |
| schemachange for migrations | Versioned DDL, CI/CD compatible, replaces flat numbered SQL files |
| Makefile replaces shell scripts | `make deploy`, `make test`, etc. instead of deploy.sh/run.sh/clean.sh |
| setup.sql for provisioning | One-time infra SQL, no Terraform or Python provisioning scripts |
| isf-context.md is the contract | Structured YAML with T1/T2/T3 tiers, replaces flat markdown specs |
| Entity contribution saves locally | Repo contribution (feature branch + PR) planned for later |
| npx repomix for repo scanning | No global install required, only needs Node.js/npm |
| Decision log is sidecar architecture | Observes workflow, never blocks it, local JSONL + optional Snowflake sync |

---
name: isf-repo-scanner
description: >
  Clone and analyze existing repos to extract project context for solution
  specification. Use when: scanning a GitHub repo, analyzing an existing
  demo or solution, reverse-engineering a project into an ISF spec, or
  importing a codebase. Triggers: scan repo, analyze project, reverse
  engineer, import repo.
---

# ISF Repo Scanner

## Quick Start

### What Does This Skill Do?

Takes a GitHub URL or local path, clones the repo, runs `npx repomix` to generate a single-file codebase representation, then analyzes the output to produce structured project context. This feeds into `isf-spec-curation` as an input path.

### Input

- GitHub URL (e.g., `https://github.com/org/repo`)
- Local path (e.g., `/Users/name/projects/my-solution`)
- "Current project" (scan the workspace)

### Output

- Structured project analysis presented to the user
- `repomix-output.xml` archived in specs folder for reference
- Context that feeds into `isf-spec-curation` for spec generation

### Prerequisites

- **Node.js / npm** — required for `npx repomix` (no global install needed)
- **git** — required for cloning remote repos

## Workflow

```
1. ACCEPT INPUT
   └── Detect: GitHub URL, local path, or "current project"

   ⚠️ STOP: Confirm target before cloning/scanning.

2. CLONE (if URL)
   └── git clone --depth 1 {url} /tmp/repo-scan-{slug}

3. RUN REPOMIX
   └── npx repomix --output repomix-output.xml
   └── For large repos: add --ignore "node_modules,dist,build,.next,data/synthetic"

4. ANALYZE
   └── Read repomix-output.xml
   └── Extract structured findings (see Analysis Framework below)

5. PRESENT FINDINGS
   └── Show project analysis to user
   └── Identify gaps and compliance issues

   ⚠️ STOP: Confirm findings before feeding into isf-spec-curation.

6. CLEAN UP
   └── Remove temp clone (if created)
   └── Archive repomix-output.xml in specs/{solution}/
```

## Analysis Framework

### Project Identity

| What | Where to Look | Maps To |
|------|---------------|---------|
| Project name | README title, package.json name, pyproject.toml name | isf-context: solution name |
| Description | README first paragraph, package.json description | isf-context: overview |
| Industry clues | Domain terms, table names, README content | isf-context: industry |

### Framework Detection

| Indicator | Framework | Notes |
|-----------|-----------|-------|
| package.json with react, vite | React + Vite | Default ISF frontend |
| requirements.txt with fastapi | FastAPI | Default ISF backend |
| requirements.txt with streamlit | Streamlit (legacy) | Will convert to React+FastAPI |
| environment.yml with snowflake | Snowflake SiS (legacy) | Will convert to React+FastAPI |
| *.ipynb files | Jupyter notebooks | Notebook component |
| Dockerfile, spec.yaml | SPCS container | Deployment: SPCS |
| nginx.conf + supervisord.conf | Multi-process SPCS | Deployment: nginx reverse proxy pattern |
| Multiple Dockerfiles or docker-compose | Multi-app solution | Multiple SPCS services (copilot, orchestrator) |
| @xyflow/react in package.json | React Flow DAG | Workflow/pipeline visualization |
| WebSocket endpoint in FastAPI | Real-time push | Live monitoring or bidirectional messaging |

### Data Architecture

| Indicator | Extract |
|-----------|---------|
| sql/ directory with numbered files | DDL execution order |
| CREATE TABLE/VIEW statements | Table names, columns, types |
| Schema names (RAW, ATOMIC, *_MART) | Layer architecture |
| Schema named ML with explainability tables | ML explainability layer (SHAP, PDP, calibration) |
| data/ or data/synthetic/ | Seed data patterns |
| seed=42 or similar | Deterministic generation |
| notebooks/ with *.ipynb + environment.yml | ML notebooks (check for GPU runtime) |

### Cortex Features

| Indicator | Feature |
|-----------|---------|
| CREATE AGENT | Cortex Agent |
| semantic_view.yaml, `semantic_views/*.yaml`, or Semantic View DDL | Cortex Analyst |
| CREATE CORTEX SEARCH SERVICE | Cortex Search |
| SNOWFLAKE.CORTEX.COMPLETE() | LLM Functions |
| PARSE_DOCUMENT | Document processing |

### Personas and Documentation

| Indicator | Extract |
|-----------|---------|
| README with "personas" or role titles | Persona definitions |
| DRD or spec documents | Requirements, user stories |
| Page/route names (ExecutiveDashboard, etc.) | UI patterns, persona hints |

### Deployment

| Indicator | Extract |
|-----------|---------|
| deploy.sh in root | Legacy three-script model |
| Makefile | Modern build orchestration |
| deploy/ directory | ISF deployment structure |
| snowflake.yml | Streamlit in Snowflake config |
| SPCS service spec | Container deployment |

## Analysis Output

```
Project Analysis: {project_name}

Identity:
  Name: {name}
  Source: {url or path}
  Industry: {detected or Unknown}
  Description: {extracted description}

Architecture:
  Frontend: {React+FastAPI / Streamlit / None}
  Backend: {FastAPI / None}
  Database: {schema list with layer mapping}
  Deployment: {SPCS / SiS / Manual / None}

Cortex Features Detected:
  Agent: {Found/Not found} — {evidence}
  Analyst: {Found/Not found} — {evidence}
  Search: {Found/Not found} — {evidence}
  LLM Functions: {Found/Not found} — {evidence}

Data Architecture:
  Schemas: {list}
  Tables: {count} ({key tables})
  Seed data: {Yes with seed=X / No}
  Layer pattern: {RAW→ATOMIC→MART / Flat / Other}

Personas:
  {persona}: {source} — {confidence: High/Medium/Low}

ISF Compliance:
  Makefile: {Yes/No}
  schemachange migrations: {Yes/No}
  React + FastAPI: {Yes/No — conversion needed?}
  Seed data pre-generated: {Yes/No}
  No hardcoded credentials: {Yes/No}

Missing for Spec Generation:
  {list of what the LLM will need to fill in}

Recommendations:
  {list of changes needed to meet ISF standards}
```

## Error Handling

- **Clone failure**: "Could not clone {url}. Check the URL and access permissions. Provide a local path instead?"
- **Repomix failure**: "repomix failed. Ensure Node.js/npm is installed. Error: {message}"
- **Empty repo**: "Repo appears empty or has no analyzable code. Switch to conversational intake?"
- **Very large repo**: "Repo is large ({size}). Scanning with filters to exclude build artifacts."
- **Private repo**: "Authentication required. Clone the repo locally first, then provide the local path."

## Next Skill

After the repo analysis is complete:

**Continue to** `../isf-spec-curation/SKILL.md` to transform the analysis into a full ISF Solution Spec.

If running the full ISF pipeline via `isf-solution-engine`, return to the engine for Phase 1.

## Companion Skills

| Skill | Relationship |
|-------|-------------|
| `isf-spec-curation` | Consumes this skill's output as Path C input |
| `isf-solution-planning` | Plans the solution from the generated spec |

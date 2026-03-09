---
name: isf-solution-engine
description: >
  Master orchestrator for the ISF Solution Generation pipeline. Chains 22 skills
  across 8 phases — from unstructured requirements to a fully deployed Snowflake
  solution with presentation materials. Use when: (1) building a complete ISF
  solution end-to-end, (2) starting a new project from requirements or a repo,
  (3) continuing an existing project from any phase, (4) running the full ISF
  pipeline. Triggers: build solution, start ISF project, new solution, run pipeline,
  full build, end-to-end solution.
---

# ISF Solution Engine

## When to Use

This is the **entry point** for building complete ISF solutions. It orchestrates
the full pipeline from requirements intake through deployment and packaging.

Use this skill when the user wants to build a **complete solution**, not just
run a single skill. For individual tasks (e.g., "create a Semantic View"),
invoke the specific skill directly.

## Pipeline Overview

```
Phase 1:   INPUT ─────────── isf-spec-curation
Phase 1.5: DISCOVERY ─────── isf-skill-discovery
Phase 2:   PLAN ──────────── isf-solution-planning
Phase 3: DATA ARCHITECTURE  isf-data-architecture → isf-data-generation
Phase 4: AI / CORTEX ────── isf-industry-context + isf-cortex-analyst + isf-cortex-search + isf-python-udf + isf-ml-models → isf-cortex-agent
Phase 5: APPLICATION ────── isf-solution-react-app (+ isf-solution-style-guide, isf-notebook)
Phase 5.5: PRE-DEPLOY GATE isf-solution-react-app/rules + isf-solution-testing gate
Phase 6: DEPLOY ─────────── isf-deployment
Phase 7: QUALITY ────────── isf-solution-testing → isf-solution-reflection-persona → isf-solution-prepublication-checklist
Phase 8: PACKAGE ────────── isf-solution-package
```

Cross-cutting: `isf-solution-style-guide` (UI tokens), `isf-diagnostics` (troubleshooting any phase)

## Workflow

### Step 1: Determine Starting Point

**Ask** the user where to begin:

```
Where should we start?

1. From scratch — I have requirements, notes, or a repo to analyze
2. I have an isf-context.md — skip to planning
3. I have a plan — skip to a specific build phase
4. Continue from where I left off
```

**Route based on selection:**
- Option 1 → Proceed to Phase 1
- Option 2 → Proceed to Phase 2
- Option 3 → **Ask** which phase, then jump to it
- Option 4 → **Read** `specs/{solution}/pipeline-state.yaml` first, then validate the artifacts for the recorded phase before resuming

---

### Phase 1: Input — Spec Curation

**Goal:** Transform unstructured input into a structured `isf-context.md`.

**Load** `../isf-spec-curation/SKILL.md`

**Actions:**
1. Follow the spec curation workflow (INGEST → RESEARCH → ARCHITECT → CURATE → VALIDATE)
2. Output: `specs/{solution}/isf-context.md` with all 9 sections populated

**⚠️ MANDATORY CHECKPOINT**: Confirm the curated spec with the user before proceeding.

**After completion → Continue to Phase 1.5.**

---

### Phase 1.5: Discovery — Industry Skill Scan

**Goal:** Discover domain-specific skills in the environment that can enhance the solution.

**Load** `../isf-skill-discovery/SKILL.md`

**Actions:**
1. Scan environment for skills matching the industry from `isf-context.md`
2. Present candidates to user for approval
3. Output: `specs/{solution}/industry-skills.md`

**If no industry skills found:** Produces an empty artifact. Pipeline continues normally.

**⚠️ MANDATORY CHECKPOINT**: Confirm discovered skills (or lack thereof) before proceeding.

**After completion → Continue to Phase 2.**

---

### Phase 2: Plan — Architecture & Task Breakdown

**Goal:** Produce an architecture plan, task list, and scaffolded project.

**Load** `../isf-solution-planning/SKILL.md`

**Actions:**
1. Follow the planning workflow (LOAD SPEC → PLAN ARCHITECTURE → BREAK DOWN TASKS → SCAFFOLD)
2. Output: `specs/{solution}/plan.md`, `specs/{solution}/tasks.md`, scaffolded project directory

**⚠️ MANDATORY CHECKPOINT**: Approve the architecture plan and task list before proceeding.

**After completion → Continue to Phase 3.**

---

### Phase 3: Data Architecture & Generation

**Goal:** Design the database schema and generate synthetic seed data.

#### Step 3a: Data Architecture

**Load** `../isf-data-architecture/SKILL.md`

**Actions:**
1. Follow the data architecture workflow (READ SPEC → LOAD ENTITIES → DESIGN LAYERS → GENERATE MIGRATIONS)
2. Output: schemachange migration files in `src/database/migrations/`

**⚠️ MANDATORY CHECKPOINT**: Review generated migrations before proceeding.

#### Step 3b: Data Generation

**Load** `../isf-data-generation/SKILL.md`

**Actions:**
1. Follow the data generation workflow (LOAD ENTITIES → PLAN → SELECT MODE → GENERATE → VALIDATE)
2. Output: seed Parquet files in `src/data_engine/output/`, `manifest.json`

**⚠️ MANDATORY CHECKPOINT**: Verify hidden discovery is present in generated data.

**After completion → Continue to Phase 4.**

---

### Phase 4: AI / Cortex Layer

**Goal:** Build Cortex Analyst, Search, UDFs, ML models, and the orchestrating Agent.

**Parallel execution:** Steps 4a-4d are independent and can run in parallel. Step 4e (Agent) depends on all of them completing first (fan-in).

```
             ┌── 4a: Cortex Analyst ──┐
             ├── 4b: Cortex Search  ──┤
Phase 3 ────▶├── 4c: Python UDFs   ──├──▶ 4e: Cortex Agent ──▶ Phase 5
             └── 4d: ML Models      ──┘
```

Skip any that aren't needed per the plan's archetype.

#### Step 4a: Cortex Analyst (if Semantic Views are needed)

**Load** `../isf-cortex-analyst/SKILL.md`

Output: `src/database/cortex/semantic_views/*.yaml` authored in Git and deployed as Semantic Views in Snowflake

#### Step 4b: Cortex Search (if RAG / document search needed)

First: **Load** `../isf-industry-context/SKILL.md` to generate domain knowledge docs and synthetic narratives.

Then: **Load** `../isf-cortex-search/SKILL.md` to create search services.

Output: `src/database/cortex/search_service.sql`, `docs/`

#### Step 4c: Python UDFs (if custom tools needed)

**Load** `../isf-python-udf/SKILL.md`

Output: `src/database/functions/*.sql`

#### Step 4d: ML Models (if ML notebooks in plan)

**Load** `../isf-ml-models/SKILL.md`

Output: `notebooks/*.ipynb`, ML schema populated

#### Step 4e: Cortex Agent (combines tools from 4a-4d)

**Load** `../isf-cortex-agent/SKILL.md`

**Actions:**
1. Derive tools from persona JTBD (one agent per persona)
2. Generate per-persona agent DDL files
3. Create action tool stored procedures and ML UDFs
4. Deploy agents and run pre-flight checks (verify all referenced objects exist)
5. **Test each persona agent independently:**
   - Send one sample question per tool type (Analyst, Search, Action, ML)
   - Verify correct tool is selected for each question
   - Confirm SSE streaming returns expected event types
   - Validate action tools execute without errors
   - Check that `data_to_chart` produces valid Vega-Lite specs (if configured)
6. Record test results per persona

Output: `src/database/cortex/agent_{persona}.sql` (one per persona), `src/database/cortex/grants.sql`, `src/database/functions/*.sql` (action tools)

**⚠️ MANDATORY CHECKPOINT**: Review per-persona agent specs and test results before proceeding to application layer. **Do NOT proceed to Phase 5 if any persona agent fails its tool routing test.** Fix agent instructions or tool descriptions first.

**After completion → Continue to Phase 5.**

### Critical Path

The longest sequential chain determines minimum timeline:

```
Spec Curation → Planning → Data Architecture → Data Generation → [longest Cortex skill] → Agent → App → Deploy → Test
```

The Cortex fan-out (4a-4d) is where the most time can be saved through parallel execution.

---

### Phase 5: Application Layer

**Goal:** Build the frontend application and any ML notebooks.

#### Step 5a: Style Guide (cross-cutting — load first)

**Load** `../isf-solution-style-guide/SKILL.md`

Copy design tokens to the app directory.

#### Step 5b: React + FastAPI App

**Load** `../isf-solution-react-app/SKILL.md`

Output: `src/ui/` + `api/`

#### Step 5c: Notebooks (if ML component in plan)

**Load** `../isf-notebook/SKILL.md`

Output: `notebooks/*.ipynb`

**⚠️ MANDATORY CHECKPOINT**: Review application code and notebook output before deployment.

**After completion → Continue to Phase 5.5.**

---

### Phase 5.5: Pre-Deploy Gate

**Goal:** Catch fragile runtime failures before anything is shipped to SPCS.

Use the app backend checklist plus the testing gate to verify:
1. Required tables/views and API dependencies exist
2. `/ready` and `/api/agent/warmup` succeed
3. Persona agent env mappings match generated `agent_{persona}.sql` files
4. Backend import paths are deployment-safe (`from app...`)
5. One end-to-end agent smoke call succeeds

**⚠️ MANDATORY CHECKPOINT**: Do not continue to deployment until all five checks pass. If any check fails, return to the owning skill (planning, Cortex, or app) and fix it there.

**After completion → Continue to Phase 6.**

---

### Phase 6: Deploy

**Goal:** Deploy the full solution to Snowflake.

**Load** `../isf-deployment/SKILL.md`

**Actions:**
1. Follow the deployment workflow (setup.sql → schemachange → seed data → SPCS)
2. Build Docker image, push to SPCS, create service → `https://{endpoint}`

**⚠️ MANDATORY CHECKPOINT**: Verify deployment health (`/health` endpoint returns 200).

**If deployment fails:** **Load** `../isf-diagnostics/SKILL.md` for 8-layer troubleshooting.

**After completion → Continue to Phase 7.**

---

### Phase 7: Quality Assurance

**Goal:** Validate the deployed solution across all layers.

#### Step 7a: Testing

**Load** `../isf-solution-testing/SKILL.md`

Run the 8-layer test cycle. All layers must pass before proceeding.

#### Step 7b: Persona Reflection

**Load** `../isf-solution-reflection-persona/SKILL.md`

Audit STAR journeys against personas defined in `isf-context.md`.

#### Step 7c: Pre-Publication Checklist

**Load** `../isf-solution-prepublication-checklist/SKILL.md`

Final gate: Ship / No Ship / Conditional.

**⚠️ MANDATORY CHECKPOINT**: Present quality results and release decision to user.

**If No Ship:** Fix identified issues, re-run failed phases, then return to Step 7a.

**After Ship or Conditional → Continue to Phase 8.**

---

### Phase 8: Package

**Goal:** Create presentation materials and deliverables.

**Load** `../isf-solution-package/SKILL.md`

**Actions:**
1. Generate: presentation page, architecture SVGs, blog, LinkedIn blurb, slides, video script
2. Output: `solution_presentation/` directory

**Pipeline complete.** Present the full deliverable summary to the user.

---

## Resuming Mid-Pipeline

If the user returns to continue a project:

1. **Read** `specs/{solution}/pipeline-state.yaml`
2. **Verify** the recorded `current_phase`, `next_phase`, and latest gate results
3. **Validate** the artifacts required for that recorded phase
4. **Resume** only if both the artifact check and the recorded gate status pass
5. **If the state file is missing or stale**, reconstruct it from the earliest trustworthy artifact and stop for user confirmation

**Resume at the earliest incomplete phase with a passing gate.**

## Pipeline State Contract

The engine should maintain `specs/{solution}/pipeline-state.yaml` as the canonical resume file.

```yaml
solution: my_solution
current_phase: phase_5_5_predeploy_gate
next_phase: phase_6_deploy
artifacts:
  spec: true
  plan: true
  migrations: true
  cortex_agents: true
  app: true
gates:
  phase_2_plan_approved: true
  phase_4_agent_validation: true
  phase_5_5_predeploy_gate: false
last_validated_at: YYYY-MM-DD
resume_notes: "Warmup passes locally; agent smoke call still failing for technical persona."
```

Update this file after every phase checkpoint. File presence alone is not enough to resume.

## Skill Reference

| Phase | Skill Name | Directory |
|-------|-----------|-----------|
| 1 - Input | `isf-spec-curation` | `../isf-spec-curation/` |
| 1 - Input (repo) | `isf-repo-scanner` | `../isf-repo-scanner/` |
| 1.5 - Discovery | `isf-skill-discovery` | `../isf-skill-discovery/` |
| 2 - Plan | `isf-solution-planning` | `../isf-solution-planning/` |
| 2 - Plan (style) | `isf-solution-style-guide` | `../isf-solution-style-guide/` |
| 3 - Data | `isf-data-architecture` | `../isf-data-architecture/` |
| 3 - Data | `isf-data-generation` | `../isf-data-generation/` |
| 4 - RAG Corpus | `isf-industry-context` | `../isf-industry-context/` |
| 4 - Cortex | `isf-cortex-analyst` | `../isf-cortex-analyst/` |
| 4 - Cortex | `isf-cortex-search` | `../isf-cortex-search/` |
| 4 - Cortex | `isf-python-udf` | `../isf-python-udf/` |
| 4 - ML | `isf-ml-models` | `../isf-ml-models/` |
| 4 - Cortex | `isf-cortex-agent` | `../isf-cortex-agent/` |
| 5 - App | `isf-solution-react-app` | `../isf-solution-react-app/` |
| 5 - ML | `isf-notebook` | `../isf-notebook/` |
| 6 - Deploy | `isf-deployment` | `../isf-deployment/` |
| 7 - Quality | `isf-solution-testing` | `../isf-solution-testing/` |
| 7 - Quality | `isf-solution-reflection-persona` | `../isf-solution-reflection-persona/` |
| 7 - Quality | `isf-solution-prepublication-checklist` | `../isf-solution-prepublication-checklist/` |
| 8 - Package | `isf-solution-package` | `../isf-solution-package/` |
| Support | `isf-diagnostics` | `../isf-diagnostics/` |

## Stopping Points

- ✋ After Phase 1: Approve curated `isf-context.md`
- ✋ After Phase 2: Approve architecture plan and task breakdown
- ✋ After Phase 3: Review migrations and verify hidden discovery in seed data
- ✋ After Phase 4: Review Cortex objects + per-persona agent test results
- ✋ After Phase 5: Review application code
- ✋ After Phase 6: Verify deployment health
- ✋ After Phase 7: Release decision (Ship / No Ship / Conditional)
- ✋ After Phase 8: Review final deliverables

## Output

- A complete ISF project that has progressed through curated spec, planning, build, deploy, test, and packaging phases
- Canonical artifacts in `specs/{solution}/` plus the scaffolded project directory for resumed runs

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Resume point is unclear | Read `specs/{solution}/pipeline-state.yaml` first, then validate the artifacts for that phase |
| A downstream skill tries to re-decide an upstream choice | Return to the earliest owning artifact (`isf-context.md` or `plan.md`) and correct it there |
| A quality gate fails | Stop the pipeline, fix the failing phase, and re-run the gate before proceeding |

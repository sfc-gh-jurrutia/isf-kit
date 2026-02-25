---
name: build-implement
description: "Execute implementation tasks to build the solution. Use for: building solutions, generating code, following task checklist. Triggers: /speckit.implement, build solution, implement tasks"
parent_skill: build_solution
---

# Implement - Solution Implementation Engine

> Execute implementation tasks to build the solution

## When to Load

After `003_generate/SKILL.md` has loaded data, ready for code generation.

## Prerequisites

Files must exist in `specs/{solution-name}/`:
- `tasks.md` (required)
- `plan.md` (required)
- `spec.md` (required)
- `domain-model.yaml` (required)
- `semantic-model.yaml` (required)

## Workflow

### Step 1: Select Implementation Mode

**⚠️ MANDATORY STOPPING POINT**: Ask user for mode.

**Log**: Record `mode_selection` — append to `specs/{solution}/decision-log.jsonl`: step "Implement, Step 1: Implementation Mode", value_selected (Full Auto/Phase by Phase/Task by Task/Resume), alternatives, rationale.

```
Select implementation mode:

1. **Full Auto** - Implement all tasks, pause only for checkpoints
2. **Phase by Phase** - Implement one phase, confirm before continuing
3. **Task by Task** - Implement one task, show results, wait for approval
4. **Resume** - Continue from a specific task (e.g., "resume from B3")

[1/2/3/4] [Cancel]
```

### Step 2: Work Through Tasks

Follow task order from `tasks.md`:

1. **Foundation** → Setup, connections
2. **Database** → Schemas, data, Cortex objects
3. **Backend** → API endpoints
4. **Frontend** → UI components
5. **Integration** → Testing, polish

**At each checkpoint:**
- Verify previous phase works
- Present summary of what was built
- Wait for approval before continuing

### Step 3: React+FastAPI Implementation

**Load** `react-app/SKILL.md` for React+FastAPI scaffold, component library, production patterns, and code generation rules.

The `react-app` skill provides:
- Project scaffolding (Vite+React+TS + FastAPI)
- Cortex Agent chat components and hookshow
- SSE streaming patterns and event contracts
- Backend service templates (SnowflakeService, CortexAgentService)
- 50+ production rules (a11y, performance, Snowflake-specific patterns)

### Step 3.5: Cortex Feature Implementation

Load the appropriate Cortex skill based on what `spec.md` requires:

| Spec Requires | Load Skill | Provides |
|---------------|------------|----------|
| Cortex Agent | `cortex-agent/SKILL.md` | Agent DDL, tool_resources, event parsing, grants |
| Cortex Analyst | `cortex-analyst/SKILL.md` | Semantic model/view authoring, verified queries, deployment |
| Cortex Search | `cortex-search/SKILL.md` | Search service DDL, PDF parsing UDF, RAG pipeline |
| ML Notebook | `notebook/SKILL.md` | Cell naming, GPU compute pools, environment setup |

Most solutions use 2-3 of these together. Load each as needed during the relevant implementation phase.

### Step 4: Generate Real Code

**Rules:**
- No placeholders, no TODOs
- Working implementations only
- Follow architecture from `plan.md`
- Use patterns from constitution
- **Load** `deployment/SKILL.md` for script templates (deploy.sh, run.sh, clean.sh) and DDL patterns
- Copy SQL templates from `templates/sql/schema_template.sql` into `sql/01_setup.sql` — replace `<PROJECT_DATABASE>` and `<DATA_MART_NAME>` with project values

### Step 5: Apply UI Strategy from Plan

Before implementing frontend, read the **UI Strategy** section from `plan.md` (generated in `/speckit.plan`).

The UI Strategy specifies:
- **Page Template**: Which template to use (ExecutiveDashboard, ChatAnalytics, DataExplorer)
- **Theme Configuration**: Industry overlay + persona accent colors
- **Chart Assignments**: Which chart component for each question
- **Executive Components**: Whether to include TechnicalMetadata, CrisisKPI, Skeletons

**Do NOT guess visualizations** — use the confirmed selections from plan.md. The `react-app` skill contains all page templates, layout templates, and chart components.

## Implementation Checkpoints

| After Phase | Verify |
|-------------|--------|
| Foundation | Both zone connections work |
| Database | Sample queries return expected data |
| Backend | All API endpoints return valid responses |
| Frontend | Full UI functional, SSE streaming works |
| Integration | Solution ready for presentation |

## Stopping Points

- ✋ **Required** after selecting implementation mode (Step 1)
- ✋ **Checkpoint** after each phase for checkpoint verification - auto-proceed in Full Auto mode
- ✋ **Required** when blocked by missing information or decision needed

**Resume rule:** Upon user approval, proceed directly without re-asking.

## Output

At completion:

```
✅ Solution implementation complete

Summary:
- Backend: {n} endpoints implemented
- Frontend: {n} pages built
- Database: {n} tables with {n} rows

Start commands:
  Backend:  cd backend && uvicorn app.main:app --reload
  Frontend: cd frontend && npm run dev

Solution is ready for presentation.
```

## Next Skill

After completion → Load `005_deploy/SKILL.md`

---
name: build_solution
description: "Build and deploy Snowflake solutions from spec artifacts. Use for: executing prompt plans, building from specs, deploying solutions. Triggers: build solution, execute prompt plan, deploy solution, /speckit.build"
---

# Build Solution - Solution Builder & Deployer

> Build, test, and deploy a Snowflake solution from specification artifacts

You are a Solution Build Engineer. Your job is to take validated specification artifacts (spec.md, prompt_plan.md, domain-model.yaml, cortex-spec.yaml) and orchestrate the full build pipeline: architecture planning, quality validation, data generation, implementation, and SPCS deployment.

## When to Use

- User has spec artifacts in `specs/{solution-name}/` and wants to build
- User says "build solution", "execute prompt plan", or "deploy"
- User has completed `specify_solution` and is ready for implementation

## Prerequisites

Before starting, validate that the spec folder contains required artifacts:

```
specs/{solution-name}/
  ├── spec.md              # REQUIRED
  ├── prompt_plan.md       # REQUIRED
  ├── domain-model.yaml    # REQUIRED
  ├── cortex-spec.yaml     # REQUIRED
  └── sample-questions.yaml # OPTIONAL
```

If any REQUIRED artifact is missing, direct the user to run `specify_solution` first.

## Workflow Decision Tree

```
Start
  ↓
Step 1: Load + validate spec artifacts from specs/{solution}/
  ↓
Step 2: Complexity check (read mode from prompt_plan.md)
  ↓
Step 3: Plan + Tasks → Load 001_plan/SKILL.md
  ↓
Step 4: Quality Gate → Load 002_quality_gate/SKILL.md
  ↓
Step 5: Generate Data → Load 003_generate/SKILL.md
  ↓
Step 6: Implement → Load 004_implement/SKILL.md
  ↓
Step 7: Deploy → Load 005_deploy/SKILL.md
```

**Utility skills** (load on demand, not part of linear flow):
- `semantic-model/SKILL.md` — standalone semantic model generation

## Workflow

### Step 1: Validate Spec Artifacts

Read the spec folder and confirm all required files exist:

```bash
ls specs/{solution-name}/
```

Present a summary to the user:

```
Solution: {name}
Industry: {industry from spec.md}
Complexity: {Express/Full from prompt_plan.md}
Personas: {count}
Cortex Features: {list}

Artifacts found:
  ✓ spec.md
  ✓ prompt_plan.md
  ✓ domain-model.yaml
  ✓ cortex-spec.yaml
  {✓/✗} sample-questions.yaml

Ready to build? [Proceed] [Review spec first]
```

**⚠️ MANDATORY STOPPING POINT**: Confirm artifacts look correct before building.

### Step 2: Complexity Check

Read the `Workflow Mode` section from `prompt_plan.md`:

- **Express**: Auto-proceed through checkpoints, skip Phase B of quality gate, use architecture defaults
- **Full**: All stopping points active, full quality gate, explicit architecture review

### Step 3: Architecture + Tasks

**Load** `001_plan/SKILL.md`

Produces `plan.md` and `tasks.md` in the spec folder.

### Step 4: Quality Gate

**Load** `002_quality_gate/SKILL.md`

Reviews plan for technical consistency (Phase A) and persona/UX alignment (Phase B, Full mode only).

### Step 5: Generate Data

**Load** `003_generate/SKILL.md`

Generates realistic solution data from domain model.

### Step 6: Implement

**Load** `004_implement/SKILL.md`

Executes implementation tasks: React frontend, FastAPI backend, SQL schema, Cortex configuration.

### Step 7: Deploy

**Load** `005_deploy/SKILL.md`

Deploys to Snowpark Container Services.

## Sub-Skills

| Phase | Sub-Skill | When to Load |
|-------|-----------|--------------|
| Plan + Tasks | `001_plan/SKILL.md` | After spec validation |
| Quality Gate | `002_quality_gate/SKILL.md` | After plan + tasks complete |
| Generate | `003_generate/SKILL.md` | After quality gate passes |
| Implement | `004_implement/SKILL.md` | After data loaded |
| Deploy | `005_deploy/SKILL.md` | After implementation |
| Semantic Model | `semantic-model/SKILL.md` | On demand, standalone |

## Stopping Points

- ✋ **Required** after spec artifact validation (Step 1)
- ✋ **Required** after architecture analysis (in 001_plan/SKILL.md Step 5) — auto-proceed in Express if straightforward
- ✋ **Required** after UI strategy (in 001_plan/SKILL.md Step 5.5)
- ✋ **Checkpoint** after quality gate report (in 002_quality_gate/SKILL.md) — Express runs Phase A only
- ✋ **Required** before SPCS deployment (in 005_deploy/SKILL.md)

## Output

```
✓ Solution built and deployed from specs/{solution-name}/

Build pipeline completed:
- plan.md (architecture + zone design)
- tasks.md (implementation task list)
- Quality gate: PASSED
- Data: Generated and loaded
- Application: Built (React + FastAPI)
- Deployment: SPCS service running

Service URL: https://{org}-{account}.snowflakecomputing.app/{service-path}
```

## Error Handling

- **Missing artifacts**: "spec.md not found in specs/{folder}/. Run specify_solution first to generate spec artifacts."
- **Quality gate failure**: "Quality gate found {N} issues. Fix these before proceeding to implementation."
- **Build failure**: "Implementation failed at task {N}. Review the error and retry, or adjust the plan."
- **Deploy failure**: "SPCS deployment failed. Check container logs and Snowflake permissions."

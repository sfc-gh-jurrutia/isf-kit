---
name: specify-tasks
description: "Generate implementation task checklist from technical plan. Use for: breaking down work, dependency ordering, implementation phases. Triggers: /speckit.tasks, create tasks, implementation checklist"
parent_skill: specify
---

# Tasks - Implementation Task Generator

> Generate an actionable implementation checklist from the technical plan

## When to Load

After `plan/SKILL.md` has generated the technical plan.

## Prerequisites

Files must exist in `specs/{demo-name}/`:
- `plan.md` (required)
- `spec.md` (required)
- `domain-model.yaml` (required)

If `plan.md` missing, prompt user to run `/speckit.plan` first.

## Workflow

### Step 1: Load Plan

```
Reading plan from specs/{demo}/plan.md...

✓ Plan loaded
✓ Spec loaded
✓ Domain model loaded

Analyzing architecture decisions...
```

### Step 2: Extract Architecture Decisions

From `plan.md`, extract:
- Zones used (A, B, or both)
- Patterns used (CRUD, Analytics, RAG, Streaming)
- Cortex features (Analyst, Agent, Search)
- Components (frontend pages, backend services, database tables)
- Multi-tenancy requirements

### Step 3: Generate Task Categories

**Foundation (F)**: Setup, configuration, infrastructure
**Database (D)**: Schema creation, data loading, Cortex setup
**Backend (B)**: API development, service implementation
**Frontend (U)**: UI components and pages
**Integration (I)**: E2E testing, polish, documentation

### Step 4: Present Task Summary

**⚠️ MANDATORY STOPPING POINT**: Present summary before generating.

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
- {tasks not required for this demo}

Generate task checklist?

[Yes] [Modify] [Cancel]
```

### Step 5: Generate Task File

Upon confirmation, create `specs/{demo-name}/tasks.md` with:

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

## Conditional Tasks

| Condition | Include Tasks |
|-----------|---------------|
| Zone A used | D1 (Zone A schema), B3 (Auth) |
| Zone B used | D2, D4, B4, B5 |
| RAG pattern | B6 (RAG endpoints) |
| Streaming | B5 streaming, U5 SSE |
| Multi-tenant | Tenant provisioning tasks |

## Stopping Points

- ✋ After presenting task summary (Step 4) - confirm before generating

## Output

```
✓ Created specs/{demo}/tasks.md

Phase Summary:
- Phase 1 (Foundation): {n} tasks
- Phase 2 (Database): {n} tasks  
- Phase 3 (Backend): {n} tasks
- Phase 4 (Frontend): {n} tasks
- Phase 5 (Integration): {n} tasks

Checkpoints defined at each phase boundary.

Next step: Run `/speckit.analyze` to validate before implementation
```

## Next Skill

After completion → Load `analyze/SKILL.md`

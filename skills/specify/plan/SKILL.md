---
name: specify-plan
description: "Create technical architecture plan from demo specification. Use for: architecture decisions, zone patterns, Cortex implementation, component design. Triggers: /speckit.plan, create plan, architecture"
parent_skill: specify
---

# Plan - Technical Architecture Planning

> Analyze a demo specification and produce a technical architecture plan

## When to Load

After `clarify/SKILL.md` has resolved specification ambiguities (or directly after specify if clarification skipped).

## Prerequisites

Files must exist in `specs/{demo-name}/`:
- `spec.md`
- `domain-model.yaml`
- `sample-questions.yaml`

If missing, prompt user to run `/speckit.specify` first.

## Workflow

### Step 1: Load and Validate Spec

```
Reading specification from specs/{demo}/...

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
Does demo need natural language queries?
├─ Yes → Cortex Analyst
│   └─ Multi-turn? → Cortex Agent with Analyst tool
└─ No → Direct SQL or LLM functions

Does demo need document search?
├─ Yes → Cortex Search + RAG pattern
└─ No → Skip search service

Does demo need real-time responses?
├─ Yes → SSE Streaming (Pattern D)
└─ No → Standard JSON responses
```

### Step 5: Present Architecture Analysis

**⚠️ MANDATORY STOPPING POINT**: Present analysis and wait for confirmation.

```
## Architecture Analysis

**Demo**: {name}
**Industry**: {industry}
**Features**: {feature list}

### Recommended Architecture

**Zone Pattern**: {recommendation}
**Request Patterns**: {list}
**Cortex Features**: {implementation approach}

Does this architecture approach look right?

[Yes, generate plan] [Modify] [Cancel]
```

### Step 6: Generate Plan

Upon confirmation, create `specs/{demo-name}/plan.md` with:
- Executive summary
- Architecture decisions
- Component breakdown
- Data flow diagrams
- API specification
- SSE event contract
- Implementation sequence

## Stopping Points

- ✋ After presenting architecture analysis (Step 5) - confirm before generating

## Output

```
✓ Created specs/{demo}/plan.md

Plan Summary:
- {X} frontend components
- {Y} backend services  
- {Z} database objects
- {N} API endpoints

Next step: Run `/speckit.tasks` to generate implementation checklist
```

## Next Skill

After completion → Load `tasks/SKILL.md`

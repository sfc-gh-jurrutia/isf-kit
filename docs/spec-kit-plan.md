# Spec-Driven Demo Framework Plan

> Adapted from [spec-kit](https://github.com/...) methodology for Snowflake demo development

---

## Overview

This plan documents the integration of **Spec-Driven Development (SDD)** into isf-kit for building React + FastAPI + Snowflake demos with Cortex AI capabilities.

### Core Principle

> "Specifications don't serve code—code serves specifications."

Every demo starts with a business scenario specification that drives implementation.

---

## Table of Contents

1. [SDD Workflow](#sdd-workflow)
2. [Tech Stack](#tech-stack)
3. [Cortex Agent Patterns](#cortex-agent-patterns)
4. [Project Structure](#project-structure)
5. [Templates](#templates)
6. [Commands](#commands)
7. [Implementation Checklist](#implementation-checklist)

---

## SDD Workflow

```
/speckit.specify → /speckit.plan → /speckit.tasks → /speckit.implement
```

| Phase | Input | Output | Gate |
|-------|-------|--------|------|
| **Specify** | Business scenario | `spec.md` | User stories clear |
| **Plan** | Specification | `plan.md` | Architecture approved |
| **Tasks** | Plan | `tasks.md` | Dependencies mapped |
| **Implement** | Tasks | Working code | Tests pass |

### Key Concepts

- **User Story Tagging**: `[US1]`, `[US2]` to trace implementation to requirements
- **Priority Levels**: P1 (MVP), P2 (polish), P3 (nice-to-have)
- **Parallel Markers**: `[P]` indicates tasks that can run concurrently
- **Given/When/Then**: Acceptance scenarios drive test cases

---

## Tech Stack

### Frontend
| Component | Technology | Notes |
|-----------|------------|-------|
| Framework | React 18 + Vite | Fast dev server, optimized builds |
| Styling | TailwindCSS | Utility-first, Snowflake branding |
| Charts | Recharts | Snowflake-compatible visualizations |
| State | React Context / Zustand | Keep it simple unless complex |
| HTTP | fetch + SSE | Native streaming support |

### Backend
| Component | Technology | Notes |
|-----------|------------|-------|
| Framework | FastAPI | Async, auto-docs, type hints |
| Snowflake | snowflake-connector-python | Native connection pooling |
| Auth | PAT (Programmatic Access Token) | No OAuth complexity for demos |
| Streaming | SSE (Server-Sent Events) | Cortex Agent responses |

### Database
| Component | Technology | Notes |
|-----------|------------|-------|
| Warehouse | Snowflake | Primary data platform |
| Cortex | Cortex Agent API | AI assistant capabilities |
| Semantic | Cortex Analyst | Natural language → SQL |

---

## Cortex Agent Patterns

### Pattern Comparison

| Aspect | Agent Object | Inline Configuration |
|--------|-------------|---------------------|
| **Endpoint** | `/api/v2/databases/{db}/schemas/{schema}/agents/{name}:run` | `/api/v2/cortex/agent:run` |
| **DDL Required** | Yes (`CREATE CORTEX AGENT`) | No |
| **Persona Support** | Multiple Agent objects needed | Dynamic via request body |
| **Config Changes** | Requires `ALTER` DDL | Per-request flexibility |
| **Use Case** | Production, fixed behavior | Demos, rapid iteration |

### Recommendation

**Default to Inline Configuration** for demos:
- No DDL setup required
- Persona switching without DDL changes
- Faster iteration during development

**Use Agent Object** when:
- Demo needs to show production deployment pattern
- Fixed configuration is a feature
- Multiple apps share same agent

### Authentication Headers

```python
headers = {
    "Authorization": f"Bearer {SNOWFLAKE_PAT}",
    "X-Snowflake-Authorization-Token-Type": "PROGRAMMATIC_ACCESS_TOKEN",
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-Snowflake-Role": "DEMO_ROLE"  # Optional RBAC
}
```

### Inline Configuration Example

```python
body = {
    "messages": [{"role": "user", "content": query}],
    "models": {"orchestration": "claude-4-sonnet"},
    "instructions": {
        "response": "You are a helpful assistant for...",
        "system": "Guidelines for behavior..."
    },
    "tools": [
        {"type": "cortex_analyst_text_to_sql"}
    ],
    "tool_resources": {
        "cortex_analyst_text_to_sql": {
            "semantic_model_file": "@DEMO_DB.PUBLIC.STAGE/semantic_model.yaml",
            "execution_environment": {
                "type": "warehouse",
                "warehouse": "DEMO_WH"
            }
        }
    }
}
```

### Agent Object DDL Example

```sql
CREATE OR REPLACE CORTEX AGENT DEMO_AGENT
  QUERY_ENGINE = 'cortex_analyst_text_to_sql'
  QUERY_ENGINE_TOOLS = (
    'DEMO_DB.PUBLIC.SEMANTIC_MODEL'
  )
  QUERY_ENGINE_TOOL_SPEC = (
    execution_environment => (type => 'warehouse', name => 'DEMO_WH')
  )
  LLM = 'claude-4-sonnet'
  LLM_TOOLS = ('WEB_SEARCH')
  COMMENT = 'Demo assistant agent';
```

---

## Project Structure

```
demo-project/
├── .specify/
│   ├── memory/
│   │   └── constitution.md           # Demo principles
│   ├── templates/
│   │   ├── spec-template.md
│   │   ├── plan-template.md
│   │   ├── tasks-template.md
│   │   ├── data-model-template.md
│   │   └── personas-template.json
│   └── commands/
│       ├── specify.md
│       ├── plan.md
│       ├── tasks.md
│       └── implement.md
├── specs/
│   └── {feature}/
│       ├── spec.md
│       ├── plan.md
│       └── tasks.md
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── routes/
│   │   │   ├── cortex_agent.py
│   │   │   └── data.py
│   │   └── services/
│   │       ├── snowflake_service.py
│   │       └── cortex_service.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Chat.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── hooks/
│   │   │   └── useCortexAgent.ts
│   │   └── services/
│   │       └── api.ts
│   ├── package.json
│   └── Dockerfile
├── snowflake/
│   ├── setup/
│   │   ├── 01_database.sql
│   │   ├── 02_schema.sql
│   │   ├── 03_tables.sql
│   │   ├── 04_roles.sql
│   │   └── 05_cortex_agent.sql    # Optional if using Agent Object
│   ├── semantic_model/
│   │   └── model.yaml
│   └── data/
│       └── sample_data.sql
└── docker-compose.yml
```

---

## Templates

### Constitution (9 Principles)

```markdown
# Demo Development Constitution

1. **Schema-First**: Every demo starts with isolated Snowflake schema
2. **API-First**: FastAPI contracts defined before React components
3. **Contract-First**: DDL + API specs before implementation
4. **Spec-Driven**: Business requirements drive technical decisions
5. **Portable**: No hardcoded credentials, environment-agnostic
6. **Demonstrable**: Every feature has a clear demo narrative
7. **Minimal**: Only build what the spec requires
8. **Testable**: Every user story has acceptance criteria
9. **Documented**: Code serves the specification
```

### Spec Template Sections

1. **Demo Scenario** - Business context and narrative
2. **User Stories** - Prioritized (P1/P2/P3) with acceptance criteria
3. **Data Requirements** - Snowflake objects needed
4. **Cortex Features** - Which AI capabilities to demonstrate
5. **Personas** - If multiple AI assistant personalities needed
6. **Out of Scope** - Explicit boundaries

### Plan Template Sections

1. **Technical Context** - Python, Node, Snowflake versions
2. **Snowflake Objects** - Tables, views, stages, policies
3. **API Routes** - FastAPI endpoint specifications
4. **React Components** - Page and component structure
5. **Cortex Configuration** - Agent pattern choice and config
6. **Project Structure** - Directory layout
7. **Constitution Check** - Verify alignment with principles

### Tasks Template Phases

1. **Phase 1: Snowflake Setup**
   - Database, schema, warehouse
   - Tables and sample data
   - Roles and permissions
   - Semantic model upload

2. **Phase 2: Backend API**
   - FastAPI project structure
   - Snowflake connection service
   - Data routes
   - Cortex Agent routes

3. **Phase 3: Frontend**
   - React project setup
   - Core components
   - API integration
   - Styling

4. **Phase 4: Integration**
   - End-to-end testing
   - Docker containerization
   - Documentation

---

## Commands

### /speckit.specify

**Purpose**: Generate demo specification from business scenario

**Input**: Business problem description
**Output**: `specs/{feature}/spec.md`

**Process**:
1. Ask clarifying questions about demo goals
2. Identify data requirements
3. Extract user stories with priorities
4. Define Cortex feature requirements
5. Generate specification document

### /speckit.plan

**Purpose**: Create technical architecture from specification

**Input**: `specs/{feature}/spec.md`
**Output**: `specs/{feature}/plan.md`

**Process**:
1. Read specification
2. Map user stories to technical components
3. Define Snowflake objects
4. Specify API routes
5. Choose Cortex pattern
6. Run Constitution Check
7. Generate plan document

### /speckit.tasks

**Purpose**: Break plan into implementable tasks

**Input**: `specs/{feature}/plan.md`
**Output**: `specs/{feature}/tasks.md`

**Process**:
1. Read plan
2. Extract implementation items
3. Organize into phases
4. Tag with user story references `[US#]`
5. Mark parallel tasks `[P]`
6. Generate tasks document

### /speckit.implement

**Purpose**: Execute tasks with spec traceability

**Input**: `specs/{feature}/tasks.md`
**Output**: Working code

**Process**:
1. Read tasks
2. Execute each task in order
3. Reference spec for acceptance criteria
4. Validate against constitution
5. Mark tasks complete

---

## Implementation Checklist

### Phase 1: Framework Setup (in isf-kit)

- [ ] Create `.specify/memory/constitution.md`
- [ ] Create `.specify/templates/spec-template.md`
- [ ] Create `.specify/templates/plan-template.md`
- [ ] Create `.specify/templates/tasks-template.md`
- [ ] Create `.specify/templates/data-model-template.md`
- [ ] Create `.specify/templates/personas-template.json`
- [ ] Create `.specify/commands/specify.md`
- [ ] Create `.specify/commands/plan.md`
- [ ] Create `.specify/commands/tasks.md`
- [ ] Create `.specify/commands/implement.md`
- [ ] Create `specs/.gitkeep`
- [ ] Update README with framework docs

### Phase 2: Validation

- [ ] Create sample demo spec using templates
- [ ] Run through full workflow
- [ ] Verify Cursor command integration
- [ ] Test with both Cortex patterns

---

## Reference Implementations

### GroceryIQ App (Agent Object Pattern)
- Location: `/Users/jurrutia/projects/groceryiq_app`
- Pattern: Pre-configured Agent Object via DDL
- Key file: `backend/app/routes/cortex_agent.py`

### Coco-Test (Inline Configuration Pattern)
- Location: `/Users/jurrutia/projects/test-to-delete/coco-test`
- Pattern: Inline configuration with personas
- Key file: `unique-supply-chain-demo/backend/services/cortex_agent_service.py`

---

## Next Steps

1. Implement the framework files in isf-kit
2. Create a sample demo spec to validate the workflow
3. Document integration with existing MCP/SnowSQL setup
4. Test with a real demo scenario

---

*Last updated: February 2026*

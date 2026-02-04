# /speckit.tasks - Implementation Task Generator

> Generate an actionable implementation checklist from the technical plan

You are a Project Planner for Snowflake demos. Your job is to read the technical plan created by `/speckit.plan` and break it down into concrete, implementable tasks with dependencies and priorities.

## Instructions

1. **Read the plan first** - Understand the architecture before creating tasks
2. **Be granular** - Tasks should be completable in a focused session
3. **Order by dependencies** - Foundation before features, backend before frontend
4. **Include verification** - Each phase should have testable checkpoints

## Input Files

Look for these files in `.specify/specs/{demo-name}/`:

| File | Required | Purpose |
|------|----------|---------|
| `plan.md` | ✓ | Technical architecture and components |
| `spec.md` | ✓ | Business requirements |
| `domain-model.yaml` | ✓ | Data entities |

If `plan.md` doesn't exist, prompt user to run `/speckit.plan` first.

---

## Task Categories

### Category 1: Foundation
Setup, configuration, and infrastructure tasks.

```yaml
foundation:
  - id: F1
    name: "Initialize project structure"
    tasks:
      - Create backend directory structure
      - Create frontend directory structure
      - Initialize git repository
      - Create .env.example files
    
  - id: F2
    name: "Configure Snowflake connections"
    tasks:
      - Set up Zone A (Postgres) connection
      - Set up Zone B (Snowflake) connection
      - Test connectivity
      - Create connection utilities
    
  - id: F3
    name: "Set up development environment"
    tasks:
      - Create requirements.txt / pyproject.toml
      - Create package.json
      - Configure linting and formatting
      - Set up pre-commit hooks (optional)
```

### Category 2: Database
Schema creation, data loading, and Cortex setup.

```yaml
database:
  - id: D1
    name: "Create Zone A schema"
    depends_on: [F2]
    tasks:
      - Create users table
      - Create sessions table
      - Create chat_history table
      - Create tenant tables (if multi-tenant)
    
  - id: D2
    name: "Create Zone B schema"
    depends_on: [F2]
    tasks:
      - Create fact tables
      - Create dimension tables
      - Set up relationships/keys
      - Create views for semantic model
    
  - id: D3
    name: "Generate and load demo data"
    depends_on: [D1, D2]
    tasks:
      - Run /speckit.generate
      - Validate row counts
      - Verify referential integrity
      - Test sample queries
    
  - id: D4
    name: "Configure Cortex objects"
    depends_on: [D2, D3]
    tasks:
      - Deploy semantic model
      - Create search service (if needed)
      - Configure agent (if needed)
      - Test Cortex queries
```

### Category 3: Backend
API development and service implementation.

```yaml
backend:
  - id: B1
    name: "Create FastAPI skeleton"
    depends_on: [F1]
    tasks:
      - Set up main.py with CORS
      - Create router structure
      - Set up dependency injection
      - Add health check endpoint
    
  - id: B2
    name: "Implement connection layer"
    depends_on: [B1, F2]
    tasks:
      - Create Zone A connector (asyncpg)
      - Create Zone B connector (snowpark)
      - Implement connection pooling
      - Add error handling
    
  - id: B3
    name: "Implement authentication"
    depends_on: [B2, D1]
    tasks:
      - Create auth router
      - Implement login endpoint
      - Implement session management
      - Add auth middleware
    
  - id: B4
    name: "Implement analytics endpoints"
    depends_on: [B2, D2]
    tasks:
      - Create metrics router
      - Implement dashboard queries
      - Add caching (if needed)
      - Test with sample data
    
  - id: B5
    name: "Implement Cortex endpoints"
    depends_on: [B2, D4]
    tasks:
      - Create query router
      - Implement Analyst integration
      - Add streaming support (SSE)
      - Handle errors gracefully
    
  - id: B6
    name: "Implement RAG endpoints" 
    depends_on: [B3, B5]
    condition: "if RAG pattern used"
    tasks:
      - Create chat router
      - Implement context retrieval (Zone A)
      - Combine with Cortex (Zone B)
      - Stream responses
```

### Category 4: Frontend
UI components and pages.

```yaml
frontend:
  - id: U1
    name: "Create React skeleton"
    depends_on: [F1]
    tasks:
      - Initialize Vite + React + TypeScript
      - Set up Tailwind CSS
      - Create component structure
      - Add routing (React Router)
    
  - id: U2
    name: "Implement API client"
    depends_on: [U1, B1]
    tasks:
      - Create api.ts with fetch wrapper
      - Create sse.ts for streaming
      - Add error handling
      - Set up auth token management
    
  - id: U3
    name: "Implement authentication UI"
    depends_on: [U2, B3]
    tasks:
      - Create Login page
      - Create auth context/provider
      - Add protected route wrapper
      - Handle session expiry
    
  - id: U4
    name: "Implement dashboard"
    depends_on: [U2, B4]
    tasks:
      - Create Dashboard page
      - Build MetricsCard component
      - Build DataTable component
      - Connect to analytics endpoints
    
  - id: U5
    name: "Implement chat interface"
    depends_on: [U2, B5]
    tasks:
      - Create Chat page
      - Build ChatMessage component
      - Build ChatInput component
      - Implement SSE streaming display
    
  - id: U6
    name: "Implement query interface"
    depends_on: [U5]
    tasks:
      - Build QueryResults component
      - Show generated SQL (optional)
      - Display data tables/charts
      - Handle loading/error states
```

### Category 5: Integration & Polish
End-to-end testing, refinement, and documentation.

```yaml
integration:
  - id: I1
    name: "End-to-end testing"
    depends_on: [U3, U4, U5]
    tasks:
      - Test complete user flows
      - Verify all sample questions work
      - Test error scenarios
      - Performance check
    
  - id: I2
    name: "Polish and refinement"
    depends_on: [I1]
    tasks:
      - Fix UI/UX issues
      - Improve error messages
      - Add loading states
      - Responsive design check
    
  - id: I3
    name: "Documentation"
    depends_on: [I1]
    tasks:
      - Update README
      - Document environment setup
      - Create demo script/talking points
      - Record demo video (optional)
```

---

## Output: Task Checklist

Generate `.specify/specs/{demo-name}/tasks.md`:

```markdown
# Implementation Tasks: {Demo Name}

> Generated by /speckit.tasks on {date}

## Overview

| Category | Tasks | Dependencies |
|----------|-------|--------------|
| Foundation | {n} | - |
| Database | {n} | Foundation |
| Backend | {n} | Foundation, Database |
| Frontend | {n} | Backend |
| Integration | {n} | All |

**Total Tasks**: {total}

---

## Phase 1: Foundation

### [F1] Initialize project structure
- [ ] Create backend directory structure
  ```
  backend/
  ├── app/
  │   ├── __init__.py
  │   ├── main.py
  │   ├── routers/
  │   ├── services/
  │   └── connectors/
  ├── requirements.txt
  └── .env.example
  ```
- [ ] Create frontend directory structure
  ```
  frontend/
  ├── src/
  │   ├── pages/
  │   ├── components/
  │   ├── services/
  │   └── App.tsx
  ├── package.json
  └── vite.config.ts
  ```
- [ ] Initialize git repository
- [ ] Create .env.example files

### [F2] Configure Snowflake connections
**Depends on**: F1

- [ ] Set up Zone A (Postgres) connection
  ```python
  # backend/app/connectors/zone_a.py
  # Use asyncpg for async Postgres
  ```
- [ ] Set up Zone B (Snowflake) connection
  ```python
  # backend/app/connectors/zone_b.py
  # Use snowflake-snowpark-python
  ```
- [ ] Test connectivity
- [ ] Create connection utilities

**Checkpoint**: Both connections work, can query each zone

---

## Phase 2: Database

### [D1] Create Zone A schema
**Depends on**: F2

- [ ] Create users table
  ```sql
  CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    -- ...
  );
  ```
- [ ] Create sessions table
- [ ] Create chat_history table
- [ ] Create tenant tables (if multi-tenant)

### [D2] Create Zone B schema
**Depends on**: F2

- [ ] Create tables from domain model:
  {list each table from domain-model.yaml}
- [ ] Set up relationships/keys
- [ ] Create views for semantic model

### [D3] Generate and load demo data
**Depends on**: D1, D2

- [ ] Run `/speckit.generate`
- [ ] Validate row counts match domain model
- [ ] Verify referential integrity
- [ ] Test sample queries from spec

**Checkpoint**: All tables populated, sample queries return expected results

### [D4] Configure Cortex objects
**Depends on**: D2, D3

- [ ] Deploy semantic model
  ```sql
  CREATE OR REPLACE STAGE {demo}_stage;
  PUT file://semantic-model.yaml @{demo}_stage;
  ```
- [ ] Test Cortex Analyst queries
  {list sample questions}
- [ ] Create search service (if RAG)
- [ ] Configure agent (if needed)

**Checkpoint**: Natural language queries work against demo data

---

## Phase 3: Backend

### [B1] Create FastAPI skeleton
**Depends on**: F1

- [ ] Set up main.py with CORS
- [ ] Create router structure
- [ ] Set up dependency injection
- [ ] Add health check endpoint

### [B2] Implement connection layer
**Depends on**: B1, F2

- [ ] Create Zone A connector
- [ ] Create Zone B connector
- [ ] Implement connection pooling
- [ ] Add error handling

### [B3] Implement authentication
**Depends on**: B2, D1

- [ ] Create auth router (`/api/v1/auth/*`)
- [ ] POST /login
- [ ] POST /logout
- [ ] GET /me
- [ ] Add auth middleware

### [B4] Implement analytics endpoints
**Depends on**: B2, D2

- [ ] Create metrics router (`/api/v1/metrics/*`)
- [ ] GET /dashboard - Dashboard metrics
- [ ] GET /kpis - Key performance indicators
- [ ] Add response caching

### [B5] Implement Cortex endpoints
**Depends on**: B2, D4

- [ ] Create query router (`/api/v1/query/*`)
- [ ] POST /query - Single query
- [ ] GET /query/stream - SSE streaming
- [ ] Handle Cortex errors gracefully

**Checkpoint**: All API endpoints work via curl/Postman

---

## Phase 4: Frontend

### [U1] Create React skeleton
**Depends on**: F1

- [ ] Initialize Vite + React + TypeScript
- [ ] Set up Tailwind CSS
- [ ] Create component structure
- [ ] Add React Router

### [U2] Implement API client
**Depends on**: U1, B1

- [ ] Create `services/api.ts`
- [ ] Create `services/sse.ts`
- [ ] Add auth token management
- [ ] Add error handling

### [U3] Implement authentication UI
**Depends on**: U2, B3

- [ ] Create Login page
- [ ] Create AuthContext provider
- [ ] Add ProtectedRoute component
- [ ] Handle session expiry

### [U4] Implement dashboard
**Depends on**: U2, B4

- [ ] Create Dashboard page
- [ ] Build MetricsCard component
- [ ] Build DataTable component
- [ ] Connect to analytics endpoints

### [U5] Implement chat interface
**Depends on**: U2, B5

- [ ] Create Chat page
- [ ] Build ChatMessage component
- [ ] Build ChatInput component
- [ ] Implement SSE streaming display

**Checkpoint**: Full UI works, all pages accessible

---

## Phase 5: Integration

### [I1] End-to-end testing
**Depends on**: All frontend tasks

- [ ] Test login → dashboard → chat flow
- [ ] Verify all sample questions:
  {list questions from spec}
- [ ] Test error scenarios
- [ ] Performance check (< 3s response)

### [I2] Polish and refinement
**Depends on**: I1

- [ ] Fix any UI/UX issues found
- [ ] Improve error messages
- [ ] Ensure loading states are clear
- [ ] Mobile/responsive check

### [I3] Documentation
**Depends on**: I1

- [ ] Update README with setup instructions
- [ ] Document demo flow/talking points
- [ ] Create demo script
- [ ] Record demo video (optional)

---

## Quick Reference

### Start Commands
```bash
# Backend
cd backend && uvicorn app.main:app --reload

# Frontend
cd frontend && npm run dev
```

### Key Files to Implement
| Priority | File | Purpose |
|----------|------|---------|
| 1 | backend/app/main.py | FastAPI app entry |
| 2 | backend/app/connectors/zone_b.py | Snowflake connection |
| 3 | backend/app/services/analyst.py | Cortex Analyst calls |
| 4 | backend/app/routers/query.py | Query endpoints |
| 5 | frontend/src/pages/Chat.tsx | Main demo page |
| 6 | frontend/src/services/sse.ts | Streaming client |

---

*Next step: Run `/speckit.implement` to start building*
```

---

## Task Generation Logic

### Reading the Plan

Extract these from `plan.md`:

```python
# From plan.md, extract:
zones_used = ["A", "B"]  # or just one
patterns_used = ["A", "B", "D"]  # CRUD, Analytics, Streaming
cortex_features = ["analyst", "agent", "streaming"]
components = {
    "frontend": ["Dashboard", "Chat", "Login"],
    "backend": ["auth", "metrics", "query"],
    "database": ["users", "sessions", "fact_*", "dim_*"]
}
multi_tenant = False
```

### Conditional Tasks

Include/exclude tasks based on plan:

| Condition | Include Tasks |
|-----------|---------------|
| Zone A used | D1 (Zone A schema), B3 (Auth) |
| Zone B used | D2, D4, B4, B5 |
| RAG pattern | B6 (RAG endpoints) |
| Streaming | B5 streaming, U5 SSE |
| Multi-tenant | Tenant provisioning tasks |
| Search service | D4 search setup |

### Dependency Resolution

Tasks must be ordered correctly:

```
F1 → F2 → D1, D2 → D3 → D4
         ↓
B1 → B2 → B3, B4, B5 → B6
         ↓
U1 → U2 → U3, U4, U5 → U6
                    ↓
               I1 → I2 → I3
```

---

## Conversation Flow

### Step 1: Load Plan

```
Reading plan from .specify/specs/{demo}/plan.md...

✓ Plan loaded
✓ Spec loaded
✓ Domain model loaded

Analyzing architecture decisions...
```

### Step 2: Present Task Summary

```
## Task Generation Summary

Based on your technical plan:

**Architecture**: Hybrid (Zone A + Zone B)
**Patterns**: CRUD, Analytics, Streaming
**Cortex**: Analyst, Agent

### Tasks by Category

| Category | Count | Key Deliverables |
|----------|-------|------------------|
| Foundation | 3 | Project setup, connections |
| Database | 4 | Schemas, data, Cortex objects |
| Backend | 6 | API endpoints, services |
| Frontend | 6 | Pages, components |
| Integration | 3 | Testing, polish, docs |

**Total**: 22 tasks

### Excluded (not needed for this demo)
- RAG endpoints (no document search)
- Multi-tenant provisioning (single tenant)

Generate task checklist?
```

### Step 3: Generate

```
Generating implementation tasks...

✓ Created .specify/specs/{demo}/tasks.md

Task breakdown:
- Phase 1 (Foundation): 3 tasks
- Phase 2 (Database): 4 tasks  
- Phase 3 (Backend): 5 tasks
- Phase 4 (Frontend): 6 tasks
- Phase 5 (Integration): 3 tasks

Checkpoints defined at:
- After Foundation: Connections working
- After Database: Sample queries return data
- After Backend: API endpoints testable
- After Frontend: Full UI functional
- After Integration: Demo ready

Next step: Run `/speckit.implement` to start building
```

---

## Example

**User**: /speckit.tasks

**Assistant**:

Reading plan from `.specify/specs/healthcare-analytics/plan.md`...

✓ Plan loaded
✓ Spec loaded
✓ Domain model loaded

## Task Generation Summary

**Architecture**: Hybrid (Zone A + Zone B)
**Patterns**: CRUD (auth), Analytics (dashboard), Streaming (chat)
**Cortex**: Analyst with Agent, SSE streaming

### Tasks by Category

| Category | Count | Key Deliverables |
|----------|-------|------------------|
| Foundation | 2 | Project setup, Snowflake connections |
| Database | 4 | Zone A/B schemas, data load, semantic model |
| Backend | 5 | Auth, metrics, Cortex query endpoints |
| Frontend | 5 | Login, Dashboard, Chat pages |
| Integration | 3 | E2E testing, polish, documentation |

**Total**: 19 tasks across 5 phases

### Tasks Included
- ✓ Zone A (Postgres) for sessions
- ✓ Zone B (Snowflake) for analytics
- ✓ Cortex Analyst integration
- ✓ SSE streaming endpoints
- ✓ Healthcare data generator

### Tasks Excluded
- ✗ RAG endpoints (no document search in spec)
- ✗ Multi-tenant provisioning (single tenant demo)
- ✗ Cortex Search service (not specified)

Generate task checklist?

**User**: Yes

**Assistant**:

Generating implementation tasks...

✓ Created `.specify/specs/healthcare-analytics/tasks.md`

**Phase Summary:**

| Phase | Tasks | Checkpoint |
|-------|-------|------------|
| 1. Foundation | 2 | Both zone connections working |
| 2. Database | 4 | Healthcare data loaded, Analyst queries work |
| 3. Backend | 5 | All API endpoints return valid responses |
| 4. Frontend | 5 | Full UI functional, SSE streaming works |
| 5. Integration | 3 | Demo ready for presentation |

**Recommended Starting Point:**
```bash
# Task F1: Initialize project structure
mkdir -p backend/app/{routers,services,connectors}
mkdir -p frontend/src/{pages,components,services}
```

Next step: Run `/speckit.implement` to start building, or review `tasks.md` to work through manually.

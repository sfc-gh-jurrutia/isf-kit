# /speckit.plan - Technical Architecture Planning

> Analyze a demo specification and produce a technical architecture plan

You are a Technical Architect for Snowflake demos. Your job is to read the specification created by `/speckit.specify` and produce a detailed technical architecture that maps business requirements to implementation patterns.

## Instructions

1. **Read the spec first** - Never propose architecture without understanding requirements
2. **Match patterns to needs** - Use the simplest pattern that meets requirements
3. **Be explicit about trade-offs** - Explain why you chose each pattern
4. **Generate actionable output** - The plan should drive `/speckit.tasks`

## Input Files

Look for these files in `.specify/specs/{demo-name}/`:

| File | Purpose |
|------|---------|
| `spec.md` | Business requirements, personas, features |
| `domain-model.yaml` | Data entities and relationships |
| `sample-questions.yaml` | Questions the demo must answer |

If files don't exist, prompt user to run `/speckit.specify` first.

---

## Architecture Decision Framework

### Step 1: Determine Zone Architecture

Based on the spec, determine the appropriate zone pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                    ZONE ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ZONE A (Snowflake Postgres)     ZONE B (Snowflake)       │
│   ┌─────────────────────────┐     ┌─────────────────────┐  │
│   │ • OLTP workloads        │     │ • Analytics/OLAP    │  │
│   │ • User management       │     │ • Cortex AI         │  │
│   │ • Session state         │     │ • Semantic models   │  │
│   │ • Real-time CRUD        │     │ • Large-scale data  │  │
│   │ • Application data      │     │ • Search services   │  │
│   └─────────────────────────┘     └─────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Decision Matrix:**

| Requirement | Zone A Only | Zone B Only | Both Zones |
|-------------|-------------|-------------|------------|
| Simple analytics dashboard | | ✓ | |
| User authentication | ✓ | | |
| Cortex Analyst queries | | ✓ | |
| Session/chat history | ✓ | | |
| CRUD operations | ✓ | | |
| Cortex Agent with context | | | ✓ |
| RAG over docs + user data | | | ✓ |
| Multi-tenant isolation | ✓ (RLS) | ✓ (Schema) | ✓ |

### Step 2: Identify Request Patterns

Map demo features to the four request patterns:

```
┌─────────────────────────────────────────────────────────────┐
│                    REQUEST PATTERNS                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Pattern A: CRUD                Pattern B: Analytics        │
│  ┌──────────────────┐          ┌──────────────────┐        │
│  │ FastAPI          │          │ FastAPI          │        │
│  │      │           │          │      │           │        │
│  │      ▼           │          │      ▼           │        │
│  │ Zone A (Postgres)│          │ Zone B (Snowflake)│       │
│  │      │           │          │      │           │        │
│  │      ▼           │          │      ▼           │        │
│  │ JSON Response    │          │ JSON Response    │        │
│  └──────────────────┘          └──────────────────┘        │
│                                                             │
│  Pattern C: RAG                 Pattern D: Streaming        │
│  ┌──────────────────┐          ┌──────────────────┐        │
│  │ FastAPI          │          │ FastAPI          │        │
│  │      │           │          │      │           │        │
│  │   ┌──┴──┐        │          │      ▼           │        │
│  │   ▼     ▼        │          │ Zone B (Cortex)  │        │
│  │ Zone A Zone B    │          │      │           │        │
│  │   └──┬──┘        │          │      ▼           │        │
│  │      ▼           │          │ SSE Stream       │        │
│  │ Grounded Response│          └──────────────────┘        │
│  └──────────────────┘                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Pattern Selection:**

| Feature | Pattern | Why |
|---------|---------|-----|
| User login/logout | A (CRUD) | Stateful, transactional |
| Dashboard metrics | B (Analytics) | Read-only aggregations |
| "Ask a question" | B or D | Cortex Analyst |
| Chat with context | C (RAG) | Needs user history + analytics |
| Streaming responses | D | Real-time UX |
| Document Q&A | C (RAG) | Grounded in documents |

### Step 3: Map Cortex Features

Based on spec features, determine Cortex implementation:

```yaml
cortex_features:
  analyst:
    required: true/false
    implementation: "inline" or "agent_object"
    semantic_model: "path/to/model.yaml"
    
  agent:
    required: true/false
    tools:
      - cortex_analyst  # text-to-SQL
      - cortex_search   # document search
      - custom_tool     # your API
    streaming: true/false
    
  rag:
    required: true/false
    sources:
      - zone_a: "user context"
      - zone_b: "document corpus"
    
  search:
    required: true/false
    service_name: "{demo}_search_service"
    columns: ["content", "metadata"]
    
  llm_functions:
    required: true/false
    use_cases:
      - "summarization"
      - "classification"
      - "extraction"
```

**Cortex Decision Tree:**

```
Does demo need natural language queries?
├─ Yes → Cortex Analyst
│   └─ Does it need multi-turn conversation?
│       ├─ Yes → Cortex Agent with Analyst tool
│       └─ No → Inline Analyst call
└─ No → Direct SQL or LLM functions

Does demo need document search?
├─ Yes → Cortex Search
│   └─ Combined with analytics?
│       ├─ Yes → RAG pattern (C)
│       └─ No → Search-only
└─ No → Skip search service

Does demo need real-time responses?
├─ Yes → SSE Streaming (Pattern D)
│   └─ Agent streaming or Analyst streaming
└─ No → Standard JSON responses
```

### Step 4: Define Component Architecture

Based on decisions, define the components:

```
┌─────────────────────────────────────────────────────────────┐
│                   COMPONENT ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FRONTEND (React + Vite)                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Pages          Components        Services          │   │
│  │  ┌──────────┐   ┌──────────────┐  ┌─────────────┐  │   │
│  │  │ Dashboard│   │ ChatInterface│  │ api.ts      │  │   │
│  │  │ Chat     │   │ MetricsCard  │  │ sse.ts      │  │   │
│  │  │ Settings │   │ DataTable    │  │ auth.ts     │  │   │
│  │  └──────────┘   └──────────────┘  └─────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  BACKEND (FastAPI)                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Routers         Services          Connectors       │   │
│  │  ┌──────────┐   ┌──────────────┐  ┌─────────────┐  │   │
│  │  │ /api/v1/ │   │ AnalystSvc   │  │ zone_a.py   │  │   │
│  │  │  auth    │   │ SearchSvc    │  │ zone_b.py   │  │   │
│  │  │  query   │   │ RAGSvc       │  │ streaming.py│  │   │
│  │  │  chat    │   │ ChatSvc      │  │             │  │   │
│  │  └──────────┘   └──────────────┘  └─────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│              ┌────────────┴────────────┐                   │
│              ▼                         ▼                    │
│  ┌─────────────────────┐   ┌─────────────────────────┐    │
│  │     ZONE A          │   │       ZONE B            │    │
│  │  (Postgres)         │   │    (Snowflake)          │    │
│  │  ┌───────────────┐  │   │  ┌─────────────────┐   │    │
│  │  │ users         │  │   │  │ DEMO_DB         │   │    │
│  │  │ sessions      │  │   │  │ ├─ fact_*       │   │    │
│  │  │ chat_history  │  │   │  │ ├─ dim_*        │   │    │
│  │  │ tenant_config │  │   │  │ └─ semantic.yaml│   │    │
│  │  └───────────────┘  │   │  │                 │   │    │
│  │                     │   │  │ CORTEX          │   │    │
│  │                     │   │  │ ├─ Analyst      │   │    │
│  │                     │   │  │ ├─ Agent        │   │    │
│  │                     │   │  │ └─ Search       │   │    │
│  │                     │   │  └─────────────────┘   │    │
│  └─────────────────────┘   └─────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 5: Multi-Tenancy (If Required)

If spec requires multi-tenancy:

```yaml
multi_tenancy:
  enabled: true
  
  zone_a:
    strategy: "row_level_security"
    tenant_column: "tenant_id"
    enforcement: "policy_based"
    
  zone_b:
    strategy: "schema_isolation"
    naming: "tenant_{tenant_id}"
    data_sharing: "secure_views"
    
  provisioning:
    - create_tenant_schema
    - copy_semantic_model
    - generate_tenant_data
    - configure_access_policies
```

---

## Output: Technical Plan Document

Generate `.specify/specs/{demo-name}/plan.md`:

```markdown
# Technical Architecture Plan: {Demo Name}

> Generated by /speckit.plan on {date}

## Executive Summary

{2-3 sentence summary of the architecture approach}

## Architecture Decisions

### Zone Architecture: {Zone A Only | Zone B Only | Hybrid}

**Rationale**: {Why this zone pattern was chosen}

| Component | Zone | Justification |
|-----------|------|---------------|
| {component} | A/B | {reason} |

### Request Patterns Used

| Pattern | Endpoints | Description |
|---------|-----------|-------------|
| A (CRUD) | {list} | {description} |
| B (Analytics) | {list} | {description} |
| C (RAG) | {list} | {description} |
| D (Streaming) | {list} | {description} |

### Cortex Features

| Feature | Used | Implementation |
|---------|------|----------------|
| Analyst | ✓/✗ | {inline/agent} |
| Agent | ✓/✗ | {tools list} |
| RAG | ✓/✗ | {sources} |
| Search | ✓/✗ | {service name} |
| LLM Functions | ✓/✗ | {use cases} |

## Component Breakdown

### Frontend

| Component | Purpose | Complexity |
|-----------|---------|------------|
| {component} | {purpose} | Low/Med/High |

### Backend

| Service | Pattern | Zone(s) | Endpoints |
|---------|---------|---------|-----------|
| {service} | {pattern} | {zones} | {endpoints} |

### Database

#### Zone A (Snowflake Postgres)
```sql
-- Tables
{table list with purposes}
```

#### Zone B (Snowflake)
```sql
-- Tables
{table list with purposes}

-- Cortex Objects
{semantic model, search service, etc.}
```

## Data Flow Diagrams

### {Flow 1 Name}
```
{ASCII diagram of data flow}
```

### {Flow 2 Name}
```
{ASCII diagram}
```

## API Specification

### Endpoints

| Method | Path | Pattern | Description |
|--------|------|---------|-------------|
| POST | /api/v1/auth/login | A | User authentication |
| GET | /api/v1/metrics | B | Dashboard metrics |
| POST | /api/v1/query | D | Natural language query |
| GET | /api/v1/chat/stream | D | SSE chat stream |

### SSE Events (if streaming)

> **IMPORTANT**: Frontend and backend MUST use identical event names. This is the standard contract.

| Event | Payload Key | Example | Description |
|-------|-------------|---------|-------------|
| `thinking` | `status` | `{"status": "Analyzing..."}` | Processing indicator |
| `explanation` | `text` | `{"text": "I'll query..."}` | AI explanation of approach |
| `sql` | `sql` | `{"sql": "SELECT..."}` | Generated SQL statement |
| `data` | `rows` | `{"rows": [{...}]}` | Query results array |
| `error` | `message` | `{"message": "Error..."}` | Error details |
| `done` | (empty) | `{}` | Stream complete |

**Event order**: `thinking` → `explanation` (optional) → `sql` → `data` → `done`

**SSE format** (each event):
```
event: {event_name}
data: {json_payload}

```
Note: Double newline required after data line.

## Security Considerations

- Authentication: {approach}
- Authorization: {approach}
- Data isolation: {approach}
- API security: {approach}

## Performance Considerations

- Caching strategy: {approach}
- Query optimization: {approach}
- Connection pooling: {approach}

## Implementation Sequence

The recommended implementation order:

1. **Foundation** (Week 1)
   - {tasks}

2. **Core Features** (Week 2)
   - {tasks}

3. **Integration** (Week 3)
   - {tasks}

4. **Polish** (Week 4)
   - {tasks}

## Files to Generate

| File | Purpose |
|------|---------|
| `backend/app/routers/{x}.py` | {purpose} |
| `backend/app/services/{x}.py` | {purpose} |
| `frontend/src/pages/{x}.tsx` | {purpose} |
| `snowflake/ddl/{x}.sql` | {purpose} |

## Open Questions

- {Any decisions that need user input}

---

*Next step: Run `/speckit.tasks` to generate implementation checklist*
```

---

## Conversation Flow

### Step 1: Load and Validate Spec

```
Reading specification from .specify/specs/{demo}/...

✓ spec.md loaded
✓ domain-model.yaml loaded  
✓ sample-questions.yaml loaded

Analyzing requirements...
```

### Step 2: Present Architecture Analysis

```
## Architecture Analysis

Based on your specification:

**Demo**: {name}
**Industry**: {industry}
**Features**: {feature list}
**Data Scale**: {scale}

### Recommended Architecture

**Zone Pattern**: {recommendation}
- {justification}

**Request Patterns**:
- Pattern A (CRUD): {yes/no} - {why}
- Pattern B (Analytics): {yes/no} - {why}
- Pattern C (RAG): {yes/no} - {why}
- Pattern D (Streaming): {yes/no} - {why}

**Cortex Features**:
- {feature}: {implementation approach}

Does this architecture approach look right, or should I adjust anything?
```

### Step 3: Generate Plan

Upon confirmation:

```
Generating technical plan...

✓ Created .specify/specs/{demo}/plan.md

Plan Summary:
- {X} frontend components
- {Y} backend services  
- {Z} database objects
- {N} API endpoints

Next step: Run `/speckit.tasks` to generate implementation checklist
```

---

## Example

**User**: /speckit.plan

**Assistant**: 

Reading specification from `.specify/specs/healthcare-analytics/`...

✓ spec.md loaded
✓ domain-model.yaml loaded
✓ sample-questions.yaml loaded

## Architecture Analysis

**Demo**: Healthcare Analytics Dashboard
**Industry**: Healthcare
**Features**: Cortex Analyst, Cortex Agent (streaming)
**Data Scale**: Realistic (500K rows)

### Recommended Architecture

**Zone Pattern**: Hybrid (Zone A + Zone B)

- Zone A for user sessions and chat history (OLTP)
- Zone B for patient/claims analytics (OLAP + Cortex)

**Request Patterns**:

| Pattern | Used | Endpoints |
|---------|------|-----------|
| A (CRUD) | ✓ | /auth/*, /settings/* |
| B (Analytics) | ✓ | /metrics/*, /dashboard/* |
| C (RAG) | ✗ | Not needed (no documents) |
| D (Streaming) | ✓ | /query/stream, /chat/stream |

**Cortex Implementation**:

- Cortex Analyst: Agent object (for multi-turn)
- Streaming: SSE with thinking/sql/data events
- Semantic Model: Auto-generated from domain model

**Multi-Tenancy**: Not required

Does this architecture approach look right?

**User**: Looks good, generate the plan

**Assistant**: 

Generating technical plan...

✓ Created `.specify/specs/healthcare-analytics/plan.md`

**Plan Summary**:
- 4 frontend pages (Dashboard, Chat, Settings, Login)
- 3 backend services (AnalystService, AuthService, MetricsService)
- 6 database tables (4 Zone B, 2 Zone A)
- 8 API endpoints

Key implementation decisions:
- Using Cortex Agent with Analyst tool for conversational analytics
- SSE streaming for real-time responses
- Zone A Postgres for session management
- Healthcare industry generator for realistic data

Next step: Run `/speckit.tasks` to generate implementation checklist

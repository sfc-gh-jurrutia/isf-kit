# Prompt Plan: Specify Workflow Gap Closure

> 16 sequenced prompts for a code-generation LLM to close all 9 gaps in the specify workflow.
> Each prompt builds on previous prompts. No orphaned code. No big jumps.
>
> **Source of truth**: `/Users/jurrutia/projects/isf-kit/gap-closure-spec.md` (1579 lines).
> Every prompt references its originating spec section. All code templates, tables,
> insertion points, and acceptance criteria are drawn directly from that spec.

---

## Blueprint Overview

### What We're Building

The specify workflow at `skills/specify/` orchestrates Snowflake demo creation across Steps 0-8. A gap analysis against the `snowflake-demo-*` knowledge base found 9 gaps. This plan closes them by creating 10 new files, copying 20 CSV dictionaries, and modifying 8 existing files.

### Dependency Graph

```
Prompt 01 ─── SQL schema template (standalone)
Prompt 02 ─── Snowflake service template (standalone)
Prompt 03 ─── Cortex agent backend template (depends on 02 for service pattern)
Prompt 04 ─── useCortexAgent hook (standalone)
Prompt 05 ─── Wire Gap 1 into implement/SKILL.md (depends on 01-04 existing)
Prompt 06 ─── Transformation approaches reference (standalone)
Prompt 07 ─── Wire Gap 3 into data-architecture.md (depends on 06 existing)
Prompt 08 ─── React production patterns reference (standalone)
Prompt 09 ─── Wire Gap 2 into react-components.md (depends on 08 existing)
Prompt 10 ─── reflect/SKILL.md (standalone)
Prompt 11 ─── Wire Gap 4 into SKILL.md (depends on 10 existing)
Prompt 12 ─── CI test cycle template (standalone)
Prompt 13 ─── Wire Gaps 5+6 into testing-spec.md (depends on 12 existing)
Prompt 14 ─── Synthetic data generator + wire into generate/SKILL.md (standalone)
Prompt 15 ─── Wire Gap 8 into drd-template.md + Gap 9 constraint (standalone edits)
Prompt 16 ─── Copy 20 CSV dictionaries + final data-architecture.md dictionary update
```

### File Inventory

| # | Action | File | Gap |
|---|--------|------|-----|
| 1 | CREATE | `templates/sql/schema_template.sql` | 1 |
| 2 | CREATE | `templates/backend/snowflake_service.py` | 1 |
| 3 | CREATE | `templates/backend/cortex_agent_service.py` | 1 |
| 4 | CREATE | `templates/frontend/hooks/useCortexAgent.ts` | 1 |
| 5 | MODIFY | `implement/SKILL.md` | 1 |
| 6 | CREATE | `references/transformation-approaches.md` | 3 |
| 7 | MODIFY | `references/data-architecture.md` | 3 |
| 8 | CREATE | `references/react-production-patterns.md` | 2 |
| 9 | MODIFY | `references/react-components.md` | 2 |
| 10 | CREATE | `reflect/SKILL.md` | 4 |
| 11 | MODIFY | `SKILL.md` | 4 |
| 12 | CREATE | `templates/ci_test_cycle.sh` | 5 |
| 13 | MODIFY | `references/testing-spec.md` | 5+6 |
| 14 | CREATE | `templates/generate_synthetic_data.py` + MODIFY `generate/SKILL.md` | 7 |
| 15 | MODIFY | `references/drd-template.md` + `references/constraints.md` | 8+9 |
| 16 | COPY | 20 CSVs to `references/dictionaries/` + MODIFY `data-architecture.md` | 9 |

---

## Prompts

### Prompt 01 — SQL Schema Template

**Spec ref**: Section 3.4 (lines 368-411)
**Goal**: Create the database/schema initialization template that all demos start from.
**Creates**: `skills/specify/templates/sql/schema_template.sql`
**Depends on**: Nothing. First file, no wiring needed yet.
**Acceptance**: RAW, ATOMIC, `<DATA_MART_NAME>` schemas present; optional schemas commented out; GRANT examples commented out (spec Section 14, Gap 1 test 3).

```text
You are working in the repository at /Users/jurrutia/projects/isf-kit.

Create the file skills/specify/templates/sql/schema_template.sql

This is a SQL template that initializes the standard 3-layer Snowflake schema
for demo projects. It will be copied into each new demo's sql/ directory and
customized by replacing placeholder tokens.

Requirements:
- Two placeholder tokens: <PROJECT_DATABASE> and <DATA_MART_NAME>
  (angle brackets included, for find-and-replace)
- Section 1: CREATE DATABASE IF NOT EXISTS
- Section 2: USE DATABASE, then CREATE SCHEMA IF NOT EXISTS for the 3 required
  schemas: RAW, ATOMIC, and <DATA_MART_NAME>
- Each schema gets a COMMENT explaining its purpose:
  - RAW: "Landing zone for external data in original format. CDC staging and file loads."
  - ATOMIC: "Enterprise Relational Model. Normalized, canonical business entities."
  - <DATA_MART_NAME>: "Consumer-facing data products. Denormalized views and aggregations."
- Section 3: Commented-out optional schemas (DATA_ENGINEERING, DATA_SCIENCE,
  ML_PROCESSING) with COMMENTs, for uncommon use cases
- Section 4: Commented-out GRANT statements showing a typical permission model
  (DATA_ENGINEER gets all on RAW/ATOMIC, DATA_ANALYST gets SELECT on DATA_MART)
- Header comment block explaining the template and how to replace placeholders
- Use uppercase SQL keywords and object names (Snowflake convention)
- Use CREATE SCHEMA IF NOT EXISTS (idempotent)
- No CHECK constraints (Snowflake doesn't support them)
- Keep it under 50 lines of actual SQL (excluding comments)

Do NOT add any other files. Just this one template.
```

---

### Prompt 02 — Snowflake Service Template

**Spec ref**: Section 3.2 (lines 254-298)
**Goal**: Create the connection/query service class that all backends use.
**Creates**: `skills/specify/templates/backend/snowflake_service.py`
**Depends on**: Nothing.
**Acceptance**: `connection_name=os.getenv("SNOWFLAKE_CONNECTION_NAME", "demo")` pattern used; no hardcoded credentials (spec line 298).

```text
You are working in the repository at /Users/jurrutia/projects/isf-kit.

Create the file skills/specify/templates/backend/snowflake_service.py

This is a Python service class that wraps Snowflake connectivity for demo
backends. It will be copied into each new demo's backend/services/ directory.

Requirements:
- Class named SnowflakeService
- Constructor reads connection name from env var SNOWFLAKE_CONNECTION_NAME
  with default "demo". Store as self.connection_name.
- CRITICAL: Always connect using connection_name= parameter:
  snowflake.connector.connect(connection_name=self.connection_name)
  NEVER hardcode credentials (no user, password, account params).
- Context manager method get_connection() that yields a connection and
  closes it in the finally block. Use @contextmanager from contextlib.
- Method execute_query(sql, params=None) -> list[dict]:
  Uses DictCursor, executes SQL with optional params dict, returns fetchall().
  Closes cursor in finally block.
- Method execute_scalar(sql, params=None) -> Any:
  Uses regular cursor, returns first column of first row, or None.
  Closes cursor in finally block.
- Imports: os, snowflake.connector, contextlib.contextmanager
- Type hints on all methods
- Module docstring explaining this is a template to copy and customize
- No external dependencies beyond snowflake-connector-python
- No connection pooling (keep it simple for demos)
- Python >=3.10 syntax (use list[dict] not List[Dict])

Do NOT create any other files.
```

---

### Prompt 03 — Cortex Agent Service Template

**Spec ref**: Section 3.1 (lines 108-251)
**Goal**: Create the FastAPI router that proxies requests to Cortex Agent.
**Creates**: `skills/specify/templates/backend/cortex_agent_service.py`
**Depends on**: Prompt 02 (uses same connection_name pattern).
**Acceptance**: All 4 endpoints (`/threads`, `/chat`, `/run`, `/health`); SSE event mapping table matches spec lines 175-183; `httpx` used (not `requests`); endpoint path uses `/agents/` NOT `/cortex-agents/` (spec Section 14, Gap 1 test 1).

```text
You are working in the repository at /Users/jurrutia/projects/isf-kit.

Create the file skills/specify/templates/backend/cortex_agent_service.py

This is a FastAPI router template that proxies requests to a Snowflake Cortex
Agent. It will be copied into each new demo's backend/api/ directory.

IMPORTANT CONTEXT:
- The SnowflakeService at templates/backend/snowflake_service.py already exists
  and handles direct SQL queries. This file handles the Cortex Agent REST API.
- Cortex Agent endpoint path is /api/v2/databases/{DB}/schemas/{SCHEMA}/agents/{AGENT}:run
  The path uses /agents/ NOT /cortex-agents/ (the latter returns 404).
- Threads endpoint is /api/v2/cortex/threads
- Use httpx (not requests) for async HTTP. This is a hard requirement.

Requirements:

1. CortexAgentConfig class:
   - Parameters: account_url, database, schema, agent_name, warehouse
   - Each reads from env var with fallback to constructor default:
     SNOWFLAKE_ACCOUNT_URL, CORTEX_AGENT_DATABASE, CORTEX_AGENT_SCHEMA,
     CORTEX_AGENT_NAME, SNOWFLAKE_WAREHOUSE
   - Property agent_endpoint returning the full URL
   - Property threads_endpoint returning the threads URL

2. get_auth_headers() function:
   - Priority: SNOWFLAKE_PAT (or SNOWFLAKE_TOKEN) > SNOWFLAKE_OAUTH_TOKEN
   - Returns {"Authorization": f"Bearer {token}"}
   - Raises ValueError if no token found

3. Pydantic request/response models:
   - ChatRequest: message (str), thread_id (Optional[str]),
     parent_message_id (Optional[str] = "0"), context (Optional[dict])
   - ChatResponse: response (str), thread_id, message_id, sources (list),
     tool_calls (list), sql (Optional[str]), context (Optional[dict])

4. map_cortex_event(event: dict) function that maps Cortex SSE events to
   frontend-friendly events:
   - "text" or "content_block_delta" -> {"event_type": "text_delta", "text": ...}
   - "tool_use_start" -> {"event_type": "tool_start", "tool_name": ..., "tool_type": ...}
   - "tool_use_end" -> {"event_type": "tool_end", "tool_name": ..., "result": ...}
   - "tool_result" -> {"event_type": "tool_result", "tool_name": ..., "result": ..., "sql": ...}
   - "thinking" -> {"event_type": "reasoning", "text": ...}
   - "message_stop" or "done" -> {"event_type": "message_complete", ...}
   - "error" -> {"event_type": "error", "error": ..., "code": ...}
   - Unknown -> pass through with original event_type

5. FastAPI router (APIRouter with prefix="/agent") with 4 endpoints:
   - POST /threads: Creates thread via httpx POST to threads_endpoint
   - POST /chat: Non-streaming. Sends message, collects full response, returns ChatResponse
   - POST /run: SSE streaming. Returns StreamingResponse with:
     - media_type="text/event-stream"
     - Headers: Cache-Control: no-cache, Connection: keep-alive,
       X-Accel-Buffering: no (for nginx proxy)
     - Generator that reads SSE lines from httpx stream, maps events, yields
       "data: {json}\n\n" format, ends with "data: [DONE]\n\n"
   - GET /health: Returns status, agent name, endpoint URL

6. Error handling:
   - httpx.HTTPStatusError: proxy the upstream status code and message
   - httpx.TimeoutException: return 504 with "Agent request timed out"
   - ValueError (auth): return 401
   - Generic Exception: return 500

7. The streaming generator must:
   - Use httpx.AsyncClient with timeout=120.0
   - Use client.stream("POST", ...) for SSE
   - Iterate with response.aiter_lines()
   - Handle "data: [DONE]" terminal event
   - Parse "data: " prefix before JSON parsing

Module docstring explaining this is a template. Include a usage comment
showing how to mount: app.include_router(agent_router)

Do NOT create any other files.
```

---

### Prompt 04 — useCortexAgent React Hook

**Spec ref**: Section 3.3 (lines 302-365)
**Goal**: Create the frontend hook for SSE streaming with Cortex Agent.
**Creates**: `skills/specify/templates/frontend/hooks/useCortexAgent.ts`
**Depends on**: Nothing (frontend is independent of backend files, though they pair together).
**Acceptance**: Switch covers all event types: text_delta, tool_start, tool_end, tool_result, reasoning, message_complete, error (spec Section 14, Gap 1 test 2); AbortController abort on new send; SSE buffer management with `lines.pop()` pattern.

```text
You are working in the repository at /Users/jurrutia/projects/isf-kit.

Create the file skills/specify/templates/frontend/hooks/useCortexAgent.ts

This is a React hook template for connecting to a Cortex Agent backend via SSE
streaming. It will be copied into each new demo's frontend/src/hooks/ directory.

The hook pairs with the FastAPI backend at templates/backend/cortex_agent_service.py
which serves SSE events at POST /agent/run.

Requirements:

1. Type definitions (export all):
   - CortexAgentMessage: { id: string, role: 'user'|'assistant', content: string,
     parts: CortexMessagePart[], isStreaming?: boolean, timestamp: Date }
   - CortexMessagePart: discriminated union with types:
     - { type: 'text', text: string }
     - { type: 'tool', name: string, toolType: string, status: ToolStatus,
       input?: any, output?: any, sql?: string, error?: string, duration?: number }
     - { type: 'reasoning', text: string, stage: ReasoningStage }
     - { type: 'source', title: string, snippet?: string, score?: number, url?: string }
   - ToolStatus: 'running' | 'complete' | 'error'
   - ReasoningStage: 'idle' | 'classifying' | 'searching' | 'analyzing' | 'generating'
   - UseCortexAgentOptions: { endpoint: string, threadId?: string,
     onEvent?: (event: any) => void }
   - UseCortexAgentReturn: { messages, status, sendMessage, threadId,
     reasoningStage, clearMessages }

2. Hook: useCortexAgent(options: UseCortexAgentOptions): UseCortexAgentReturn
   State:
   - messages: CortexAgentMessage[] (useState)
   - status: 'idle' | 'streaming' | 'error' (useState)
   - threadId: string | undefined (useState, initialized from options)
   - reasoningStage: ReasoningStage (useState, starts 'idle')
   Refs:
   - abortControllerRef: useRef<AbortController | null>(null)

3. sendMessage(text: string) async function:
   a. Abort any existing stream: abortControllerRef.current?.abort()
   b. Create new AbortController, store in ref
   c. Create user message object, append to messages
   d. Create empty assistant message with isStreaming: true, append to messages
   e. Set status to 'streaming', reasoningStage to 'classifying'
   f. Call fetch(options.endpoint, { method: 'POST', headers: Content-Type
      application/json + Accept text/event-stream, body: JSON.stringify
      with message and thread_id, signal from abort controller })
   g. Read response body as stream using getReader()
   h. SSE buffer management (CRITICAL for correctness):
      - Maintain a buffer string
      - On each chunk: buffer += decoder.decode(value, { stream: true })
      - Split: const lines = buffer.split('\n')
      - Keep incomplete last line: buffer = lines.pop() || ''
      - Process complete lines only
   i. For each line starting with "data: ":
      - Extract payload after "data: "
      - If payload is "[DONE]", break
      - JSON.parse the payload
      - Call onEvent callback if provided
      - Switch on event_type to update state:
        * text_delta/text: append text to running fullText variable,
          update assistant message content
        * tool_start/tool_use_start: set reasoningStage based on tool
          (cortex_search -> 'searching', else 'analyzing'),
          add tool part with status 'running'
        * tool_end/tool_use_end: set reasoningStage to 'generating',
          update tool part status to 'complete' (or 'error' if error field)
        * tool_result: update tool part with output and sql fields
        * reasoning/thinking: add reasoning part to message
        * message_complete/done: extract citations, update threadId if present
        * error: set status to 'error'
   j. After loop: set status to 'idle', mark assistant message isStreaming false

4. Cleanup: useEffect cleanup function that aborts on unmount

5. clearMessages: resets messages to empty array, status to idle

6. Generate unique IDs with crypto.randomUUID() (or Date.now() fallback)

Style:
- No external dependencies (no axios, no third-party SSE libraries)
- Use native fetch + ReadableStream
- TypeScript strict mode compatible
- Export the hook as default export, types as named exports
- Add JSDoc comment on the hook explaining usage

Do NOT create any other files.
```

---

### Prompt 05 — Wire Gap 1 into implement/SKILL.md

**Spec ref**: Section 3.5 (lines 415-443)
**Goal**: Add the project initialization scaffold and template references to the implementation engine.
**Modifies**: `skills/specify/implement/SKILL.md`
**Depends on**: Prompts 01-04 (references the files they created).
**Acceptance**: Step 2.5 with 7-step table present; Backend Templates and Frontend Templates subsections in Step 3 reference all 4 template files (spec Section 14, Integration test "Template usability").

```text
You are working in the repository at /Users/jurrutia/projects/isf-kit.

Modify the file skills/specify/implement/SKILL.md to add implementation
scaffolding that references the 4 template files created in previous steps.

The file currently has these sections:
- Step 1: Select Implementation Mode
- Step 2: Work Through Tasks (phases: Foundation, Database, Backend, Frontend, Integration)
- Step 3: Generate Real Code
- Frontend Implementation
- Implementation Checkpoints

Make these changes:

1. AFTER "Step 2: Work Through Tasks" (after the phase list ending with
   "5. **Integration** → Testing, polish") and BEFORE "### Step 3: Generate
   Real Code", add a new section:

   ### Step 2.5: Project Initialization (React+FastAPI)

   Add a paragraph: "When the plan specifies a React+FastAPI frontend, follow
   this 7-step scaffold before working through tasks:"

   Add a table with columns Step | Action | Template/Source:
   | 1 | Init Vite+React+TS | npm create vite@latest frontend -- --template react-ts |
   | 2 | Configure Tailwind | Install tailwindcss, create config, add Snowflake design tokens |
   | 3 | Create Layout | Copy DashboardShell from templates/ui/layouts/ |
   | 4 | Create FastAPI main | uvicorn main:app, CORS middleware, include routers |
   | 5 | Create SnowflakeService | Copy from templates/backend/snowflake_service.py |
   | 6 | Add Cortex Agent proxy | Copy from templates/backend/cortex_agent_service.py, customize config |
   | 7 | Configure Vite proxy + SWR | Proxy /api to FastAPI, install SWR for data fetching |

2. In "Step 3: Generate Real Code", AFTER the existing "Key Patterns" section
   (after the SSE Format code block ending with "Note: Double newline required
   after data line."), add two subsections:

   **Backend Templates:**
   - Copy templates/backend/cortex_agent_service.py into backend/api/ — customize CortexAgentConfig defaults for the project
   - Copy templates/backend/snowflake_service.py into backend/services/ — set connection name
   - Copy templates/sql/schema_template.sql into sql/01_setup.sql — replace <PROJECT_DATABASE> and <DATA_MART_NAME> with project values

   **Frontend Templates:**
   - Copy templates/frontend/hooks/useCortexAgent.ts into frontend/src/hooks/
   - Load references/react-production-patterns.md — apply race condition prevention, SSE buffer management, fallback patterns

Do NOT change any other content in the file. Preserve all existing text exactly.
Do NOT modify any other files.
```

---

### Prompt 06 — Transformation Approaches Reference

**Spec ref**: Section 5.1 (lines 739-931)
**Goal**: Create the full transformation decision framework with SQL examples.
**Creates**: `skills/specify/references/transformation-approaches.md`
**Depends on**: Nothing.
**Acceptance**: Decision tree present; comparison table covers all 5 approaches; working SQL for each (Views, MVs, Dynamic Tables, Stored Procedures, Streams+Tasks); quick decision guide table (spec Section 14, Gap 3 test).

```text
You are working in the repository at /Users/jurrutia/projects/isf-kit.

Create the file skills/specify/references/transformation-approaches.md

This is a reference document loaded during Step 2 (Generate Specification) and
Step 7 (Implement) to guide transformation approach selection.

Requirements:

1. Header: "# Transformation Approaches" with a blockquote saying when to load it.

2. Decision Tree section with ASCII art:
   - Start: "Transformation Need"
   - First branch: Real-time required? Yes -> Streams + Tasks
   - No -> Complex multi-step? Yes -> Declarative OK? Yes -> Dynamic Tables, No -> Stored Procedures
   - No -> Materialization needed? Yes -> Materialized Views, No -> Standard Views

3. Comparison Table with columns: Approach | Use When | Pros | Cons
   Cover all 5 approaches: Views, Materialized Views, Dynamic Tables,
   Stored Procedures, Streams + Tasks

4. SQL Examples section with working examples for each approach:

   a. Standard Views: CREATE OR REPLACE VIEW filtering ATOMIC for IS_CURRENT_FLAG = TRUE

   b. Materialized Views: CREATE MATERIALIZED VIEW with DATE_TRUNC aggregation,
      COUNT, AVG from ATOMIC

   c. Dynamic Tables (show a 2-step pipeline):
      Step 1: Clean RAW data with TRY_TO_TIMESTAMP/TRY_TO_NUMBER, TARGET_LAG = '1 hour'
      Step 2: Aggregate into DATA_MART with GROUP BY, also TARGET_LAG = '1 hour'
      Add note: TARGET_LAG options are '1 minute' to '7 days' (time-based)
      or DOWNSTREAM (refresh when downstream refreshes)

   d. Stored Procedures: LANGUAGE SQL procedure that does a CDC MERGE with:
      Step 1: UPDATE to expire old records (set VALID_TO_TIMESTAMP, IS_CURRENT_FLAG=FALSE)
      Step 2: INSERT new/updated with QUALIFY ROW_NUMBER for dedup
      Step 3: Archive to _ARCHIVE table and TRUNCATE staging

   e. Streams + Tasks:
      CREATE STREAM with APPEND_ONLY = FALSE on a CDC table
      CREATE TASK with SCHEDULE = '5 MINUTE' and
      WHEN SYSTEM$STREAM_HAS_DATA('stream_name')
      Body: MERGE INTO target USING stream source
      ALTER TASK ... RESUME to enable
      Add note: APPEND_ONLY = TRUE for inserts only, FALSE for all DML

5. Quick Decision Guide table mapping common scenarios to recommendations:
   Simple dimension view -> Standard View
   Dashboard aggregations -> Materialized View
   ETL pipeline with multiple steps -> Dynamic Tables
   Complex business logic with conditionals -> Stored Procedure
   Real-time CDC from source system -> Streams + Tasks
   One-time data transformation -> CTAS
   Ad-hoc analysis -> Standard View or CTAS

Use realistic table/column names from the data-architecture.md patterns
(EQUIPMENT_READINGS, CUSTOMER, PRODUCTION_RUN, etc.) so the examples are
consistent with existing docs.

Do NOT create any other files.
```

---

### Prompt 07 — Wire Gap 3 into data-architecture.md

**Spec ref**: Section 5.2 (lines 933-990)
**Goal**: Replace the summary transformation table and text-only dictionary list with cross-references.
**Modifies**: `skills/specify/references/data-architecture.md`
**Depends on**: Prompt 06 (references transformation-approaches.md).
**Acceptance**: "Transformation Decision Matrix" replaced with cross-ref + quick-ref table; dictionary section references `references/dictionaries/` with 20-row table (spec Section 14, Integration test "Cross-references").

```text
You are working in the repository at /Users/jurrutia/projects/isf-kit.

Modify the file skills/specify/references/data-architecture.md to replace two
sections with cross-references to the new detailed documents.

CHANGE 1: Replace the "Transformation Decision Matrix" section.

Find this exact content (lines 178-186):

## Transformation Decision Matrix

| Use When | Approach |
|----------|----------|
| Simple transformations, real-time accuracy | **Views** |
| Expensive aggregations, predictable queries | **Materialized Views** |
| Multi-step pipelines, declarative preferred | **Dynamic Tables** |
| Complex logic, conditional processing | **Stored Procedures** |
| CDC processing, near-real-time | **Streams + Tasks** |

Replace it with:

## Transformation Approaches

See `references/transformation-approaches.md` for the full decision framework
with SQL examples for each approach (Views, Materialized Views, Dynamic Tables,
Stored Procedures, Streams+Tasks).

### Quick Reference

| Use When | Approach |
|----------|----------|
| Simple transforms, real-time accuracy | **Views** |
| Expensive aggregations, predictable queries | **Materialized Views** |
| Multi-step pipelines, declarative preferred | **Dynamic Tables** |
| Complex logic, conditional processing | **Stored Procedures** |
| CDC processing, near-real-time | **Streams + Tasks** |

CHANGE 2: Replace the "Data Dictionary Reference" section.

Find the section starting with "## Data Dictionary Reference" (line 198) through
the end of the industry table (line 222, ending with "| **Utilities** |...").

Replace that entire block (header + intro paragraph + "### Available Industry
Dictionaries" subheader + the table) with:

## Data Dictionary Reference

Before designing ATOMIC entities, consult the industry data dictionaries in
`references/dictionaries/` for standard entity definitions and column naming.

### Available Dictionaries

| File | Industry | Key Entities |
|------|----------|-------------|
| `core.data_dictionary.csv` | Core | Base enterprise entities (start here) |
| `data_dictionary_ATOMIC.csv` | ATOMIC layer | Standard ATOMIC entities |
| `data_dictionary_AEROSPACE.csv` | Aerospace | Aircraft, defense manufacturing |
| `data_dictionary_AGRICULTURE.csv` | Agriculture | Farming, crop management |
| `data_dictionary_AUTOMOTIVE.csv` | Automotive | Vehicle manufacturing |
| `data_dictionary_CLM.csv` | Contract Lifecycle | Contract management |
| `data_dictionary_CONNECTED_PRODUCTS.csv` | Connected Products | IoT products, telemetry |
| `data_dictionary_CONSTRUCTION.csv` | Construction | Building, infrastructure |
| `data_dictionary_DIGITAL_TWIN.csv` | Digital Twin | IoT, simulation, asset models |
| `data_dictionary_ENERGY_TRADING.csv` | Energy Trading | Power markets, trading |
| `data_dictionary_FACILITY_SITE_MANAGEMENT.csv` | Facility Mgmt | Sites, buildings, maintenance |
| `data_dictionary_GENERAL_REFERENCE.csv` | General | Cross-industry reference data |
| `data_dictionary_MINING.csv` | Mining | Extraction, minerals processing |
| `data_dictionary_OG.csv` | Oil & Gas | Upstream, midstream, downstream |
| `data_dictionary_PROCESS_MANUFACTURING.csv` | Process Mfg | Chemical, pharma, food & bev |
| `data_dictionary_REGULATORY.csv` | Regulatory | Compliance, certifications |
| `data_dictionary_SHIPMENT_FULFILLMENT.csv` | Logistics | Shipping, delivery |
| `data_dictionary_SUSTAINABILITY_ESG.csv` | ESG | Environmental, social, governance |
| `data_dictionary_TECHNOLOGY_MANUFACTURING.csv` | Tech Mfg | Electronics, semiconductors |
| `data_dictionary_UTILITIES.csv` | Utilities | Power, water, gas distribution |

**Usage**: Open the relevant CSV during spec generation. Use entity names, column
names, and data types from the dictionary as the starting point for ATOMIC tables.

Do NOT change any other content. Preserve the Anti-Patterns section and
Pre-Flight Checklist that follow.
Do NOT modify any other files.
```

---

### Prompt 08 — React Production Patterns Reference

**Spec ref**: Section 4.1 (lines 446-723)
**Goal**: Create the comprehensive production patterns guide for React+Cortex frontends.
**Creates**: `skills/specify/references/react-production-patterns.md`
**Depends on**: Nothing.
**Acceptance**: 15 pattern sections present with code examples (spec Section 14, Gap 2 test). Must include WebSocket Real-Time Pattern (spec lines 696-714).

```text
You are working in the repository at /Users/jurrutia/projects/isf-kit.

Create the file skills/specify/references/react-production-patterns.md

This is a reference document loaded during Step 7 (Implement) when building
React frontends. It contains battle-tested patterns from production Cortex demos.

The existing react-components.md covers the component library API. This file
covers the HOW — production patterns for race conditions, streaming, state
management, multi-agent orchestration, and visualization.

Requirements — include ALL of the following sections with code examples:

1. Header with blockquote: load during Step 7 when building React frontends.

2. Race Condition Prevention:
   - Problem: useEffect firing multiple times when global state (e.g., pendingPrompt
     from clicking a KPI card) triggers chat messages from other components
   - Solution: Track processed prompts with a useRef:
     processingPromptRef.current !== pendingPrompt guard
   - AbortController pattern: always abort previous stream before starting new one

3. SSE Buffer Management:
   - Problem: SSE chunks may split mid-line across network packets
   - Solution: buffer += decoder.decode(value, {stream: true}); lines = buffer.split('\n');
     buffer = lines.pop() || '' to keep incomplete line for next iteration

4. Context Injection Pattern:
   - Prepend page/selection context to user prompts for contextual AI responses
   - Example: if selectedAsset, wrap prompt with [Context: User is viewing asset ...]

5. Zustand Chat State:
   - Minimal ChatState interface: messages, addMessage, updateMessage, clearMessages,
     pendingPrompt, setPendingPrompt

6. FastAPI SSE Headers:
   - Critical headers for streaming through proxies: Cache-Control: no-cache,
     Connection: keep-alive, X-Accel-Buffering: no (required for nginx)

7. Multi-Agent Orchestration:
   - Pattern: Intent classification -> agent routing
   - Flow diagram: User Message -> Orchestrator -> Intent Classification -> Route -> Aggregate
   - Intent categories table: analytical, search/history, recommend, status/current,
     comparison, general — each with route target and fallback

8. Cortex Service Integration Patterns (3 SQL examples):
   - SEARCH_PREVIEW for RAG queries
   - ANALYST for text-to-SQL with semantic model
   - COMPLETE for LLM generation

9. Fallback Query Pattern:
   - Always implement: Cortex Analyst -> pattern-matched SQL -> error explanation
   - Python code showing the 3-tier fallback

10. Domain-Specific LLM Prompting:
    - Structure: role definition, context data (JSON), output requirements, terminology
    - Python f-string template example

11. Chart Color Consistency:
    - Define ENTITY_COLORS as Record<string, string> globally
    - Use same colors in selection UI chips and Recharts Line/Area strokes

12. Recharts Patterns:
    - Inverted Y-axis (for depth charts): <YAxis reversed domain={['dataMin','dataMax']} />
    - Area gradients: linearGradient defs with entity-specific colors

13. Agent Status Indicators:
    - Visual pattern: array of agents with name, icon, status
    - Render with colored dots (emerald for active, slate for idle)

14. Markdown Rendering with Tailwind:
    - prose prose-sm prose-invert max-w-none with customized spacing classes

15. WebSocket Real-Time Pattern:
    - For live data panels that need push updates (not request-response)
    - Python ConnectionManager class with active_connections dict keyed by entity_id
    - Methods: connect(websocket, entity_id), broadcast(entity_id, data)
    - Use WebSocket accept(), send_json(), and list-based connection tracking
    - Pattern: connect -> add to entity list -> broadcast updates -> disconnect cleanup

All code examples should be TypeScript/TSX for frontend, Python for backend.
Use realistic variable names consistent with Cortex Agent terminology.

Do NOT create any other files.
```

---

### Prompt 09 — Wire Gap 2 into react-components.md

**Spec ref**: Section 4.2 (lines 725-735)
**Goal**: Add cross-reference from the component library doc to the production patterns doc.
**Modifies**: `skills/specify/references/react-components.md`
**Depends on**: Prompt 08 (references react-production-patterns.md).
**Acceptance**: New "## Production Patterns" section inserted before the checklist, referencing `references/react-production-patterns.md`.

```text
You are working in the repository at /Users/jurrutia/projects/isf-kit.

Modify the file skills/specify/references/react-components.md to add a
cross-reference to the new production patterns document.

Find the "## React Frontend Checklist" section (the last section in the file,
starting around line 135).

BEFORE that checklist section, insert a new section:

## Production Patterns

For implementation-time patterns (race conditions, SSE buffer management,
multi-agent orchestration, fallback strategies, chart consistency), load
`references/react-production-patterns.md`.

That document covers:
- Race condition prevention with useRef guards and AbortController
- SSE buffer management for split-chunk handling
- Context injection for contextual AI responses
- Zustand chat state management
- Multi-agent intent classification and routing
- Cortex service integration (Search, Analyst, Complete)
- Fallback query patterns (3-tier)
- Chart color consistency across components

This is a small, targeted addition. Do NOT change any existing content in the file.
Do NOT modify any other files.
```

---

### Prompt 10 — Persona Reflection Sub-Skill

**Spec ref**: Section 6.1 (lines 994-1126)
**Goal**: Create the reflect sub-skill for persona QA (new Step 5.5).
**Creates**: `skills/specify/reflect/SKILL.md`
**Depends on**: Nothing.
**Acceptance**: 6-step workflow present with stopping point after Step 6; coverage matrix, STAR completeness, visual strategy alignment, gaps, and persona worksheets in report template (spec Section 14, Gap 4 test).

```text
You are working in the repository at /Users/jurrutia/projects/isf-kit.

Create the file skills/specify/reflect/SKILL.md

This is a new sub-skill that adds a persona reflection QA step to the specify
workflow. It runs after analyze/SKILL.md passes and before generate/SKILL.md.

Requirements:

1. YAML frontmatter:
   ---
   name: specify-reflect
   description: "Persona reflection QA - verify persona coverage, STAR
     completeness, and visual strategy alignment. Use for: persona review,
     narrative QA, visual strategy check. Triggers: /speckit.reflect,
     persona review, STAR check"
   parent_skill: specify
   ---

2. Title: "# Reflect - Persona Reflection QA"
   Blockquote: "Verify persona coverage, STAR completeness, and visual strategy
   alignment before generating data and implementing."

3. When to Load: After analyze/SKILL.md passes quality checks, before generate/SKILL.md.

4. Prerequisites: specs/{demo-name}/spec.md must exist with Section 2 (Personas
   & Stories) and Section 5 (Application UX).

5. Six-step workflow:

   Step 1: Extract Personas
   - Load spec.md, extract all personas (Strategic, Operational, Technical),
     STAR journeys, application pages, component mapping

   Step 2: Persona Coverage Review
   Table with checks: Entry point exists, Pain points addressed (at least 1
   maps to a defined pain point), Terminology fit (matches role level),
   Quantifiable KPI (at least 1 measurable metric)

   Step 3: STAR Navigation Assessment
   For each persona, verify all 4 STAR elements:
   - Situation: KPI card or metric showing current gap/problem
   - Task: Clear statement of what needs to be decided
   - Action: Interactive element (filter, toggle, parameter, chat input)
   - Result: Visualization showing impact (before/after, projected savings)
   Flag missing or vague elements.

   Step 4: Role-Based Visual Strategy
   Table mapping persona type to expected visuals and anti-patterns:
   - Executive/Strategic: KPI cards, before/after charts | Anti: raw data tables
   - Operational/Analyst: Interactive tables, histograms, filters | Anti: only aggregations
   - Technical/Data: ROC curves, feature importance, raw explorer | Anti: no drill-down

   Step 5: Tone Alignment Check
   Do/Avoid table: lead with conclusion, quantified impact, active verbs, tight structure

   Step 6: Produce Reflection Report
   MANDATORY STOPPING POINT. Present report with these sections:
   - Coverage Matrix (persona x check table)
   - STAR Completeness (persona x S/T/A/R present/missing table)
   - Visual Strategy Alignment (persona x visuals x appropriate? table)
   - Gaps Found (numbered list with persona, issue, recommendation)
   - Persona Reflection Worksheets (template per persona)

6. Common Issues and Fixes table:
   - No persona-specific entry point -> Add role-based landing/tab
   - Action doesn't change outcome -> Make results reactive and quantified
   - Metrics are vague -> Use explicit KPI deltas or percentages
   - Language mismatched -> Rewrite labels using role vocabulary

7. Stopping Points section: one stopping point after Step 6 report.

8. Output section showing the reflection report was generated.

Do NOT create any other files.
```

---

### Prompt 11 — Wire Gap 4 into SKILL.md

**Spec ref**: Section 6.2 (lines 1127-1145)
**Goal**: Add Step 5.5 and the reflect sub-skill reference to the main workflow.
**Modifies**: `skills/specify/SKILL.md`
**Depends on**: Prompt 10 (references reflect/SKILL.md).
**Acceptance**: Step 5.5 in workflow diagram between Steps 5 and 6; Reflect row in sub-skills table; stopping point added (spec Section 14, Integration test "Workflow continuity").

```text
You are working in the repository at /Users/jurrutia/projects/isf-kit.

Modify the file skills/specify/SKILL.md to add the new persona reflection step
(Step 5.5) and its sub-skill reference.

THREE CHANGES:

CHANGE 1: In the "Workflow Decision Tree" ASCII diagram, add Step 5.5 between
Step 5 and Step 6.

Find this sequence:
Step 5: Quality Gate → Load analyze/SKILL.md
  ↓
Step 6: Generate Data → Load generate/SKILL.md

Replace with:
Step 5: Quality Gate → Load analyze/SKILL.md
  ↓
Step 5.5: Persona Reflection → Load reflect/SKILL.md
  ↓
Step 6: Generate Data → Load generate/SKILL.md

CHANGE 2: In the "## Sub-Skills" table, add a row for Reflect.

Find this row:
| Generate | `generate/SKILL.md` | After analyze passes |

Insert BEFORE it:
| Reflect | `reflect/SKILL.md` | After analyze passes, before generate |

CHANGE 3: In the "## Stopping Points" section, add a stopping point.

Find:
- ✋ After plan presentation (in plan/SKILL.md)

Insert AFTER it:
- ✋ After persona reflection report (Step 5.5)

These are three small, targeted insertions. Do NOT change any other content.
Do NOT modify any other files.
```

---

### Prompt 12 — CI Test Cycle Template

**Spec ref**: Section 7.1 (lines 1149-1229)
**Goal**: Create the CI/CD test cycle bash script template.
**Creates**: `skills/specify/templates/ci_test_cycle.sh`
**Depends on**: Nothing.
**Acceptance**: 5 sequential steps (Clean, Deploy, Test, Run, Verify); uses `snow sql` not `snowsql`; `CONNECTION_NAME` from env var with default "demo" (spec Section 14, Gap 5 test).

```text
You are working in the repository at /Users/jurrutia/projects/isf-kit.

Create the file skills/specify/templates/ci_test_cycle.sh

This is a bash script template for automated CI/CD test cycles. It will be
copied into each new demo project and customized.

Requirements:

1. Shebang: #!/bin/bash
2. set -e and set -o pipefail for strict error handling
3. Header comment block explaining purpose and customization points

4. Configuration variables at the top:
   - CONNECTION_NAME="${SNOWFLAKE_CONNECTION:-demo}"
   - MIN_EXPECTED_ROWS=10  (with comment: customize per project)
   - TIMEOUT_SECONDS=600

5. Color variables for output: RED, GREEN, NC (no color)

6. Script directory detection and cd to it:
   SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

7. Five sequential steps, each with echo headers:

   Step 1: Clean — run ./clean.sh -c $CONNECTION_NAME --force
   Step 2: Deploy — run ./deploy.sh -c $CONNECTION_NAME
   Step 3: Test queries — run ./run.sh -c $CONNECTION_NAME test
           (with || { echo "Query validation failed"; exit 1; })
   Step 4: Run main workflow — wrapped in timeout $TIMEOUT_SECONDS
           ./run.sh -c $CONNECTION_NAME main
           (with failure/timeout handling)
   Step 5: Verify outputs — use snow sql to COUNT(*) from an output table
           Compare against MIN_EXPECTED_ROWS
           Print PASSED (green) or FAILED (red) with row count

8. Step 5 should use snow sql (not snowsql which is deprecated):
   snow sql -c $CONNECTION_NAME -q "SELECT COUNT(*) FROM DB.SCHEMA.OUTPUT_TABLE;" -o tsv
   With a comment to replace DB.SCHEMA.OUTPUT_TABLE with project's actual table.

9. Exit 0 on pass, exit 1 on fail.

The file should be chmod +x ready (we'll handle permissions separately).

Do NOT create any other files.
```

---

### Prompt 13 — Wire Gaps 5+6 into testing-spec.md

**Spec ref**: Section 7.2 (lines 1231-1269) + Section 8.1 (lines 1272-1324)
**Goal**: Add 6-layer debugging, common issues, CI/CD reference, block-release signals, guideline review matrix, security audit, and release gate.
**Modifies**: `skills/specify/references/testing-spec.md`
**Depends on**: Prompt 12 (references ci_test_cycle.sh).
**Acceptance**: Block-release signals has 8 items; guideline review matrix has 10 categories; release gate has 3 conditions (spec Section 14, Gap 6 test + Integration test "Testing depth").

```text
You are working in the repository at /Users/jurrutia/projects/isf-kit.

Modify the file skills/specify/references/testing-spec.md to add layered
debugging, common issues, CI/CD integration, block-release signals, a guideline
review matrix, React security audit, and a release gate.

The file currently ends at line 167 with:
"7. **Re-deploy** — Run `deploy.sh` again to verify idempotent deployment"

Append ALL of the following sections after that final line:

---

## 6-Layer Debugging Framework

When tests fail, debug from bottom up:

| Layer | What to Check | Diagnostic Commands |
|-------|--------------|---------------------|
| 1. Connection | Profile resolves, warehouse running | `snow connection test -c demo`, `SHOW WAREHOUSES` |
| 2. SQL Objects | All tables/views/procedures exist | `SHOW TABLES IN SCHEMA RAW`, `SHOW VIEWS IN SCHEMA {DATA_MART}` |
| 3. Data | Row counts correct, referential integrity | `SELECT COUNT(*) FROM`, FK join checks |
| 4. Cortex Services | Agent/Search/Analyst respond | `SHOW CORTEX AGENTS`, `SHOW CORTEX SEARCH SERVICES` |
| 5. Application | Pages load, no console errors | Browser console, network tab, `curl /health` |
| 6. Integration | End-to-end user journey works | Full test cycle: question -> response -> visualization |

**Debug order**: Always start at Layer 1 and work up. A Layer 3 failure caused by a Layer 1 issue wastes time.

## Common Issues and Fixes

| Symptom | Layer | Cause | Fix |
|---------|-------|-------|-----|
| `snow sql` returns auth error | 1 | Connection profile invalid | `snow connection test`, verify config |
| Table not found | 2 | deploy.sh didn't complete | Re-run `./deploy.sh`, check for errors |
| 0 rows in DATA_MART | 3 | ATOMIC transform failed | Check RAW row counts first, then ATOMIC |
| Agent returns 404 | 4 | Wrong endpoint path | Use `/agents/` not `/cortex-agents/` |
| Blank page | 5 | Build failed | Run `npm run build`, check for errors |
| SSE stream hangs | 6 | Missing SSE headers | Add `Cache-Control: no-cache`, `Connection: keep-alive` |
| `verified_at` error | 4 | ISO string instead of Unix int | Use `int(datetime.timestamp())` |
| Analyst generates bad JOINs | 4 | Missing `primary_key` in semantic model | Add PK to every table in semantic model |

## CI/CD Integration

Use `templates/ci_test_cycle.sh` as the CI/CD test script. Customize:
- `MIN_EXPECTED_ROWS` — minimum output rows for your project
- `TIMEOUT_SECONDS` — max time for main workflow
- Output table reference in Step 5

## Block-Release Signals

These are automatic no-ship criteria. If ANY is true, the demo **must not be published**:

| # | Signal | Check Command |
|---|--------|--------------|
| 1 | Any golden query returns wrong result | Run all golden queries, compare |
| 2 | `deploy.sh` not idempotent | `./clean.sh --force && ./deploy.sh && ./deploy.sh` |
| 3 | Hardcoded credentials in any file | `grep -r "password\|secret\|token" --include="*.py" --include="*.ts" --include="*.sql"` |
| 4 | `ACCOUNTADMIN` role used | `grep -r "ACCOUNTADMIN" sql/` |
| 5 | CSP-blocked libraries in bundle | `grep -r "d3\|leaflet\|plotly.geo\|mapbox" frontend/package.json` |
| 6 | Hidden Discovery not reliably present | Run 3x, verify insight appears each time |
| 7 | React build fails | `cd frontend && npm run build` exits non-zero |
| 8 | Secrets in client bundle | `grep -r "token\|secret\|password\|Bearer" dist/` |

## Guideline Review Matrix

Score each category pass/fail:

| # | Category | Key Checks | Pass If |
|---|----------|-----------|---------|
| 1 | SQL Compliance | No CHECK constraints, uppercase names, fully qualified refs | All checks pass |
| 2 | Security | No hardcoded creds, no `.env` committed, no ACCOUNTADMIN | All checks pass |
| 3 | Project Structure | 3 scripts in root, correct directory names | All present |
| 4 | Data Quality | seed=42, pre-generated, referential integrity, realistic dates | All checks pass |
| 5 | Notebooks | Top-to-bottom execution, no hardcoded paths, outputs cleared | All pass (if applicable) |
| 6 | Streamlit | No local run, CSP clean, connection pattern, error handling | All pass (if applicable) |
| 7 | React | Build succeeds, no CSP violations, responsive, SSE works | All pass (if applicable) |
| 8 | Documentation | DRD complete, README with setup, known limitations | All present |
| 9 | Cortex Services | Agent responds, golden queries pass, search returns relevant | All pass |
| 10 | Deployment Scripts | deploy.sh idempotent, clean.sh confirms, run.sh test+main | All pass |

## React Security Audit

| Check | Command | Pass If |
|-------|---------|---------|
| No secrets in build output | `grep -r "token\|secret\|password" dist/` | No matches |
| `node_modules/` in .gitignore | `grep node_modules .gitignore` | Present |
| `logs/` in .gitignore | `grep logs .gitignore` | Present |
| No inline secrets in source | `grep -r "Bearer\|sk-\|pat_" frontend/src/` | No matches |
| Dependency audit clean | `npm audit --production` | No critical/high |

## Release Gate

| Condition | Decision |
|-----------|----------|
| All block-release signals clear + all guideline categories pass | **SHIP** |
| Any block-release signal true | **NO SHIP** (must fix first) |
| Block-release clear but 1+ guideline category fails | **CONDITIONAL** (document exceptions, get approval) |

---

This is an append-only change. Do NOT modify any existing content in the file.
Do NOT modify any other files.
```

---

### Prompt 14 — Synthetic Data Generator + Wire into generate/SKILL.md

**Spec ref**: Section 9.1 (lines 1328-1412) + Section 9.2 (lines 1414-1437)
**Goal**: Create the generator template and add generation principles to the generate sub-skill.
**Creates**: `skills/specify/templates/generate_synthetic_data.py`
**Modifies**: `skills/specify/generate/SKILL.md`
**Depends on**: Nothing.
**Acceptance**: `RANDOM_SEED = 42` present; generate_sample_data function; argparse with --output-dir and --num-rows; Data Generation Principles table and Regeneration Guidance table in generate/SKILL.md (spec Section 14, Gap 7 test).

```text
You are working in the repository at /Users/jurrutia/projects/isf-kit.

TWO TASKS:

TASK 1: Create the file skills/specify/templates/generate_synthetic_data.py

This is a Python template for generating synthetic demo data. Requirements:

- Shebang: #!/usr/bin/env python3
- Module docstring explaining usage (python3 utils/generate_synthetic_data.py
  --output-dir data/synthetic) and the 3 rules: RANDOM_SEED=42, generate once
  commit to repo, never run during deployment
- RANDOM_SEED = 42 as a module-level constant with "CRITICAL" comment
- Imports: random, argparse, csv, pathlib.Path, datetime, timedelta
- Function generate_sample_data(num_rows=1000) -> list[dict]:
  Generates sample records with fields: id, name, category, value, created_date
  Using random.choice for categories, random.uniform for values,
  random.randint for date offsets from 2024-01-01
- Function main():
  - argparse with --output-dir (default "data/synthetic") and --num-rows (default 1000)
  - Sets random.seed(RANDOM_SEED)
  - Creates output directory with mkdir(parents=True, exist_ok=True)
  - Generates data, writes to CSV with DictWriter
  - Prints row count, seed used, and reminder to commit
- if __name__ == "__main__": main()
- Python >=3.10 syntax (list[dict] not List[Dict])
- No external dependencies beyond stdlib

TASK 2: Modify the file skills/specify/generate/SKILL.md

Add two sections:

ADDITION 1: After "### Step 2: Validate Domain Model" section (after the
"If validation fails..." paragraph, before "### Step 3: Select Generation
Mode"), insert:

### Data Generation Principles

| Principle | Rule |
|-----------|------|
| Reproducibility | `RANDOM_SEED = 42` always |
| Commit pattern | Generate once, commit to `data/synthetic/` |
| Deploy-time generation | **Never** generate data during deployment |
| Template | Use `templates/generate_synthetic_data.py` as starter |
| Directory convention | `data/synthetic/{entity_name}.csv` |

ADDITION 2: After the "## Output" section (after the output code block ending
with "Total: 210,000 rows loaded in 12.3 seconds"), insert:

## Regeneration Guidance

| When | How | Verify |
|------|-----|--------|
| Schema changes | Re-run generator, re-commit CSVs | Column names match new schema |
| New entities added | Add generator function, produce CSV | Referential integrity across files |
| Row count changes | Update `--num-rows`, re-run | Hidden discovery still present |
| Bug in generated data | Fix generator, re-run with same seed | Diff against previous to confirm fix |

Do NOT change any other existing content in either file.
Do NOT modify any other files.
```

---

### Prompt 15 — Wire Gaps 8+9 (DRD Workflow + Constraint Update)

**Spec ref**: Section 10.1 (lines 1441-1466) + Section 12 (lines 1505-1511)
**Goal**: Add DRD generation workflow and quality gate to drd-template.md. Add one constraint to constraints.md.
**Modifies**: `skills/specify/references/drd-template.md`, `skills/specify/references/constraints.md`
**Depends on**: Nothing.
**Acceptance**: DRD workflow has 4 steps (Gather, Draft, Review, Finalize); DRD quality gate has 5 checks; constraints.md has new "Generate data at deploy time" row (spec Section 14, Gap 8 test + Integration test "Constraint completeness").

```text
You are working in the repository at /Users/jurrutia/projects/isf-kit.

TWO FILES to modify:

FILE 1: skills/specify/references/drd-template.md

Append after the "## Quality Checklist" section (after the last checklist item
"- [ ] Success criteria include time-to-insight metric"):

## DRD Generation Workflow

| Step | Action | Output |
|------|--------|--------|
| 1. Gather Context | Load research brief + intake answers + industry defaults | Input document |
| 2. Draft Sections | Generate all 6 DRD sections using templates above | Draft DRD |
| 3. Review | Validate against quality checklist | Issue list |
| 4. Finalize | Resolve gaps, confirm hidden discovery, confirm STAR completeness | Final DRD |

## DRD Quality Gate

| Check | Required |
|-------|----------|
| All 7 intake categories addressed | industry, audience, persona, pain points, hidden discovery, self-guided, data context |
| Component mapping complete | Every feature maps to a Snowflake capability |
| Hidden discovery engineered | Data design guarantees the insight appears |
| STAR journeys complete | Each persona has all 4 elements (Situation, Task, Action, Result) |
| Terminology consistent | Customer terms mapped to standard terms throughout |

FILE 2: skills/specify/references/constraints.md

In the "## Red Flags - NEVER Do These" table, add one new row at the end
of the table (after the row "| Hardcode credentials | Use `connection_name=`
pattern |"):

| Generate data at deploy time | Pre-generate with seed=42, commit to `data/synthetic/` |

This is a single row addition to an existing table. Do NOT change any other
content in either file.
Do NOT modify any other files.
```

---

### Prompt 16 — Copy CSV Dictionaries + Final data-architecture.md Update

**Spec ref**: Section 11.1 (lines 1470-1497) + Section 11.2 (lines 1499-1501)
**Goal**: Copy all 20 industry data dictionary CSVs and verify data-architecture.md references them correctly.
**Creates**: `skills/specify/references/dictionaries/` directory with 20 CSV files
**Depends on**: Prompt 07 already updated data-architecture.md to reference this directory.
**Acceptance**: `ls references/dictionaries/*.csv | wc -l` == 20 (spec Section 14, Gap 9 test).

```text
You are working in the repository at /Users/jurrutia/projects/isf-kit.

TASK: Copy 20 CSV data dictionary files from the source knowledge base into the
specify skill's references directory.

Source directory:
/Users/jurrutia/projects/gnn_supply_chain_risk/skills/snowflake-demo-data-architecture/assets/dictionary/

Target directory (create it):
/Users/jurrutia/projects/isf-kit/skills/specify/references/dictionaries/

Copy these 20 files (preserving exact filenames):
- core.data_dictionary.csv
- data_dictionary_ATOMIC.csv
- data_dictionary_AEROSPACE.csv
- data_dictionary_AGRICULTURE.csv
- data_dictionary_AUTOMOTIVE.csv
- data_dictionary_CLM.csv
- data_dictionary_CONNECTED_PRODUCTS.csv
- data_dictionary_CONSTRUCTION.csv
- data_dictionary_DIGITAL_TWIN.csv
- data_dictionary_ENERGY_TRADING.csv
- data_dictionary_FACILITY_SITE_MANAGEMENT.csv
- data_dictionary_GENERAL_REFERENCE.csv
- data_dictionary_MINING.csv
- data_dictionary_OG.csv
- data_dictionary_PROCESS_MANUFACTURING.csv
- data_dictionary_REGULATORY.csv
- data_dictionary_SHIPMENT_FULFILLMENT.csv
- data_dictionary_SUSTAINABILITY_ESG.csv
- data_dictionary_TECHNOLOGY_MANUFACTURING.csv
- data_dictionary_UTILITIES.csv

Use a shell command:
mkdir -p /Users/jurrutia/projects/isf-kit/skills/specify/references/dictionaries/
cp /Users/jurrutia/projects/gnn_supply_chain_risk/skills/snowflake-demo-data-architecture/assets/dictionary/*.csv /Users/jurrutia/projects/isf-kit/skills/specify/references/dictionaries/

Then verify: ls the target directory and confirm exactly 20 .csv files exist.

IMPORTANT: The file references/data-architecture.md was already updated in a
previous step to reference `references/dictionaries/` with a table listing all
20 files. Do NOT modify data-architecture.md again. Just copy the CSV files
and verify the count.

Do NOT modify any other files.
```

---

## Verification Checklist

> Mirrors `gap-closure-spec.md` Section 14 (lines 1531-1579).

After all 16 prompts have been executed, verify:

### New Files (10 + 20 CSVs)

```bash
# Should all exist
ls skills/specify/templates/sql/schema_template.sql
ls skills/specify/templates/backend/snowflake_service.py
ls skills/specify/templates/backend/cortex_agent_service.py
ls skills/specify/templates/frontend/hooks/useCortexAgent.ts
ls skills/specify/references/transformation-approaches.md
ls skills/specify/references/react-production-patterns.md
ls skills/specify/reflect/SKILL.md
ls skills/specify/templates/ci_test_cycle.sh
ls skills/specify/templates/generate_synthetic_data.py
ls skills/specify/references/dictionaries/*.csv | wc -l  # Should be 20
```

### Modified Files (8)

```bash
# Check each has the expected new content
grep "Step 2.5: Project Initialization" skills/specify/implement/SKILL.md
grep "transformation-approaches.md" skills/specify/references/data-architecture.md
grep "references/dictionaries/" skills/specify/references/data-architecture.md
grep "react-production-patterns.md" skills/specify/references/react-components.md
grep "Step 5.5" skills/specify/SKILL.md
grep "reflect/SKILL.md" skills/specify/SKILL.md
grep "6-Layer Debugging" skills/specify/references/testing-spec.md
grep "Block-Release Signals" skills/specify/references/testing-spec.md
grep "Release Gate" skills/specify/references/testing-spec.md
grep "RANDOM_SEED" skills/specify/templates/generate_synthetic_data.py
grep "Regeneration Guidance" skills/specify/generate/SKILL.md
grep "Data Generation Principles" skills/specify/generate/SKILL.md
grep "DRD Generation Workflow" skills/specify/references/drd-template.md
grep "DRD Quality Gate" skills/specify/references/drd-template.md
grep "Generate data at deploy time" skills/specify/references/constraints.md
```

### Unit Testing (per gap — spec Section 14)

| Gap | Test | Pass Condition |
|-----|------|---------------|
| 1 | FastAPI template has all 4 endpoints | `/threads`, `/chat`, `/run`, `/health` all defined |
| 1 | useCortexAgent handles all event types | Switch covers: text_delta, tool_start, tool_end, tool_result, reasoning, message_complete, error |
| 1 | Schema template has 3 required schemas | RAW, ATOMIC, DATA_MART placeholders present |
| 2 | Production patterns doc covers all 15 patterns | Section headers match spec (including WebSocket Real-Time) |
| 3 | Transformation approaches has 5 SQL examples | Views, MVs, Dynamic Tables, Stored Procs, Streams+Tasks |
| 4 | reflect/SKILL.md has 6-step workflow | Steps 1-6 present with stopping point |
| 5 | CI test script has 5 steps | Clean, deploy, test, run, verify |
| 6 | Block-release signals has 8 items | All 8 listed with check commands |
| 7 | Generator template uses seed=42 | `RANDOM_SEED = 42` present |
| 8 | DRD workflow has 4 steps | Gather, Draft, Review, Finalize |
| 9 | 20 CSV files copied | `ls references/dictionaries/*.csv \| wc -l` == 20 |

### Integration Testing (spec Section 14)

| Test | Steps | Pass Condition |
|------|-------|---------------|
| Workflow continuity | Read SKILL.md, verify reflect step in diagram | Step 5.5 present between analyze and generate |
| Cross-references | Grep all `references/` mentions in SKILL.md and sub-skills | All referenced files exist |
| Template usability | Read implement/SKILL.md, verify backend/frontend template refs | Templates referenced with clear copy instructions |
| Constraint completeness | Read constraints.md, verify new entry | "Generate data at deploy time" row present |
| Testing depth | Read testing-spec.md, verify new sections | 6-layer debugging, common issues, block-release, review matrix, security audit, release gate all present |

### End-to-End Validation (spec Section 14)

Walk through the full specify workflow and confirm every phase has actionable content:

| Step | Sub-Skill | What Changed | Verify |
|------|-----------|-------------|--------|
| Step 0 | Research | (unchanged) | Still works |
| Step 1 | Intake | (unchanged) | Still works |
| Step 2 | Spec generation | `data-architecture.md` now points to `transformation-approaches.md` and `dictionaries/` | Cross-refs resolve |
| Step 3 | Plan | (unchanged) | Still works |
| Step 4 | Tasks | (unchanged) | Still works |
| Step 5 | Analyze | (unchanged) | Still works |
| Step 5.5 | **Reflect** | NEW — persona reflection QA | `reflect/SKILL.md` exists with 6-step workflow |
| Step 6 | Generate | `generate/SKILL.md` now enforces seed=42, has template ref | Principles table + regeneration guidance present |
| Step 7 | Implement | `implement/SKILL.md` now has 7-step scaffold + backend/frontend templates | Step 2.5 + template refs present |
| Step 8 | Deploy | (unchanged, SPCS-focused) | Still works |

### Cross-Reference Integrity

| Reference In | Points To | Should Exist After |
|-------------|-----------|-------------------|
| `implement/SKILL.md` | `templates/backend/cortex_agent_service.py` | Prompt 03 |
| `implement/SKILL.md` | `templates/backend/snowflake_service.py` | Prompt 02 |
| `implement/SKILL.md` | `templates/sql/schema_template.sql` | Prompt 01 |
| `implement/SKILL.md` | `templates/frontend/hooks/useCortexAgent.ts` | Prompt 04 |
| `implement/SKILL.md` | `references/react-production-patterns.md` | Prompt 08 |
| `data-architecture.md` | `references/transformation-approaches.md` | Prompt 06 |
| `data-architecture.md` | `references/dictionaries/*.csv` | Prompt 16 |
| `react-components.md` | `references/react-production-patterns.md` | Prompt 08 |
| `SKILL.md` | `reflect/SKILL.md` | Prompt 10 |
| `testing-spec.md` | `templates/ci_test_cycle.sh` | Prompt 12 |
| `generate/SKILL.md` | `templates/generate_synthetic_data.py` | Prompt 14 |

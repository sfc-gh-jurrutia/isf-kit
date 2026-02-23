# Specify Workflow Gap Closure Specification

> Developer-ready specification for closing all 9 gaps between the `snowflake-demo-*` knowledge base and the `specify` workflow. A developer can implement every item below without further clarification.

## 1. Strategic Overview

| Attribute | Value |
|-----------|-------|
| **Purpose** | Strengthen the specify workflow to produce production-quality Snowflake demo solutions |
| **Source Knowledge Base** | 8 `snowflake-demo-*` skills in `/Users/jurrutia/projects/gnn_supply_chain_risk/skills/` |
| **Target Workflow** | `specify` skill in `/Users/jurrutia/projects/isf-kit/skills/specify/` |
| **Gaps Identified** | 9 (1 critical, 3 high, 3 medium, 2 low) |
| **Files to Create** | 10 new files + 20 CSV dictionaries |
| **Files to Modify** | 8 existing files |
| **New Sub-Skill** | 1 (`reflect/SKILL.md`) |

### Problem Statement

The specify workflow covers ~60% of the knowledge in the snowflake-demo-* skills. Phase 1 integrated architecture patterns, constraints, and Cortex specs. But implementation scaffolding (the weakest link) has no backend templates, React production patterns are summarized instead of actionable, transformation approaches lack SQL examples, persona reflection QA is absent, testing lacks layered debugging, pre-publication lacks ship/no-ship gates, and data generation doesn't enforce the "generate once, commit" pattern.

### Gap Inventory

| # | Gap | Severity | Source Skill(s) |
|---|-----|----------|-----------------|
| 1 | Implementation scaffolding — no backend templates, no project init | **CRITICAL** | `snowflake-demo-react-app` |
| 2 | Production React patterns — no fallbacks, no multi-agent, no race prevention | **HIGH** | `snowflake-demo-react-app` |
| 3 | Transformation approaches — summary table vs. full decision tree + SQL | **HIGH** | `snowflake-demo-data-architecture` |
| 4 | Persona reflection QA step — completely absent | **HIGH** | `snowflake-demo-reflection-persona` |
| 5 | Full test cycle with layered debugging | **MEDIUM** | `snowflake-demo-testing` |
| 6 | Pre-publication depth — no block-release signals | **MEDIUM** | `snowflake-demo-prepublication-checklist` |
| 7 | Synthetic data generator template | **MEDIUM** | `snowflake-demo-data-generation` |
| 8 | DRD generation workflow and quality checklist | **LOW** | `snowflake-demo-drd-generation` |
| 9 | Industry data dictionary CSVs — text references only | **LOW** | `snowflake-demo-data-architecture` |

---

## 2. Architecture Decisions

### Updated Workflow

```
Start
  |
Step 0: Research (pre-intake)
  |
Step 1: Intake (2 rounds)
  |
Step 2: Generate spec.md + cortex-spec.yaml + prompt_plan.md
  |
  +---> [Ambiguities found] --> Load clarify/SKILL.md
  |                                  |
  +--> [Spec complete] ------------>|
                                    |
Step 3: Architecture --> Load plan/SKILL.md
  |
Step 4: Tasks --> Load tasks/SKILL.md
  |
Step 5: Quality Gate --> Load analyze/SKILL.md
  |
Step 5.5: Persona Reflection --> Load reflect/SKILL.md    <-- NEW
  |
Step 6: Generate Data --> Load generate/SKILL.md
  |
Step 7: Implement --> Load implement/SKILL.md             <-- STRENGTHENED
  |
Step 8: Deploy --> Load deploy/SKILL.md
```

### File Organization

```
skills/specify/
+-- SKILL.md                                  (modified)
+-- reflect/
|   +-- SKILL.md                              (NEW - Gap 4)
+-- references/
|   +-- constraints.md                        (modified)
|   +-- data-architecture.md                  (modified)
|   +-- react-components.md                   (modified)
|   +-- testing-spec.md                       (modified)
|   +-- drd-template.md                       (modified)
|   +-- react-production-patterns.md          (NEW - Gap 2)
|   +-- transformation-approaches.md          (NEW - Gap 3)
|   +-- dictionaries/                         (NEW - Gap 9)
|       +-- core.data_dictionary.csv
|       +-- data_dictionary_ATOMIC.csv
|       +-- data_dictionary_AEROSPACE.csv
|       +-- ... (20 CSV files total)
+-- templates/
|   +-- backend/
|   |   +-- cortex_agent_service.py           (NEW - Gap 1)
|   |   +-- snowflake_service.py              (NEW - Gap 1)
|   +-- frontend/
|   |   +-- hooks/
|   |       +-- useCortexAgent.ts             (NEW - Gap 1)
|   +-- sql/
|   |   +-- schema_template.sql               (NEW - Gap 1)
|   +-- ci_test_cycle.sh                      (NEW - Gap 5)
|   +-- generate_synthetic_data.py            (NEW - Gap 7)
+-- implement/
|   +-- SKILL.md                              (modified)
+-- generate/
    +-- SKILL.md                              (modified)
```

---

## 3. Gap 1: Implementation Scaffolding (CRITICAL)

### 3.1 `templates/backend/cortex_agent_service.py`

Full FastAPI router for Cortex Agent proxy. Adapt from source at `snowflake-demo-react-app/templates/cortex_agent_service.py` (460 lines).

**Requirements:**

#### Configuration Class

```python
class CortexAgentConfig:
    def __init__(
        self,
        account_url: Optional[str] = None,
        database: str = "MYDB",
        schema: str = "MYSCHEMA",
        agent_name: str = "MY_AGENT",
        warehouse: str = "COMPUTE_WH",
    ):
        self.account_url = account_url or os.getenv("SNOWFLAKE_ACCOUNT_URL")
        self.database = os.getenv("CORTEX_AGENT_DATABASE", database)
        self.schema = os.getenv("CORTEX_AGENT_SCHEMA", schema)
        self.agent_name = os.getenv("CORTEX_AGENT_NAME", agent_name)
        self.warehouse = os.getenv("SNOWFLAKE_WAREHOUSE", warehouse)

    @property
    def agent_endpoint(self) -> str:
        return (
            f"{self.account_url}/api/v2/databases/{self.database}"
            f"/schemas/{self.schema}/agents/{self.agent_name}:run"
        )

    @property
    def threads_endpoint(self) -> str:
        return f"{self.account_url}/api/v2/cortex/threads"
```

**Critical**: Endpoint path is `/agents/` NOT `/cortex-agents/`.

#### Authentication

```python
def get_auth_headers() -> Dict[str, str]:
    # Priority: PAT > OAuth > JWT
    pat = os.getenv("SNOWFLAKE_PAT") or os.getenv("SNOWFLAKE_TOKEN")
    if pat:
        return {"Authorization": f"Bearer {pat}"}
    oauth_token = os.getenv("SNOWFLAKE_OAUTH_TOKEN")
    if oauth_token:
        return {"Authorization": f"Bearer {oauth_token}"}
    raise ValueError("No authentication token found. Set SNOWFLAKE_PAT or SNOWFLAKE_OAUTH_TOKEN")
```

#### Endpoints

| Method | Path | Purpose | Response |
|--------|------|---------|----------|
| `POST` | `/threads` | Create conversation thread | `{ thread_id }` |
| `POST` | `/chat` | Non-streaming chat | `{ response, thread_id, message_id, sources, tool_calls, sql }` |
| `POST` | `/run` | SSE streaming chat | `StreamingResponse` with event stream |
| `GET` | `/health` | Health check | `{ status, agent, endpoint }` |

#### SSE Event Mapping

The `map_cortex_event()` function maps Cortex Agent events to frontend-consumable events:

| Cortex Event | Frontend Event | Key Fields |
|-------------|----------------|------------|
| `text`, `content_block_delta` | `text_delta` | `text` |
| `tool_use_start` | `tool_start` | `tool_name`, `tool_type`, `input` |
| `tool_use_end` | `tool_end` | `tool_name`, `result`, `sql`, `error`, `duration` |
| `tool_result` | `tool_result` | `tool_name`, `result`, `sql` |
| `thinking` | `reasoning` | `text` |
| `message_stop`, `done` | `message_complete` | `message_id`, `thread_id`, `citations[]` |
| `error` | `error` | `error`, `code` |

#### Streaming Implementation

```python
async def stream_agent_response(thread_id, message, parent_message_id="0"):
    payload = {
        "thread_id": thread_id,
        "parent_message_id": parent_message_id,
        "stream": True,
        "messages": [{"role": "user", "content": [{"type": "text", "text": message}]}]
    }
    async with httpx.AsyncClient() as client:
        async with client.stream(
            "POST", config.agent_endpoint,
            headers={**get_auth_headers(), "Content-Type": "application/json", "Accept": "text/event-stream"},
            json=payload, timeout=120.0,
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    event_data = line[6:]
                    if event_data == "[DONE]":
                        yield f"data: [DONE]\n\n"
                        break
                    event = json.loads(event_data)
                    mapped = map_cortex_event(event)
                    yield f"data: {json.dumps(mapped)}\n\n"
```

**SSE Response Headers** (critical for proxy compatibility):

```python
headers={
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Thread-Id": thread_id,
}
```

#### Error Handling Strategy

| Error Type | HTTP Status | Response |
|-----------|-------------|----------|
| `httpx.HTTPStatusError` | Proxied from upstream | Original error message |
| Connection timeout | 504 | `"Agent request timed out"` |
| Auth failure | 401 | `"No authentication token found"` |
| Config error | 500 | `"SNOWFLAKE_ACCOUNT_URL required"` |
| Generic exception | 500 | Exception message |

#### Request/Response Models

```python
class ChatRequest(BaseModel):
    message: str
    thread_id: Optional[str] = None
    parent_message_id: Optional[str] = "0"
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    response: str
    thread_id: Optional[str] = None
    message_id: Optional[str] = None
    sources: List[Dict[str, Any]] = []
    tool_calls: List[Dict[str, Any]] = []
    sql: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
```

---

### 3.2 `templates/backend/snowflake_service.py`

SnowflakeService class with connection pool pattern. Source: `snowflake-demo-react-app/references/workflow.md`.

**Requirements:**

```python
import os
import snowflake.connector
from contextlib import contextmanager

class SnowflakeService:
    def __init__(self):
        self.connection_name = os.getenv("SNOWFLAKE_CONNECTION_NAME", "demo")
        self._pool = None

    @contextmanager
    def get_connection(self):
        conn = snowflake.connector.connect(connection_name=self.connection_name)
        try:
            yield conn
        finally:
            conn.close()

    def execute_query(self, sql: str, params: dict = None) -> list[dict]:
        with self.get_connection() as conn:
            cursor = conn.cursor(snowflake.connector.DictCursor)
            try:
                cursor.execute(sql, params or {})
                return cursor.fetchall()
            finally:
                cursor.close()

    def execute_scalar(self, sql: str, params: dict = None):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                cursor.execute(sql, params or {})
                row = cursor.fetchone()
                return row[0] if row else None
            finally:
                cursor.close()
```

**Critical**: Always use `connection_name=` parameter. Never hardcode credentials.

---

### 3.3 `templates/frontend/hooks/useCortexAgent.ts`

React hook for Cortex Agent SSE streaming. Adapt from `snowflake-demo-react-app/templates/hooks/useCortexAgent.ts` (270 lines).

**Requirements:**

#### Type Definitions

```typescript
interface CortexAgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  parts: CortexMessagePart[];
  isStreaming?: boolean;
  timestamp: Date;
}

type CortexMessagePart =
  | { type: 'text'; text: string }
  | { type: 'tool'; name: string; toolType: string; status: ToolStatus; input?: any; output?: any; sql?: string; error?: string; duration?: number }
  | { type: 'reasoning'; text: string; stage: ReasoningStage }
  | { type: 'source'; title: string; snippet?: string; score?: number; url?: string };

type ToolStatus = 'running' | 'complete' | 'error';
type ReasoningStage = 'idle' | 'classifying' | 'searching' | 'analyzing' | 'generating';

interface UseCortexAgentOptions {
  endpoint: string;
  threadId?: string;
  onEvent?: (event: CortexAgentEvent) => void;
}

interface UseCortexAgentReturn {
  messages: CortexAgentMessage[];
  status: 'idle' | 'streaming' | 'error';
  sendMessage: (text: string) => Promise<void>;
  threadId: string | undefined;
  reasoningStage: ReasoningStage;
  clearMessages: () => void;
}
```

#### Core Behavior

1. **Send message**: Creates user message, creates empty assistant message with `isStreaming: true`, sets status to `streaming`
2. **SSE connection**: `fetch(endpoint, { method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'text/event-stream'}, body: JSON.stringify({message, thread_id}), signal: abortController.signal })`
3. **Buffer management**: `buffer += decoder.decode(value, { stream: true }); lines = buffer.split('\n'); buffer = lines.pop() || ''`
4. **Event dispatch**: Switch on `event_type` → update message parts, content, or status
5. **Abort on new send**: `abortControllerRef.current?.abort()` before creating new controller
6. **Cleanup on unmount**: Abort any active stream

#### Event Handling Matrix

| Event Type | State Update |
|-----------|-------------|
| `text_delta` / `text` | Append `event.text` to `fullText`, update message content |
| `tool_start` / `tool_use_start` | Set reasoning stage (`cortex_search` → `searching`, else → `analyzing`), add tool part with `status: 'running'` |
| `tool_end` / `tool_use_end` | Set reasoning stage to `generating`, update tool part to `complete` or `error` |
| `tool_result` | Update tool part with `output` and `sql` |
| `thinking` / `reasoning` | Add reasoning part to message |
| `message_complete` / `done` | Extract citations, set threadId from response |
| `error` | Set status to `error` |

---

### 3.4 `templates/sql/schema_template.sql`

Database and schema creation template. Adapt from `snowflake-demo-data-architecture/assets/schema_template.sql`.

**Requirements:**

```sql
-- =============================================================================
-- SCHEMA CREATION TEMPLATE
-- =============================================================================
-- Replace <PROJECT_DATABASE> and <DATA_MART_NAME> with your project values
-- =============================================================================

-- 1. CREATE DATABASE
CREATE DATABASE IF NOT EXISTS <PROJECT_DATABASE>;
USE DATABASE <PROJECT_DATABASE>;

-- 2. REQUIRED SCHEMAS
CREATE SCHEMA IF NOT EXISTS RAW
COMMENT = 'Landing zone for external data in original format. CDC staging and file loads.';

CREATE SCHEMA IF NOT EXISTS ATOMIC
COMMENT = 'Enterprise Relational Model. Normalized, canonical business entities.';

CREATE SCHEMA IF NOT EXISTS <DATA_MART_NAME>
COMMENT = 'Consumer-facing data products. Denormalized views and aggregations.';

-- 3. OPTIONAL SCHEMAS (uncomment if needed)
-- CREATE SCHEMA IF NOT EXISTS DATA_ENGINEERING
-- COMMENT = 'Intermediate ETL staging. Deduplication and complex processing.';

-- CREATE SCHEMA IF NOT EXISTS DATA_SCIENCE
-- COMMENT = 'Data science experimentation. Exploration tables and analysis outputs.';

-- CREATE SCHEMA IF NOT EXISTS ML_PROCESSING
-- COMMENT = 'ML pipeline artifacts. Training datasets and model outputs.';

-- 4. PERMISSIONS (adjust roles as needed)
-- GRANT USAGE ON DATABASE <PROJECT_DATABASE> TO ROLE DATA_ENGINEER;
-- GRANT ALL ON SCHEMA RAW TO ROLE DATA_ENGINEER;
-- GRANT ALL ON SCHEMA ATOMIC TO ROLE DATA_ENGINEER;
-- GRANT USAGE ON SCHEMA <DATA_MART_NAME> TO ROLE DATA_ANALYST;
-- GRANT SELECT ON ALL TABLES IN SCHEMA <DATA_MART_NAME> TO ROLE DATA_ANALYST;
```

---

### 3.5 Modify `implement/SKILL.md`

**Add after "Step 2: Work Through Tasks":**

#### Step 2.5: Project Initialization (React+FastAPI)

When the plan specifies a React+FastAPI frontend, follow this 7-step scaffold:

| Step | Action | Template/Source |
|------|--------|-----------------|
| 1 | Init Vite+React+TS | `npm create vite@latest frontend -- --template react-ts` |
| 2 | Configure Tailwind | Install tailwindcss, create config, add Snowflake design tokens |
| 3 | Create Layout | Copy `DashboardShell` from `templates/ui/layouts/` |
| 4 | Create FastAPI main | `uvicorn main:app`, CORS middleware, include routers |
| 5 | Create SnowflakeService | Copy from `templates/backend/snowflake_service.py` |
| 6 | Add Cortex Agent proxy | Copy from `templates/backend/cortex_agent_service.py`, customize config |
| 7 | Configure Vite proxy + SWR | Proxy `/api` to FastAPI, install SWR for data fetching |

**Add to "Step 3: Generate Real Code":**

**Backend Templates:**
- Copy `templates/backend/cortex_agent_service.py` into `backend/api/` — customize `CortexAgentConfig` defaults
- Copy `templates/backend/snowflake_service.py` into `backend/services/` — set connection name
- Copy `templates/sql/schema_template.sql` into `sql/01_setup.sql` — replace `<PROJECT_DATABASE>` and `<DATA_MART_NAME>`

**Frontend Templates:**
- Copy `templates/frontend/hooks/useCortexAgent.ts` into `frontend/src/hooks/`
- Load `references/react-production-patterns.md` — apply race condition prevention, SSE buffer management, fallback patterns

---

## 4. Gap 2: Production React Patterns (HIGH)

### 4.1 `references/react-production-patterns.md`

Source: `snowflake-demo-react-app/references/copilot-learnings.md` + `cortex-chat.md`.

Load during Step 7 (Implement) when building React frontends.

#### Race Condition Prevention

**Problem**: `useEffect` firing multiple times when global state triggers chat messages from other components (e.g., clicking a KPI card sets `pendingPrompt`).

**Solution**: Track processed prompts with a ref:

```typescript
const processingPromptRef = useRef<string | null>(null);

useEffect(() => {
  if (pendingPrompt && status !== 'streaming' && processingPromptRef.current !== pendingPrompt) {
    processingPromptRef.current = pendingPrompt;
    setPendingPrompt(null);
    sendMessage(pendingPrompt);
  }
}, [pendingPrompt, status]);
```

**AbortController for SSE**: Always abort previous stream before starting new one:

```typescript
abortControllerRef.current?.abort();
abortControllerRef.current = new AbortController();
```

#### SSE Buffer Management

SSE chunks may split mid-line. Always buffer incomplete lines:

```typescript
buffer += decoder.decode(value, { stream: true });
const lines = buffer.split('\n');
buffer = lines.pop() || '';  // Keep incomplete line for next iteration
```

#### Context Injection Pattern

Prepend page/selection context to user prompts for contextual AI responses:

```typescript
let contextualPrompt = input;
if (selectedAsset) {
  contextualPrompt = `[Context: User is viewing asset "${selectedAsset.name}" (${selectedAsset.type})]\n\n${input}`;
} else if (chatContext) {
  contextualPrompt = `[Context: ${chatContext}]\n\n${input}`;
}
```

#### Zustand Chat State

Minimal chat state management:

```typescript
interface ChatState {
  messages: CortexMessage[];
  addMessage: (msg: CortexMessage) => void;
  updateMessage: (id: string, updates: Partial<CortexMessage>) => void;
  clearMessages: () => void;
  pendingPrompt: string | null;
  setPendingPrompt: (prompt: string | null) => void;
}
```

#### FastAPI SSE Headers

Critical headers for streaming through proxies:

```python
headers={
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",  # Required for nginx
}
```

#### Multi-Agent Orchestration

Pattern: Intent classification -> agent routing.

```
User Message -> Orchestrator -> Intent Classification -> Route to Agent(s) -> Aggregate Response
```

**Components:**
- `AgentOrchestrator` — Central coordinator with regex-based intent classification
- `BaseAgent` — Abstract base with `process()` and `get_tools()` methods
- Specialized agents: `HistorianAgent` (RAG search), `AdvisorAgent` (recommendations), `WatchdogAgent` (monitoring)

**Intent categories:**

| Intent | Route To | Fallback |
|--------|----------|----------|
| `analytical` | Cortex Analyst | Direct SQL query |
| `search/history` | Cortex Search | Document listing |
| `recommend` | Custom agent | Pattern-matched recommendations |
| `status/current` | Direct query | Cached last-known values |
| `comparison` | Aggregation query | Side-by-side table |
| `general` | Multiple agents | Generic LLM response |

#### Cortex Service Integration Patterns

**Cortex Search with SEARCH_PREVIEW:**

```python
sql = f"""
SELECT SNOWFLAKE.CORTEX.SEARCH_PREVIEW(
    'DATABASE.SCHEMA.SEARCH_SERVICE',
    '{{"query": "{query}", "columns": [...], "limit": {limit}}}'
) as RESULT
"""
```

**Cortex Analyst with Semantic Model:**

```python
sql = f"""
SELECT SNOWFLAKE.CORTEX.ANALYST(
    '@DATABASE.SCHEMA.STAGE/semantic_model.yaml',
    '{question}'
) as RESPONSE
"""
```

**Cortex LLM for Generation:**

```python
sql = f"""
SELECT SNOWFLAKE.CORTEX.COMPLETE(
    'mistral-large2',
    '{escaped_prompt}'
) as RESPONSE
"""
```

#### Fallback Query Pattern

Always implement: Cortex Analyst -> pattern-matched SQL -> error explanation.

```python
def handle_analytical(message):
    # Try Cortex Analyst first
    result = cortex_analyst_query(message)
    if result.get("results"):
        return result

    # Fallback to pattern-matched SQL
    result = direct_sql_query(message)
    if result.get("results"):
        return result

    # Explain what we can answer
    return {"response": "I can help with: * How many X? * List top X..."}
```

#### Domain-Specific LLM Prompting

Structure prompts with:
1. Role definition
2. Context data (JSON)
3. Specific output requirements
4. Terminology guidance

```python
prompt = f"""You are a {domain} operations assistant...

Context:
- Entity: {entity_id}
- Current Value: {current_value}

Historical Data:
{json.dumps(historical_data, indent=2)}

Generate a brief (2-3 sentences) executive summary.
Be concise and actionable. Use technical {domain} terminology."""
```

#### Chart Color Consistency

Define colors globally for multi-series charts:

```tsx
const ENTITY_COLORS: Record<string, string> = {
  'Entity-A': '#3b82f6',
  'Entity-B': '#10b981',
  'Entity-C': '#f59e0b',
};

// Use in both selection UI chips and Recharts lines
<button style={{ backgroundColor: ENTITY_COLORS[name] }}>
<Line stroke={ENTITY_COLORS[name]} />
```

#### Recharts Patterns

**Inverted Y-axis** (e.g., depth charts):

```tsx
<LineChart data={data}>
  <YAxis reversed domain={['dataMin', 'dataMax']} />
  {entities.map(name => (
    <Line key={name} dataKey={name} stroke={COLORS[name]} />
  ))}
</LineChart>
```

**Area gradients:**

```tsx
<AreaChart>
  <defs>
    {entities.map(name => (
      <linearGradient key={name} id={`grad-${name}`}>
        <stop offset="5%" stopColor={COLORS[name]} stopOpacity={0.3} />
        <stop offset="95%" stopColor={COLORS[name]} stopOpacity={0} />
      </linearGradient>
    ))}
  </defs>
  {entities.map(name => (
    <Area key={name} fill={`url(#grad-${name})`} stroke={COLORS[name]} />
  ))}
</AreaChart>
```

#### Agent Status Indicators

Visual pattern for multi-agent status:

```tsx
const agents = [
  { name: 'Orchestrator', icon: Brain, status: 'idle' },
  { name: 'Historian', icon: Search, status: 'idle' },
  { name: 'Advisor', icon: Database, status: 'active' },
];

{agents.map(agent => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-700/50">
    <agent.icon size={14} className={agent.status === 'active' ? 'text-emerald-400' : 'text-slate-400'} />
    <div className={`w-1.5 h-1.5 rounded-full ${statusColor(agent.status)}`} />
  </div>
))}
```

#### WebSocket Real-Time Pattern

For live data panels:

```python
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, entity_id: str):
        await websocket.accept()
        if entity_id not in self.active_connections:
            self.active_connections[entity_id] = []
        self.active_connections[entity_id].append(websocket)

    async def broadcast(self, entity_id: str, data: dict):
        for conn in self.active_connections.get(entity_id, []):
            await conn.send_json(data)
```

#### Markdown Rendering with Tailwind

```tsx
<div className="prose prose-sm prose-invert max-w-none
  prose-p:my-1 prose-code:text-xs prose-code:bg-slate-700/50">
  <ReactMarkdown>{message.content}</ReactMarkdown>
</div>
```

### 4.2 Modify `references/react-components.md`

**Add before checklist:**

```markdown
## Production Patterns

For implementation-time patterns (race conditions, SSE buffer management,
multi-agent orchestration, fallback strategies), load
`references/react-production-patterns.md`.
```

---

## 5. Gap 3: Transformation Approaches (HIGH)

### 5.1 `references/transformation-approaches.md`

Source: `snowflake-demo-data-architecture/references/transformation-approaches.md`.

Load during Step 2 (Generate Specification) and Step 7 (Implement).

#### Decision Tree

```
Transformation Need
    |
    +-- Real-time required? --Yes--> Streams + Tasks
    |
    +-- No
        |
        +-- Complex multi-step? --Yes--> Declarative OK? --Yes--> Dynamic Tables
        |                                      |
        |                                      +-- No --> Stored Procedures
        +-- No
            |
            +-- Materialization needed? --Yes--> Materialized Views
            |
            +-- No --> Standard Views (Simplest)
```

#### Comparison Table

| Approach | Use When | Pros | Cons |
|----------|----------|------|------|
| **Views** | Simple transforms, real-time accuracy | Zero maintenance, always current | Query-time compute cost |
| **Materialized Views** | Expensive aggregations, predictable queries | Auto-refresh, simple syntax | Limited transformation support |
| **Dynamic Tables** | Multi-step pipelines, declarative preferred | Auto-refresh, dependency tracking | Snowflake-specific, compute cost |
| **Stored Procedures** | Complex logic, conditional processing | Full control, procedural logic | Manual orchestration needed |
| **Streams + Tasks** | CDC processing, near-real-time | Incremental processing | Complex setup and monitoring |

#### SQL Examples

**Standard Views:**

```sql
CREATE OR REPLACE VIEW ATOMIC.CUSTOMER_CURRENT AS
SELECT CUSTOMER_ID, CUSTOMER_NAME, EMAIL, STATUS
FROM ATOMIC.CUSTOMER
WHERE IS_CURRENT_FLAG = TRUE;
```

**Materialized Views:**

```sql
CREATE MATERIALIZED VIEW YO_SWEET_SPOT.DAILY_SUMMARY AS
SELECT
    DATE_TRUNC('DAY', PRODUCTION_DATE) AS DAY,
    PRODUCT_CATEGORY,
    COUNT(*) AS BATCH_COUNT,
    AVG(YIELD_PERCENTAGE) AS AVG_YIELD
FROM ATOMIC.PRODUCTION_RUN
WHERE PRODUCTION_STATUS = 'COMPLETED'
GROUP BY 1, 2;
```

**Dynamic Tables** (2-step pipeline):

```sql
-- Step 1: Clean RAW data
CREATE OR REPLACE DYNAMIC TABLE ATOMIC.EQUIPMENT_READINGS_CLEAN
    TARGET_LAG = '1 hour'
    WAREHOUSE = TRANSFORM_WH
AS
SELECT
    EQUIPMENT_ID,
    TRY_TO_TIMESTAMP(READING_TIMESTAMP) AS READING_TIMESTAMP,
    TRY_TO_NUMBER(TEMPERATURE_VALUE) AS TEMPERATURE_VALUE,
    TRY_TO_NUMBER(PRESSURE_VALUE) AS PRESSURE_VALUE,
    _SOURCE_FILE_NAME,
    _LOADED_TIMESTAMP
FROM RAW.EQUIPMENT_READINGS_STAGE
WHERE TRY_TO_TIMESTAMP(READING_TIMESTAMP) IS NOT NULL;

-- Step 2: Aggregate for DATA_MART
CREATE OR REPLACE DYNAMIC TABLE YO_SWEET_SPOT.HOURLY_EQUIPMENT_METRICS
    TARGET_LAG = '1 hour'
    WAREHOUSE = TRANSFORM_WH
AS
SELECT
    EQUIPMENT_ID,
    DATE_TRUNC('HOUR', READING_TIMESTAMP) AS READING_HOUR,
    AVG(TEMPERATURE_VALUE) AS AVG_TEMPERATURE,
    MAX(TEMPERATURE_VALUE) AS MAX_TEMPERATURE,
    COUNT(*) AS READING_COUNT
FROM ATOMIC.EQUIPMENT_READINGS_CLEAN
GROUP BY EQUIPMENT_ID, DATE_TRUNC('HOUR', READING_TIMESTAMP);
```

**TARGET_LAG options:** `'1 minute'` to `'7 days'` (time-based), or `DOWNSTREAM` (refresh when downstream refreshes).

**Stored Procedures** (conditional CDC processing):

```sql
CREATE OR REPLACE PROCEDURE ATOMIC.PROCESS_CDC_BATCH()
RETURNS STRING
LANGUAGE SQL
AS
$$
DECLARE
    rows_processed INT;
BEGIN
    -- Step 1: Expire old records
    UPDATE ATOMIC.CUSTOMER target
    SET VALID_TO_TIMESTAMP = source._CDC_TIMESTAMP,
        IS_CURRENT_FLAG = FALSE,
        UPDATED_TIMESTAMP = CURRENT_TIMESTAMP()
    FROM RAW.CUSTOMER_CDC source
    WHERE target.CUSTOMER_ID = source.CUSTOMER_ID
      AND target.IS_CURRENT_FLAG = TRUE
      AND source._CDC_OPERATION IN ('UPDATE', 'DELETE');

    -- Step 2: Insert new/updated records
    INSERT INTO ATOMIC.CUSTOMER (
        CUSTOMER_ID, CUSTOMER_NAME, EMAIL, STATUS,
        VALID_FROM_TIMESTAMP, IS_CURRENT_FLAG,
        CREATED_BY_USER, CREATED_TIMESTAMP
    )
    SELECT CUSTOMER_ID, CUSTOMER_NAME, EMAIL, STATUS,
        _CDC_TIMESTAMP, TRUE, 'CDC_PROCEDURE', CURRENT_TIMESTAMP()
    FROM RAW.CUSTOMER_CDC
    WHERE _CDC_OPERATION IN ('INSERT', 'UPDATE')
    QUALIFY ROW_NUMBER() OVER (PARTITION BY CUSTOMER_ID ORDER BY _CDC_SEQUENCE DESC) = 1;

    rows_processed := SQLROWCOUNT;

    -- Step 3: Archive and truncate
    INSERT INTO RAW.CUSTOMER_CDC_ARCHIVE
    SELECT *, CURRENT_TIMESTAMP() AS _ARCHIVED_TIMESTAMP FROM RAW.CUSTOMER_CDC;
    TRUNCATE TABLE RAW.CUSTOMER_CDC;

    RETURN 'Processed ' || rows_processed || ' records';
END;
$$;
```

**Streams + Tasks:**

```sql
-- Stream to track changes
CREATE OR REPLACE STREAM RAW.CUSTOMER_CHANGES
ON TABLE RAW.CUSTOMER_CDC
APPEND_ONLY = FALSE;

-- Task to process changes every 5 minutes
CREATE OR REPLACE TASK ATOMIC.PROCESS_CUSTOMER_CHANGES
    WAREHOUSE = TRANSFORM_WH
    SCHEDULE = '5 MINUTE'
    WHEN SYSTEM$STREAM_HAS_DATA('RAW.CUSTOMER_CHANGES')
AS
    MERGE INTO ATOMIC.CUSTOMER target
    USING (
        SELECT * FROM RAW.CUSTOMER_CHANGES
        WHERE METADATA$ACTION = 'INSERT'
        QUALIFY ROW_NUMBER() OVER (
            PARTITION BY CUSTOMER_ID ORDER BY _CDC_SEQUENCE DESC
        ) = 1
    ) source
    ON target.CUSTOMER_ID = source.CUSTOMER_ID AND target.IS_CURRENT_FLAG = TRUE
    WHEN MATCHED THEN UPDATE SET
        VALID_TO_TIMESTAMP = source._CDC_TIMESTAMP,
        IS_CURRENT_FLAG = FALSE
    WHEN NOT MATCHED THEN INSERT (
        CUSTOMER_ID, CUSTOMER_NAME, EMAIL, STATUS,
        VALID_FROM_TIMESTAMP, IS_CURRENT_FLAG, CREATED_TIMESTAMP
    ) VALUES (
        source.CUSTOMER_ID, source.CUSTOMER_NAME, source.EMAIL, source.STATUS,
        source._CDC_TIMESTAMP, TRUE, CURRENT_TIMESTAMP()
    );

-- Enable the task
ALTER TASK ATOMIC.PROCESS_CUSTOMER_CHANGES RESUME;
```

**Stream types:** `APPEND_ONLY = TRUE` (inserts only), `APPEND_ONLY = FALSE` (inserts + updates + deletes).

#### Quick Decision Guide

| Scenario | Recommended |
|----------|-------------|
| Simple dimension view | Standard View |
| Dashboard aggregations | Materialized View |
| ETL pipeline with multiple steps | Dynamic Tables |
| Complex business logic with conditionals | Stored Procedure |
| Real-time CDC from source system | Streams + Tasks |
| One-time data transformation | CTAS |
| Ad-hoc analysis | Standard View or CTAS |

### 5.2 Modify `references/data-architecture.md`

**Replace "Transformation Decision Matrix" (lines 179-187) with:**

```markdown
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
```

**Replace "Data Dictionary Reference" section (lines 198-223) with:**

```markdown
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
```

---

## 6. Gap 4: Persona Reflection QA Step (HIGH)

### 6.1 `reflect/SKILL.md`

New sub-skill. Source: `snowflake-demo-reflection-persona/SKILL.md`.

**Full content:**

```yaml
---
name: specify-reflect
description: "Persona reflection QA - verify persona coverage, STAR completeness, and visual strategy alignment. Use for: persona review, narrative QA, visual strategy check. Triggers: /speckit.reflect, persona review, STAR check"
parent_skill: specify
---
```

#### When to Load

After `analyze/SKILL.md` passes quality checks, before `generate/SKILL.md`.

#### Prerequisites

Files must exist in `specs/{demo-name}/`:
- `spec.md` (required) — must contain Section 2 (Personas & Stories) and Section 5 (Application UX)

#### Workflow

**Step 1: Extract Personas**

Load `spec.md`, extract:
- All personas from Section 2 (Strategic, Operational, Technical)
- STAR journeys per persona
- Application pages from Section 5
- Component mapping from Section 5.5 (if React)

**Step 2: Persona Coverage Review**

For each persona, verify:

| Check | Pass Condition |
|-------|---------------|
| Entry point exists | Persona has a dedicated page, tab, or section |
| Pain points addressed | At least 1 user story maps to a defined pain point |
| Terminology fit | Language matches role level (executive vs. technical) |
| Quantifiable KPI | At least 1 measurable metric per persona |

**Step 3: STAR Navigation Assessment**

Map each persona path through the application:

| STAR Element | Must Have |
|--------------|-----------|
| **Situation** | KPI card or metric showing current gap/problem |
| **Task** | Clear statement of what needs to be decided |
| **Action** | Interactive element (filter, toggle, parameter, chat input) |
| **Result** | Visualization showing impact (before/after, projected savings) |

Flag any element that is missing or vague.

**Step 4: Role-Based Visual Strategy**

Verify each persona gets appropriate visualizations:

| Persona Type | Expected Visuals | Anti-Pattern |
|-------------|------------------|--------------|
| Executive / Strategic | KPI cards, before/after charts, geospatial | Raw data tables, technical metrics |
| Operational / Analyst | Interactive tables, histograms, filters, action lists | Executive-level aggregations only |
| Technical / Data | ROC curves, feature importance, raw data explorer | No drill-down capability |

**Step 5: Tone Alignment Check**

| Do | Avoid |
|----|-------|
| Lead with the conclusion | Long background setup |
| Use quantified impact | Vague claims |
| Use active verbs | Passive voice |
| Keep structure tight | Overly narrative explanations |

**Step 6: Produce Reflection Report**

**MANDATORY STOPPING POINT**: Present report.

```markdown
## Persona Reflection Report: {demo-name}

### Coverage Matrix

| Persona | Entry Point | Pain Points | Terminology | KPI | Status |
|---------|-------------|-------------|-------------|-----|--------|
| Strategic: {role} | {page/tab} | {count}/{total} | {fit level} | {metric} | {Pass/Gap} |
| Operational: {role} | {page/tab} | {count}/{total} | {fit level} | {metric} | {Pass/Gap} |
| Technical: {role} | {page/tab} | {count}/{total} | {fit level} | {metric} | {Pass/Gap} |

### STAR Completeness

| Persona | Situation | Task | Action | Result | Status |
|---------|-----------|------|--------|--------|--------|
| Strategic | {present/missing} | {present/missing} | {present/missing} | {present/missing} | {Complete/Incomplete} |
| Operational | ... | ... | ... | ... | ... |
| Technical | ... | ... | ... | ... | ... |

### Visual Strategy Alignment

| Persona | Assigned Visuals | Appropriate? | Recommendation |
|---------|-----------------|-------------|----------------|
| {persona} | {visual list} | {Yes/No} | {fix if needed} |

### Gaps Found

| # | Persona | Issue | Recommendation |
|---|---------|-------|----------------|
| 1 | {persona} | {issue} | {fix} |

### Persona Reflection Worksheets

**Persona: {Name}**
- Entry Point: {page/section}
- Situation: {what they see first}
- Task: {objective statement}
- Action: {inputs available}
- Result: {quantified outcome shown}
- Gaps: {missing content or visuals}
```

#### Common Issues and Fixes

| Issue | Fix |
|-------|-----|
| No persona-specific entry point | Add a role-based landing or tab |
| Action does not change outcome | Make results reactive and quantified |
| Metrics are vague | Use explicit KPI deltas or percentages |
| Language mismatched to persona | Rewrite labels using role vocabulary |

### 6.2 Modify `SKILL.md`

**Add to workflow diagram** (after Step 5, before Step 6):

```
Step 5.5: Persona Reflection --> Load reflect/SKILL.md
```

**Add to sub-skills table:**

```
| Reflect | `reflect/SKILL.md` | After analyze passes, before generate |
```

**Add to stopping points:**

```
- ✋ After persona reflection report (Step 5.5)
```

---

## 7. Gap 5: Full Test Cycle + Layered Debugging (MEDIUM)

### 7.1 `templates/ci_test_cycle.sh`

Source: `snowflake-demo-testing/assets/ci_test_cycle.sh`.

```bash
#!/bin/bash
###############################################################################
# ci_test_cycle.sh - Automated test cycle for CI/CD pipelines
###############################################################################

set -e
set -o pipefail

# Configuration
CONNECTION_NAME="${SNOWFLAKE_CONNECTION:-demo}"
MIN_EXPECTED_ROWS=10
TIMEOUT_SECONDS=600

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "=== CI Test Cycle Started ==="
echo "Connection: $CONNECTION_NAME"
echo "Timestamp: $(date)"

# Step 1: Clean
echo ""
echo "Step 1: Cleaning previous deployment..."
./clean.sh -c $CONNECTION_NAME --force
echo "Clean complete"

# Step 2: Deploy
echo ""
echo "Step 2: Deploying..."
./deploy.sh -c $CONNECTION_NAME
echo "Deployment complete"

# Step 3: Test queries
echo ""
echo "Step 3: Validating queries..."
./run.sh -c $CONNECTION_NAME test || {
    echo "Query validation failed"
    exit 1
}
echo "All queries validated"

# Step 4: Run main workflow
echo ""
echo "Step 4: Executing main workflow..."
timeout $TIMEOUT_SECONDS ./run.sh -c $CONNECTION_NAME main || {
    echo "Workflow execution failed or timed out"
    exit 1
}
echo "Workflow execution complete"

# Step 5: Verify outputs
echo ""
echo "Step 5: Verifying outputs..."

# Replace with your project's output table
OUTPUT_COUNT=$(snow sql -c $CONNECTION_NAME -q "
    SELECT COUNT(*) FROM DB.SCHEMA.OUTPUT_TABLE;
" -o tsv 2>/dev/null | tail -1)

if [ "$OUTPUT_COUNT" -ge "$MIN_EXPECTED_ROWS" ]; then
    echo -e "${GREEN}Test cycle PASSED${NC}"
    echo "  Output rows: $OUTPUT_COUNT (expected >= $MIN_EXPECTED_ROWS)"
    exit 0
else
    echo -e "${RED}Test cycle FAILED${NC}"
    echo "  Output rows: $OUTPUT_COUNT (expected >= $MIN_EXPECTED_ROWS)"
    exit 1
fi
```

### 7.2 Modify `references/testing-spec.md`

**Add after "Test Execution Order":**

#### 6-Layer Debugging Framework

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

#### Common Issues and Fixes

| Symptom | Layer | Cause | Fix |
|---------|-------|-------|-----|
| `snow sql` returns auth error | 1 | Connection profile invalid | `snow connection test`, verify config |
| Table not found | 2 | deploy.sh didn't complete | Re-run `./deploy.sh`, check for errors |
| 0 rows in DATA_MART | 3 | ATOMIC transform failed | Check RAW row counts first, then ATOMIC |
| Agent returns 404 | 4 | Wrong endpoint path | Use `/agents/` not `/cortex-agents/` |
| Blank page | 5 | Build failed | Run `npm run build`, check for errors |
| SSE stream hangs | 6 | Missing SSE headers | Add `Cache-Control: no-cache`, `Connection: keep-alive` |
| `verified_at` error | 4 | ISO string instead of Unix int | Use `int(datetime.timestamp())` |
| Analyst bad JOINs | 4 | Missing `primary_key` | Add PK to every table in semantic model |

#### CI/CD Integration

Use `templates/ci_test_cycle.sh` as the CI/CD test script. Customize:
- `MIN_EXPECTED_ROWS` — minimum output rows for your project
- `TIMEOUT_SECONDS` — max time for main workflow
- Output table reference in Step 5

---

## 8. Gap 6: Pre-Publication Depth (MEDIUM)

### 8.1 Additions to `references/testing-spec.md`

#### Block-Release Signals

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

#### Guideline Review Matrix

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

#### React Security Audit

| Check | Command | Pass If |
|-------|---------|---------|
| No secrets in build output | `grep -r "token\|secret\|password" dist/` | No matches |
| `node_modules/` in .gitignore | `grep node_modules .gitignore` | Present |
| `logs/` in .gitignore | `grep logs .gitignore` | Present |
| No inline secrets in source | `grep -r "Bearer\|sk-\|pat_" frontend/src/` | No matches |
| Dependency audit clean | `npm audit --production` | No critical/high |

#### Release Gate

| Condition | Decision |
|-----------|----------|
| All block-release signals clear + all guideline categories pass | **SHIP** |
| Any block-release signal true | **NO SHIP** (must fix first) |
| Block-release clear but 1+ guideline category fails | **CONDITIONAL** (document exceptions, get approval) |

---

## 9. Gap 7: Synthetic Data Generator Template (MEDIUM)

### 9.1 `templates/generate_synthetic_data.py`

Source: `snowflake-demo-data-generation/assets/generate_synthetic_data.py`.

```python
#!/usr/bin/env python3
"""
Synthetic Data Generator Template

Usage:
    python3 utils/generate_synthetic_data.py --output-dir data/synthetic

Rules:
    - Always use RANDOM_SEED = 42 for reproducibility
    - Generate once, commit to repo
    - Never run during deployment
"""

import random
import argparse
from pathlib import Path
from datetime import datetime, timedelta

# CRITICAL: Fixed seed for reproducibility
RANDOM_SEED = 42


def generate_sample_data(num_rows: int = 1000) -> list[dict]:
    """Generate sample records. Customize for your use case."""
    data = []
    categories = ["Category A", "Category B", "Category C"]

    for i in range(num_rows):
        record = {
            "id": i + 1,
            "name": f"Item_{i + 1:04d}",
            "category": random.choice(categories),
            "value": round(random.uniform(10.0, 1000.0), 2),
            "created_date": (
                datetime(2024, 1, 1) +
                timedelta(days=random.randint(0, 365))
            ).strftime("%Y-%m-%d"),
        }
        data.append(record)

    return data


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic demo data")
    parser.add_argument("--output-dir", default="data/synthetic",
                        help="Output directory for generated files")
    parser.add_argument("--num-rows", type=int, default=1000,
                        help="Number of rows to generate")
    args = parser.parse_args()

    # Set seed for reproducibility
    random.seed(RANDOM_SEED)

    # Create output directory
    output_path = Path(args.output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Generate data
    data = generate_sample_data(args.num_rows)

    # Write to CSV
    import csv
    output_file = output_path / "sample_data.csv"
    with open(output_file, "w", newline="") as f:
        if data:
            writer = csv.DictWriter(f, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)

    print(f"Generated {len(data)} rows to {output_file}")
    print(f"Random seed: {RANDOM_SEED}")
    print("Remember: Commit this data to version control!")


if __name__ == "__main__":
    main()
```

### 9.2 Modify `generate/SKILL.md`

**Add after "Step 2: Validate Domain Model":**

#### Data Generation Principles

| Principle | Rule |
|-----------|------|
| Reproducibility | `RANDOM_SEED = 42` always |
| Commit pattern | Generate once, commit to `data/synthetic/` |
| Deploy-time generation | **Never** generate data during deployment |
| Template | Use `templates/generate_synthetic_data.py` as starter |
| Directory convention | `data/synthetic/{entity_name}.csv` |

**Add after output section:**

#### Regeneration Guidance

| When | How | Verify |
|------|-----|--------|
| Schema changes | Re-run generator, re-commit CSVs | Column names match new schema |
| New entities added | Add generator function, produce CSV | Referential integrity across files |
| Row count changes | Update `--num-rows`, re-run | Hidden discovery still present |
| Bug in generated data | Fix generator, re-run with same seed | Diff against previous to confirm fix |

---

## 10. Gap 8: DRD Generation Workflow (LOW)

### 10.1 Modify `references/drd-template.md`

**Add after "Quality Checklist":**

#### DRD Generation Workflow

| Step | Action | Output |
|------|--------|--------|
| 1. Gather Context | Load research brief + intake answers + industry defaults | Input document |
| 2. Draft Sections | Generate all 6 DRD sections using templates | Draft DRD |
| 3. Review | Validate against quality checklist | Issue list |
| 4. Finalize | Resolve gaps, confirm hidden discovery, confirm STAR completeness | Final DRD |

**Add after component mapping:**

#### DRD Quality Gate

| Check | Required |
|-------|----------|
| All 7 intake categories addressed | industry, audience, persona, pain points, hidden discovery, self-guided, data context |
| Component mapping complete | Every feature maps to a Snowflake capability |
| Hidden discovery engineered | Data design guarantees the insight appears |
| STAR journeys complete | Each persona has all 4 elements (Situation, Task, Action, Result) |
| Terminology consistent | Customer terms mapped to standard terms throughout |

---

## 11. Gap 9: Industry Data Dictionary CSVs (LOW)

### 11.1 `references/dictionaries/`

Copy all 20 CSV files from `/Users/jurrutia/projects/gnn_supply_chain_risk/skills/snowflake-demo-data-architecture/assets/dictionary/` into `references/dictionaries/`:

| File | Industry |
|------|----------|
| `core.data_dictionary.csv` | Core enterprise entities |
| `data_dictionary_ATOMIC.csv` | ATOMIC layer standard entities |
| `data_dictionary_AEROSPACE.csv` | Aerospace & defense |
| `data_dictionary_AGRICULTURE.csv` | Agriculture & farming |
| `data_dictionary_AUTOMOTIVE.csv` | Automotive manufacturing |
| `data_dictionary_CLM.csv` | Contract lifecycle management |
| `data_dictionary_CONNECTED_PRODUCTS.csv` | IoT / connected products |
| `data_dictionary_CONSTRUCTION.csv` | Construction & infrastructure |
| `data_dictionary_DIGITAL_TWIN.csv` | Digital twin / simulation |
| `data_dictionary_ENERGY_TRADING.csv` | Energy markets & trading |
| `data_dictionary_FACILITY_SITE_MANAGEMENT.csv` | Facility management |
| `data_dictionary_GENERAL_REFERENCE.csv` | Cross-industry reference |
| `data_dictionary_MINING.csv` | Mining & extraction |
| `data_dictionary_OG.csv` | Oil & gas |
| `data_dictionary_PROCESS_MANUFACTURING.csv` | Process manufacturing |
| `data_dictionary_REGULATORY.csv` | Regulatory & compliance |
| `data_dictionary_SHIPMENT_FULFILLMENT.csv` | Logistics & shipping |
| `data_dictionary_SUSTAINABILITY_ESG.csv` | ESG / sustainability |
| `data_dictionary_TECHNOLOGY_MANUFACTURING.csv` | Technology manufacturing |
| `data_dictionary_UTILITIES.csv` | Utilities |

### 11.2 Modify `references/data-architecture.md`

Update the "Data Dictionary Reference" section to point to `references/dictionaries/` with the full table above (see Gap 3 section 5.2).

---

## 12. Modify `references/constraints.md`

**Add to "Red Flags" table:**

```
| Generate data at deploy time | Pre-generate with seed=42, commit to data/synthetic/ |
```

---

## 13. Implementation Order

| Phase | Gap | Files to Create | Files to Modify |
|-------|-----|----------------|-----------------|
| 1 | Gap 1 (Critical) | `templates/backend/cortex_agent_service.py`, `templates/backend/snowflake_service.py`, `templates/frontend/hooks/useCortexAgent.ts`, `templates/sql/schema_template.sql` | `implement/SKILL.md` |
| 2 | Gap 3 (High) | `references/transformation-approaches.md` | `references/data-architecture.md` |
| 3 | Gap 2 (High) | `references/react-production-patterns.md` | `references/react-components.md` |
| 4 | Gap 4 (High) | `reflect/SKILL.md` | `SKILL.md` |
| 5 | Gap 5 (Medium) | `templates/ci_test_cycle.sh` | `references/testing-spec.md` |
| 6 | Gap 6 (Medium) | (none) | `references/testing-spec.md` |
| 7 | Gap 7 (Medium) | `templates/generate_synthetic_data.py` | `generate/SKILL.md` |
| 8 | Gap 8 (Low) | (none) | `references/drd-template.md` |
| 9 | Gap 9 (Low) | 20 CSV files in `references/dictionaries/` | `references/data-architecture.md`, `references/constraints.md` |

---

## 14. Testing Plan

### Unit Testing (per gap)

| Gap | Test | Pass Condition |
|-----|------|---------------|
| 1 | FastAPI template has all 4 endpoints | `/threads`, `/chat`, `/run`, `/health` all defined |
| 1 | useCortexAgent handles all event types | Switch covers: text_delta, tool_start, tool_end, tool_result, reasoning, message_complete, error |
| 1 | Schema template has 3 required schemas | RAW, ATOMIC, DATA_MART placeholders present |
| 2 | Production patterns doc covers all 15 patterns | Section headers match spec |
| 3 | Transformation approaches has 5 SQL examples | Views, MVs, Dynamic Tables, Stored Procs, Streams+Tasks |
| 4 | reflect/SKILL.md has 6-step workflow | Steps 1-6 present with stopping point |
| 5 | CI test script has 5 steps | Clean, deploy, test, run, verify |
| 6 | Block-release signals has 8 items | All 8 listed with check commands |
| 7 | Generator template uses seed=42 | `RANDOM_SEED = 42` present |
| 8 | DRD workflow has 4 steps | Gather, Draft, Review, Finalize |
| 9 | 20 CSV files copied | `ls references/dictionaries/*.csv | wc -l` == 20 |

### Integration Testing

| Test | Steps | Pass Condition |
|------|-------|---------------|
| Workflow continuity | Read SKILL.md, verify reflect step in diagram | Step 5.5 present between analyze and generate |
| Cross-references | Grep all `references/` mentions in SKILL.md and sub-skills | All referenced files exist |
| Template usability | Read implement/SKILL.md, verify backend/frontend template refs | Templates referenced with clear copy instructions |
| Constraint completeness | Read constraints.md, verify new entry | "Generate data at deploy time" row present |
| Testing depth | Read testing-spec.md, verify new sections | 6-layer debugging, common issues, block-release, review matrix, security audit, release gate all present |

### End-to-End Validation

Run through the full specify workflow mentally:

1. **Step 0 Research** -> `research-phase.md` (unchanged, works)
2. **Step 1 Intake** -> `intake-questions.md` (unchanged, works)
3. **Step 2 Generate Spec** -> loads `data-architecture.md` (now points to `transformation-approaches.md` and `dictionaries/`)
4. **Step 3 Plan** -> `plan/SKILL.md` (unchanged)
5. **Step 4 Tasks** -> `tasks/SKILL.md` (unchanged)
6. **Step 5 Analyze** -> `analyze/SKILL.md` (unchanged)
7. **Step 5.5 Reflect** -> `reflect/SKILL.md` (NEW - persona QA)
8. **Step 6 Generate** -> `generate/SKILL.md` (now enforces seed=42 commit pattern, has template)
9. **Step 7 Implement** -> `implement/SKILL.md` (now has 7-step scaffold, backend templates, frontend templates)
10. **Step 8 Deploy** -> `deploy/SKILL.md` (unchanged, SPCS-focused)

Every phase now has actionable content. The weakest link (implement) now has copy-paste-ready templates.

---

*Specification generated from gap analysis of 8 snowflake-demo-* skills against the specify workflow. All source material read and verified.*

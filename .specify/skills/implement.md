# /speckit.implement - Demo Implementation Engine

> Execute implementation tasks to build the demo

You are a Senior Principal Solutions Architect and Product Manager for the Snowflake AI Data Cloud. You are a Demo Builder for Snowflake demos. Your job is to read the task checklist from `/speckit.tasks` and systematically implement each task, generating working code that follows the architecture defined in `/speckit.plan`.

## Instructions

1. **Follow the tasks** - Work through tasks.md in dependency order
2. **Generate real code** - No placeholders, no TODOs, working implementations
3. **Verify as you go** - Test each component before moving on
4. **Ask when blocked** - If you need clarification, ask before guessing

## Input Files

Read these files from `.specify/specs/{demo-name}/`:

| File | Purpose |
|------|---------|
| `tasks.md` | Implementation checklist with dependencies |
| `plan.md` | Architecture decisions and component specs |
| `spec.md` | Business requirements and user stories |
| `domain-model.yaml` | Data entities and relationships |
| `semantic-model.yaml` | Cortex Analyst configuration |

---

## Implementation Mode

When the user runs `/speckit.implement`, enter implementation mode:

### Option 1: Full Auto
```
Implement all tasks automatically, pausing only for checkpoints.
Best for: New demos, full rebuilds
```

### Option 2: Phase by Phase
```
Implement one phase at a time, confirm before continuing.
Best for: Incremental builds, reviewing as you go
```

### Option 3: Task by Task
```
Implement one task, show results, wait for approval.
Best for: Learning, customization, debugging
```

### Option 4: Resume
```
Continue from a specific task (e.g., "resume from B3").
Best for: Partial implementations, fixing issues
```

---

## Implementation Patterns

### Foundation Tasks

#### F1: Initialize Project Structure

```python
# Create backend structure
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app
│   ├── config.py            # Settings/env vars
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── metrics.py
│   │   └── query.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── analyst.py
│   │   └── auth.py
│   └── connectors/
│       ├── __init__.py
│       ├── zone_a.py
│       └── zone_b.py
├── requirements.txt
├── .env.example
└── README.md
```

```typescript
// Create frontend structure
frontend/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   └── Chat.tsx
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ChatInput.tsx
│   │   └── MetricsCard.tsx
│   ├── services/
│   │   ├── api.ts
│   │   └── sse.ts
│   └── contexts/
│       └── AuthContext.tsx
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

#### F2: Configure Snowflake Connections

> **PAT Token Configuration** - The PAT (Programmatic Access Token) for Cortex Analyst REST API
> can be stored in `~/.snowflake/config.toml` under either field name:
> - `password` - Most common (used by Snowflake CLI)
> - `token` - Alternative field name
> 
> Always check BOTH fields: `conn.get("password") or conn.get("token")`
> Also support `SNOWFLAKE_PAT` or `SNOWFLAKE_TOKEN` environment variables as override.

**Zone A Connector (Postgres):**
```python
# backend/app/connectors/zone_a.py
import asyncpg
from contextlib import asynccontextmanager
from app.config import settings

class ZoneAConnector:
    """Async Postgres connector for Zone A (OLTP)."""
    
    def __init__(self):
        self.pool = None
    
    async def connect(self):
        self.pool = await asyncpg.create_pool(
            host=settings.ZONE_A_HOST,
            port=settings.ZONE_A_PORT,
            database=settings.ZONE_A_DATABASE,
            user=settings.ZONE_A_USER,
            password=settings.ZONE_A_PASSWORD,
            min_size=5,
            max_size=20,
        )
    
    async def disconnect(self):
        if self.pool:
            await self.pool.close()
    
    @asynccontextmanager
    async def connection(self):
        async with self.pool.acquire() as conn:
            yield conn
    
    async def fetch(self, query: str, *args):
        async with self.connection() as conn:
            return await conn.fetch(query, *args)
    
    async def fetchrow(self, query: str, *args):
        async with self.connection() as conn:
            return await conn.fetchrow(query, *args)
    
    async def execute(self, query: str, *args):
        async with self.connection() as conn:
            return await conn.execute(query, *args)

zone_a = ZoneAConnector()
```

**Zone B Connector (Snowflake via REST API):**

> **IMPORTANT**: Use the REST API with httpx for Cortex Analyst, NOT the Python SDK.
> The SDK (`snowflake-ml-python`) requires Python 3.9-3.11 and has complex dependencies.
> The REST API works with any Python version and is more portable.

```python
# backend/app/connectors/zone_b.py
import httpx
from snowflake.snowpark import Session
from starlette.concurrency import run_in_threadpool
from app.config import settings

class ZoneBConnector:
    """Snowpark + REST API connector for Zone B (Analytics + Cortex)."""
    
    def __init__(self):
        self._session = None
        self._http_client = None
    
    @property
    def session(self) -> Session:
        if self._session is None:
            self._session = Session.builder.configs({
                "connection_name": settings.ZONE_B_CONNECTION,
            }).create()
        return self._session
    
    @property
    def _analyst_url(self) -> str:
        """Get Cortex Analyst REST API URL.
        
        IMPORTANT: Account identifiers with underscores must be converted to hyphens.
        Example: ORGNAME-ACCOUNT_NAME -> orgname-account-name
        """
        account = settings.SNOWFLAKE_ACCOUNT.lower().replace("_", "-")
        if ".snowflakecomputing.com" in account:
            return f"https://{account}/api/v2/cortex/analyst/message"
        return f"https://{account}.snowflakecomputing.com/api/v2/cortex/analyst/message"
    
    async def query(self, sql: str) -> list[dict]:
        """Execute SQL and return results as list of dicts."""
        def _query():
            df = self.session.sql(sql)
            return df.to_pandas().to_dict(orient="records")
        return await run_in_threadpool(_query)
    
    async def analyst_query(self, question: str, semantic_model: str) -> dict:
        """Execute Cortex Analyst query via REST API."""
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                self._analyst_url,
                headers={
                    "Authorization": f"Bearer {settings.SNOWFLAKE_PAT}",
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                json={
                    "messages": [{"role": "user", "content": [{"type": "text", "text": question}]}],
                    "semantic_model": semantic_model,
                },
            )
            response.raise_for_status()
            data = response.json()
            
            # Extract SQL and explanation from response
            sql = None
            explanation = None
            for msg in data.get("message", {}).get("content", []):
                if msg.get("type") == "sql":
                    sql = msg.get("statement")
                elif msg.get("type") == "text":
                    explanation = msg.get("text")
            
            return {"sql": sql, "explanation": explanation, "results": []}
    
    async def analyst_stream(self, question: str, semantic_model: str):
        """Stream Cortex Analyst response via SSE."""
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                self._analyst_url,
                headers={
                    "Authorization": f"Bearer {settings.SNOWFLAKE_PAT}",
                    "Content-Type": "application/json",
                    "Accept": "text/event-stream",
                },
                json={
                    "messages": [{"role": "user", "content": [{"type": "text", "text": question}]}],
                    "semantic_model": semantic_model,
                },
            ) as response:
                async for line in response.aiter_lines():
                    if line.startswith("data:"):
                        yield line[5:].strip()

zone_b = ZoneBConnector()
```

---

### Database Tasks

#### D1: Create Zone A Schema

```sql
-- snowflake/ddl/zone_a.sql

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    tenant_id UUID,  -- For multi-tenant
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat history table
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID,
    role VARCHAR(20) NOT NULL,  -- 'user' or 'assistant'
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_chat_user_session ON chat_history(user_id, session_id);
```

#### D2: Create Zone B Schema

Generate from domain-model.yaml:

```python
# Read domain model and generate DDL
from generators import DomainModel

model = DomainModel.from_yaml("domain-model.yaml")

for entity in model.get_generation_order():
    # Generate CREATE TABLE statement
    ddl = generate_ddl(entity)
    print(ddl)
```

#### D3: Load Demo Data

```python
# Use the data generator
from generators import generate_data

data, handler = generate_data(
    "domain-model.yaml",
    database="DEMO_DB",
    schema="PUBLIC",
)

# Option 1: Generate SQL file
handler.to_sql("snowflake/data/load_data.sql")

# Option 2: Load directly
results = handler.execute(connection="Snowhouse")
for entity, count in results.items():
    print(f"✓ {entity}: {count:,} rows")
```

#### D4: Deploy Semantic Model

```sql
-- Create stage for semantic model
CREATE OR REPLACE STAGE {demo}_semantic_stage;

-- Upload semantic model
PUT file://semantic-model.yaml @{demo}_semantic_stage AUTO_COMPRESS=FALSE;

-- Verify
LIST @{demo}_semantic_stage;
```

---

### Backend Tasks

#### B1: FastAPI Skeleton

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.connectors.zone_a import zone_a
from app.connectors.zone_b import zone_b
from app.routers import auth, metrics, query

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await zone_a.connect()
    yield
    # Shutdown
    await zone_a.disconnect()

app = FastAPI(
    title="{Demo Name} API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(metrics.router, prefix="/api/v1/metrics", tags=["metrics"])
app.include_router(query.router, prefix="/api/v1/query", tags=["query"])

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

#### B5: Cortex Query Endpoint with SSE

> **SSE Event Contract** - Frontend and backend MUST use these exact event names and payload keys:
> | Event | Payload | Description |
> |-------|---------|-------------|
> | `thinking` | `{status: string}` | Processing indicator |
> | `explanation` | `{text: string}` | AI explanation |
> | `sql` | `{sql: string}` | Generated SQL |
> | `data` | `{rows: array}` | Query results (NOT "results") |
> | `error` | `{message: string}` | Error details |
> | `done` | `{}` | Stream complete |

```python
# backend/app/routers/query.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json

from app.connectors.zone_b import zone_b
from app.config import settings

router = APIRouter()

class QueryRequest(BaseModel):
    question: str
    stream: bool = True

@router.post("/query")
async def query(request: QueryRequest):
    """Execute Cortex Analyst query."""
    try:
        result = await zone_b.analyst_query(
            question=request.question,
            semantic_model=settings.SEMANTIC_MODEL_PATH,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/query/stream")
async def query_stream(question: str):
    """Stream Cortex Analyst response via SSE.
    
    NOTE: Uses "simulated streaming" pattern - makes a non-streaming query
    internally, then yields results as SSE events. This is simpler and more
    reliable than parsing Snowflake's native SSE format.
    """
    
    async def event_generator():
        try:
            # Send thinking event immediately for UX
            yield f"event: thinking\ndata: {json.dumps({'status': 'Processing query...'})}\n\n"
            
            # Make non-streaming query (simpler, more reliable)
            result = await zone_b.analyst_query(
                question=question,
                semantic_model=settings.SEMANTIC_MODEL_PATH,
            )
            
            # Yield results as separate events
            if result.get("explanation"):
                yield f"event: explanation\ndata: {json.dumps({'text': result['explanation']})}\n\n"
            
            if result.get("sql"):
                yield f"event: sql\ndata: {json.dumps({'sql': result['sql']})}\n\n"
            
            if result.get("results"):
                yield f"event: data\ndata: {json.dumps({'rows': result['results']})}\n\n"
            
            yield f"event: done\ndata: {json.dumps({})}\n\n"
            
        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )
```

> **Why simulated streaming?** Parsing Snowflake's native SSE format is complex and error-prone.
> The simulated approach provides the same UX (progressive updates) with much simpler code.
> Add true streaming as an optimization only if needed for very long-running queries.

---

### Frontend Tasks

#### U2: SSE Client

```typescript
// frontend/src/services/sse.ts

export interface SSEEvent {
  event: string;
  data: any;
}

export async function* streamQuery(
  question: string,
  signal?: AbortSignal
): AsyncGenerator<SSEEvent> {
  const url = new URL('/api/v1/query/stream', import.meta.env.VITE_API_URL);
  url.searchParams.set('question', question);

  const response = await fetch(url.toString(), {
    headers: { 'Accept': 'text/event-stream' },
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    let currentEvent = '';
    let currentData = '';

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7);
      } else if (line.startsWith('data: ')) {
        currentData = line.slice(6);
      } else if (line === '' && currentEvent && currentData) {
        yield {
          event: currentEvent,
          data: JSON.parse(currentData),
        };
        currentEvent = '';
        currentData = '';
      }
    }
  }
}
```

#### U5: Chat Interface

```tsx
// frontend/src/pages/Chat.tsx
import { useState, useRef, useEffect } from 'react';
import { streamQuery, SSEEvent } from '../services/sse';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  data?: any[];
  status?: 'thinking' | 'streaming' | 'complete' | 'error';
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleSubmit = async (question: string) => {
    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
    };
    
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      status: 'thinking',
    };
    
    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);
    
    try {
      abortRef.current = new AbortController();
      
      for await (const event of streamQuery(question, abortRef.current.signal)) {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          
          switch (event.event) {
            case 'thinking':
              last.status = 'streaming';
              last.content = 'Analyzing your question...';
              break;
            case 'sql':
              last.sql = event.data.sql;
              last.content = 'Running query...';
              break;
            case 'data':
              last.data = event.data.rows;
              last.content = `Found ${event.data.rows.length} results`;
              break;
            case 'explanation':
              last.content = event.data.text;
              break;
            case 'done':
              last.status = 'complete';
              break;
            case 'error':
              last.status = 'error';
              last.content = event.data.message;
              break;
          }
          
          return updated;
        });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          last.status = 'error';
          last.content = 'An error occurred. Please try again.';
          return updated;
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
      </div>
      <ChatInput 
        onSubmit={handleSubmit} 
        onCancel={handleCancel}
        isLoading={isLoading} 
      />
    </div>
  );
}
```

---

## Execution Flow

When implementing, follow this pattern for each task:

```
1. Announce task
   "Implementing [B5] Cortex query endpoints..."

2. Generate code
   - Write complete, working code
   - Include imports and dependencies
   - Add error handling

3. Create files
   - Use Write tool to create files
   - Maintain proper directory structure

4. Verify
   - For backend: suggest curl command to test
   - For frontend: note what should be visible
   - For database: provide verification query

5. Mark complete
   - Update tasks.md checkbox
   - Move to next task

6. Checkpoint (at phase end)
   - Summarize what was built
   - Confirm everything works
   - Ask if ready to continue
```

---

## Resume Capability

To resume from a specific task:

```
User: /speckit.implement resume B3
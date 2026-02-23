# React Production Patterns

> Load during Step 7 (Implement) when building React frontends. Covers battle-tested patterns from production Cortex solutions.

The existing `react-components.md` covers the component library API. This document covers the **how** — production patterns for race conditions, streaming, state management, multi-agent orchestration, and visualization.

---

## 1. Race Condition Prevention

**Problem:** `useEffect` fires multiple times when global state (e.g., `pendingPrompt` from clicking a KPI card) triggers chat messages from other components.

**Solution — useRef guard:**

```tsx
const processingPromptRef = useRef<string | null>(null);

useEffect(() => {
  if (!pendingPrompt || processingPromptRef.current === pendingPrompt) return;
  processingPromptRef.current = pendingPrompt;
  sendMessage(pendingPrompt);
  setPendingPrompt(null);
}, [pendingPrompt, sendMessage, setPendingPrompt]);
```

**AbortController pattern:** Always abort the previous stream before starting a new one.

```tsx
const abortRef = useRef<AbortController | null>(null);

async function sendMessage(text: string) {
  abortRef.current?.abort();
  const controller = new AbortController();
  abortRef.current = controller;

  const resp = await fetch('/agent/run', {
    method: 'POST',
    body: JSON.stringify({ message: text }),
    signal: controller.signal,
  });
  // ... process stream
}
```

---

## 2. SSE Buffer Management

**Problem:** SSE chunks may split mid-line across network packets, producing incomplete JSON.

**Solution:** Accumulate in a buffer, split on newlines, and keep the last (potentially incomplete) fragment.

```tsx
const reader = response.body!.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';  // keep incomplete line for next iteration

  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const payload = line.slice(6);
    if (payload === '[DONE]') return;
    const event = JSON.parse(payload);
    handleEvent(event);
  }
}
```

---

## 3. Context Injection Pattern

Prepend page/selection context to user prompts so the AI gives contextual responses.

```tsx
function buildContextualPrompt(rawPrompt: string, context: PageContext): string {
  const parts: string[] = [];

  if (context.selectedAsset) {
    parts.push(`[Context: User is viewing asset "${context.selectedAsset.name}" `
      + `(ID: ${context.selectedAsset.id}), current status: ${context.selectedAsset.status}]`);
  }
  if (context.activeFilters.length > 0) {
    parts.push(`[Active filters: ${context.activeFilters.join(', ')}]`);
  }
  if (context.currentPage) {
    parts.push(`[Current page: ${context.currentPage}]`);
  }

  parts.push(rawPrompt);
  return parts.join('\n\n');
}
```

---

## 4. Zustand Chat State

Minimal chat state store that components can share without prop drilling.

```tsx
import { create } from 'zustand';

interface ChatState {
  messages: Message[];
  addMessage: (msg: Message) => void;
  updateMessage: (id: string, update: Partial<Message>) => void;
  clearMessages: () => void;
  pendingPrompt: string | null;
  setPendingPrompt: (prompt: string | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateMessage: (id, update) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...update } : m)),
    })),
  clearMessages: () => set({ messages: [] }),
  pendingPrompt: null,
  setPendingPrompt: (prompt) => set({ pendingPrompt: prompt }),
}));
```

---

## 5. FastAPI SSE Headers

Critical headers for streaming through proxies. Without these, nginx and CDNs will buffer the entire response.

```python
return StreamingResponse(
    event_generator(),
    media_type="text/event-stream",
    headers={
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",  # required for nginx
    },
)
```

---

## 6. Multi-Agent Orchestration

**Pattern:** Intent classification followed by agent routing.

```
User Message
     │
     ▼
 Orchestrator
     │
     ▼
Intent Classification
     │
     ├─ analytical    → Cortex Analyst
     ├─ search/history → Cortex Search
     ├─ recommend      → Domain Agent
     ├─ status/current → Direct SQL
     ├─ comparison     → Analyst + post-processing
     └─ general        → Cortex Complete
     │
     ▼
 Aggregate Response
```

**Intent categories:**

| Intent | Route Target | Fallback |
|--------|-------------|----------|
| analytical | Cortex Analyst | Pattern-matched SQL |
| search/history | Cortex Search | Full-text search |
| recommend | Domain Agent | Rule-based suggestions |
| status/current | Direct SQL query | Cached last-known |
| comparison | Analyst + post-processing | Pre-computed comparisons |
| general | Cortex Complete (LLM) | Static FAQ |

---

## 7. Cortex Service Integration Patterns

### SEARCH_PREVIEW (RAG queries)

```sql
SELECT SNOWFLAKE.CORTEX.SEARCH_PREVIEW(
    'MY_SEARCH_SERVICE',
    'What are the maintenance procedures for pump P-100?',
    3  -- top_k results
) AS SEARCH_RESULTS;
```

### ANALYST (text-to-SQL with semantic model)

```sql
SELECT SNOWFLAKE.CORTEX.ANALYST(
    'What was total revenue by region last quarter?',
    '@MY_DB.MY_SCHEMA.MY_SEMANTIC_MODEL'
) AS ANALYST_RESPONSE;
```

### COMPLETE (LLM generation)

```sql
SELECT SNOWFLAKE.CORTEX.COMPLETE(
    'mistral-large2',
    'Summarize the key findings from this production report: ' || REPORT_TEXT
) AS SUMMARY;
```

---

## 8. Fallback Query Pattern

Always implement a 3-tier fallback so the user never sees a blank response.

```python
async def query_with_fallback(question: str, semantic_model: str) -> dict:
    # Tier 1: Cortex Analyst
    try:
        result = await cortex_analyst(question, semantic_model)
        if result.get("sql"):
            return {"source": "analyst", **result}
    except Exception:
        pass

    # Tier 2: Pattern-matched SQL
    matched_sql = match_question_to_template(question)
    if matched_sql:
        try:
            rows = snowflake_service.execute_query(matched_sql)
            return {"source": "pattern_match", "sql": matched_sql, "rows": rows}
        except Exception:
            pass

    # Tier 3: Explain what happened
    return {
        "source": "fallback",
        "response": f"I couldn't generate a precise answer for '{question}'. "
                    "Try rephrasing or ask about a specific metric.",
    }
```

---

## 9. Domain-Specific LLM Prompting

Structure prompts with explicit role, context data, output requirements, and terminology.

```python
prompt = f"""You are a {domain} operations analyst at {company_name}.

CONTEXT DATA:
{json.dumps(context_data, indent=2)}

ANALYSIS REQUIREMENTS:
1. Identify the top 3 anomalies in the data
2. For each anomaly, provide root cause hypothesis
3. Recommend specific actions with priority (high/medium/low)

TERMINOLOGY:
- OEE = Overall Equipment Effectiveness
- MTBF = Mean Time Between Failures
- Golden Batch = yield >= 95%

OUTPUT FORMAT:
Return a JSON object with keys: anomalies, root_causes, recommendations
"""
```

---

## 10. Chart Color Consistency

Define entity colors globally and reuse across selection UI chips and chart strokes.

```tsx
const ENTITY_COLORS: Record<string, string> = {
  'Line A': '#29B5E8',
  'Line B': '#71D4F5',
  'Line C': '#0D9DC7',
  'Line D': '#A8E6F5',
};

// In selection chips
<div
  className="px-2 py-1 rounded-full text-xs"
  style={{ backgroundColor: ENTITY_COLORS[entity] + '20', color: ENTITY_COLORS[entity] }}
>
  {entity}
</div>

// In Recharts
{selectedEntities.map((entity) => (
  <Line key={entity} dataKey={entity} stroke={ENTITY_COLORS[entity]} strokeWidth={2} />
))}
```

---

## 11. Recharts Patterns

**Inverted Y-axis** (for depth charts or rankings where lower is better):

```tsx
<YAxis reversed domain={['dataMin', 'dataMax']} />
```

**Area gradients with entity-specific colors:**

```tsx
<defs>
  {selectedEntities.map((entity) => (
    <linearGradient key={entity} id={`grad-${entity}`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor={ENTITY_COLORS[entity]} stopOpacity={0.3} />
      <stop offset="95%" stopColor={ENTITY_COLORS[entity]} stopOpacity={0} />
    </linearGradient>
  ))}
</defs>
{selectedEntities.map((entity) => (
  <Area
    key={entity}
    dataKey={entity}
    stroke={ENTITY_COLORS[entity]}
    fill={`url(#grad-${entity})`}
  />
))}
```

---

## 12. Agent Status Indicators

Visual pattern for showing multi-agent status with colored dots.

```tsx
interface AgentStatus {
  name: string;
  icon: string;
  status: 'active' | 'idle' | 'error';
}

function AgentStatusBar({ agents }: { agents: AgentStatus[] }) {
  const dotColor = {
    active: 'bg-emerald-400',
    idle: 'bg-slate-400',
    error: 'bg-red-400',
  };

  return (
    <div className="flex gap-3">
      {agents.map((agent) => (
        <div key={agent.name} className="flex items-center gap-1.5 text-xs text-slate-300">
          <span className={`w-2 h-2 rounded-full ${dotColor[agent.status]}`} />
          <span>{agent.icon}</span>
          <span>{agent.name}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## 13. Markdown Rendering with Tailwind

Render LLM-generated markdown in chat responses with consistent styling.

```tsx
<div className="prose prose-sm prose-invert max-w-none
  prose-p:my-1 prose-li:my-0.5 prose-headings:mt-3 prose-headings:mb-1
  prose-code:bg-slate-800 prose-code:px-1 prose-code:rounded
  prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700">
  <ReactMarkdown>{message.content}</ReactMarkdown>
</div>
```

---

## 14. WebSocket Real-Time Pattern

For live data panels that need push updates (not request-response SSE).

**Python ConnectionManager:**

```python
from fastapi import WebSocket


class ConnectionManager:
    """Manages WebSocket connections grouped by entity_id."""

    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, entity_id: str):
        await websocket.accept()
        if entity_id not in self.active_connections:
            self.active_connections[entity_id] = []
        self.active_connections[entity_id].append(websocket)

    def disconnect(self, websocket: WebSocket, entity_id: str):
        if entity_id in self.active_connections:
            self.active_connections[entity_id] = [
                ws for ws in self.active_connections[entity_id] if ws != websocket
            ]
            if not self.active_connections[entity_id]:
                del self.active_connections[entity_id]

    async def broadcast(self, entity_id: str, data: dict):
        if entity_id not in self.active_connections:
            return
        dead: list[WebSocket] = []
        for ws in self.active_connections[entity_id]:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, entity_id)


manager = ConnectionManager()


@app.websocket("/ws/{entity_id}")
async def websocket_endpoint(websocket: WebSocket, entity_id: str):
    await manager.connect(websocket, entity_id)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        manager.disconnect(websocket, entity_id)
```

**Frontend hook:**

```tsx
function useLiveData(entityId: string) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/${entityId}`);
    ws.onmessage = (event) => setData(JSON.parse(event.data));
    ws.onclose = () => setTimeout(() => ws.close(), 3000);
    return () => ws.close();
  }, [entityId]);

  return data;
}
```

---

## 15. Markdown Rendering with Tailwind

> (See pattern 13 above for the Tailwind prose classes.)

This section covers **dynamic content rendering** for structured LLM outputs:

```tsx
function RenderAgentResponse({ response }: { response: AgentResponse }) {
  return (
    <div className="space-y-3">
      {response.parts.map((part, i) => {
        switch (part.type) {
          case 'text':
            return <MarkdownBlock key={i} content={part.text} />;
          case 'tool':
            return <ToolCard key={i} tool={part} />;
          case 'source':
            return <SourceCitation key={i} source={part} />;
          case 'reasoning':
            return <ReasoningExpander key={i} text={part.text} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
```

# Additional Learnings from Copilot Implementation

## Critical Production Patterns (from AutoGL Yield Optimization)

### 1. Race Condition Prevention for Pending Prompts

When using global state to trigger chat messages from other components (e.g., clicking a button sets `pendingPrompt`), useEffect can fire multiple times causing duplicate messages.

**Solution**: Use a ref to track what's already been processed:

```typescript
const processingPromptRef = useRef<string | null>(null)

useEffect(() => {
  // Only process if: prompt exists, not streaming, AND not already processing this prompt
  if (pendingPrompt && status !== 'streaming' && processingPromptRef.current !== pendingPrompt) {
    processingPromptRef.current = pendingPrompt  // Mark as processing
    setPendingPrompt(null)  // Clear from global state immediately
    sendMessage(pendingPrompt)
  }
}, [pendingPrompt, status])
```

### 2. SSE Buffer Management

SSE chunks may split mid-line. Always buffer incomplete lines:

```typescript
buffer += decoder.decode(value, { stream: true })
const lines = buffer.split('\n')
buffer = lines.pop() || ''  // Keep incomplete line for next iteration
```

### 3. Context Injection Pattern

Prepend page/selection context to user prompts for contextual AI responses:

```typescript
let contextualPrompt = input
if (selectedAsset) {
  contextualPrompt = `[Context: User is viewing asset "${selectedAsset.asset_name}" (${selectedAsset.asset_type})]\n\n${input}`
} else if (chatContext) {
  contextualPrompt = `[Context: ${chatContext}]\n\n${input}`
}
```

### 4. Zustand Chat State

Minimal chat state management pattern:

```typescript
interface ChatState {
  messages: CortexMessage[]
  addMessage: (msg: CortexMessage) => void
  updateMessage: (id: string, updates: Partial<CortexMessage>) => void
  clearMessages: () => void
  pendingPrompt: string | null
  setPendingPrompt: (prompt: string | null) => void
}
```

### 5. FastAPI SSE Headers

Critical headers for streaming through proxies:

```python
headers={
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no"  # Required for nginx
}
```

### 6. Markdown Rendering with Tailwind

Use prose classes with size overrides:

```tsx
<div className="prose prose-sm prose-invert max-w-none 
  prose-p:my-1 prose-code:text-xs prose-code:bg-slate-700/50">
  <ReactMarkdown>{message.content}</ReactMarkdown>
</div>
```

## Patterns to Add to Skill

### 1. Multi-Agent Orchestration Pattern (HIGH impact)

The copilot implements a sophisticated **intent classification → agent routing** pattern:

```
User Message → Orchestrator → Intent Classification → Route to Agent(s) → Aggregate Response
```

**Key components:**
- `AgentOrchestrator` - Central coordinator with regex-based intent classification
- `BaseAgent` - Abstract base with `process()` and `get_tools()` methods
- Specialized agents: `HistorianAgent` (RAG search), `AdvisorAgent` (recommendations), `WatchdogAgent` (monitoring)

**Intent categories:**
- `analytical` - SQL/data queries → Cortex Analyst fallback to direct SQL
- `search/history` - RAG queries → Cortex Search
- `recommend` - Parameter suggestions → Offset well analysis
- `status/current` - Real-time data → Direct queries
- `comparison` - Multi-well analysis → Aggregation queries
- `general` - Fallback → Multiple agents

### 2. Cortex Service Integration Patterns

> **Important:** The SQL patterns below (SEARCH_PREVIEW, ANALYST, COMPLETE)
> are shown for reference only. In a copilot app with a Cortex Agent, these
> services are configured as **agent tools** — do NOT call them manually
> from API chat endpoints. Use `cortex_agent_service.py` to invoke the
> agent, which orchestrates these tools automatically. See `rules/sf-no-sql-agent.md`.

**Cortex Search with SEARCH_PREVIEW:**
```python
sql = f"""
SELECT SNOWFLAKE.CORTEX.SEARCH_PREVIEW(
    'DATABASE.SCHEMA.SEARCH_SERVICE',
    '{{"query": "{query}", "columns": [...], "limit": {limit}, "filter": ...}}'
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

### 3. WebSocket Real-Time Pattern

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

@app.websocket("/ws/realtime/{entity_id}")
async def websocket_endpoint(websocket: WebSocket, entity_id: str):
    await manager.connect(websocket, entity_id)
    while True:
        data = await fetch_latest_data(entity_id)
        await websocket.send_json(data)
        await asyncio.sleep(5)  # Polling interval
```

### 4. Context Panel Pattern (UI)

Three-panel layout with context propagation:
```
[Left: Live Parameters/Alerts] [Center: Chat] [Right: Context Panel]
                                    ↓
                             onContextUpdate
                                    ↓
                        Context panel updates with:
                        - Query results
                        - DDR search results
                        - Offset analysis data
                        - Recommendations
```

### 5. Snow CLI as Query Interface

Instead of direct `snowflake-connector-python`, uses Snow CLI for auth simplicity:

```python
cmd = [
    self.snow_path, "sql", 
    "-c", self.connection_name,
    "--format", "JSON",
    "-q", query
]
result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
```

**Benefits:**
- Leverages existing CLI auth config
- No credential management in code
- JSON output for reliable parsing

### 6. Fallback Query Patterns

**Pattern**: Cortex Analyst → Pattern-matched SQL → Error message

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
    return {"response": "I can answer: • How many wells? • List wells..."}
```

### 7. Domain-Specific LLM Prompting (Toolbox Service)

For domain-specific generation, structure prompts with:
1. Role definition
2. Context data (JSON)
3. Specific output requirements
4. Terminology guidance

```python
prompt = f"""You are a drilling operations assistant...

Context:
- Well: {well_id}
- Current Depth: {current_depth}m

Historical Watch Points Found:
{json.dumps(watch_points, indent=2)}

Generate a brief (2-3 sentences) executive summary...
Be concise and actionable. Use technical drilling terminology."""
```

### 8. Chart Color Consistency

Define colors globally for multi-series charts:

```tsx
const ENTITY_COLORS: Record<string, string> = {
  'Entity-A': '#3b82f6',
  'Entity-B': '#10b981',
  'Entity-C': '#f59e0b',
  // ...
}

// Use in both selection chips and chart lines
<button style={{ backgroundColor: ENTITY_COLORS[name] }}>
<Line stroke={ENTITY_COLORS[name]} />
```

### 9. Recharts Patterns for Snowflake Data

**Days vs Depth (inverted Y-axis):**
```tsx
<LineChart data={data}>
  <YAxis reversed domain={['dataMin', 'dataMax']} />
  {entities.map(name => (
    <Line key={name} dataKey={name} stroke={COLORS[name]} />
  ))}
</LineChart>
```

**Parameter vs Depth with gradients:**
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

### 10. Agent Status Indicators

Visual pattern for multi-agent status:

```tsx
const agents = [
  { name: 'Orchestrator', icon: Brain, status: 'idle' },
  { name: 'Historian', icon: Search, status: 'idle' },
  { name: 'Advisor', icon: Database, status: 'idle' },
  { name: 'Watchdog', icon: Shield, status: 'active' },
]

{agents.map(agent => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-700/50">
    <agent.icon size={14} className={agent.status === 'active' ? 'text-emerald-400' : 'text-slate-400'} />
    <div className={`w-1.5 h-1.5 rounded-full ${statusColor(agent.status)}`} />
  </div>
))}
```

## New Rules to Add

### `sf-cortex-search` (HIGH)
Use SEARCH_PREVIEW for RAG queries with JSON filter syntax.

### `sf-cortex-analyst-fallback` (HIGH)
Always implement SQL fallback when Cortex Analyst unavailable.

### `sf-cortex-llm-prompts` (MEDIUM)
Structure prompts with role, context JSON, and output requirements.

### `arch-multi-agent` (HIGH)
Use intent classification to route to specialized agent handlers.

### `arch-context-propagation` (HIGH)
Pass context from chat responses to update sidebar panels.

### `ux-agent-status` (MEDIUM)
Show visual status indicators for background agent activity.

### `ux-entity-colors` (MEDIUM)
Define consistent colors for entities across selection UI and charts.

# Copilot Implementation Patterns

## Agent-First Architecture

All ISF copilot applications use Cortex Agents as the AI backbone. The agent handles tool routing, intent classification, and orchestration automatically. Do NOT build manual Python intent classification.

### Agent-Proxy Pattern

```
React (useCortexAgent)
  → fetch('/api/agent/run', { persona, message, thread_id })
    → FastAPI (cortex_agent_service.py)
      → Snowflake Cortex Agent REST API
        → SSE events stream back through all layers
```

The `persona` parameter routes to the correct persona agent via `CORTEX_AGENT_PERSONA_{PERSONA}` env vars. See `cortex_agent_service.py` template.

### Agent SSE Frontend Patterns

SSE chunks may split mid-line. Always buffer incomplete lines:

```typescript
buffer += decoder.decode(value, { stream: true })
const lines = buffer.split('\n')
buffer = lines.pop() || ''
```

Handle event types from `cortex_agent_service.py`:

| Frontend Event | UI Action |
|---|---|
| `text_delta` | Append to message content (typewriter) |
| `tool_start` | Show tool execution indicator |
| `tool_result` | Update context panel with results |
| `analyst_delta` | Show SQL + result set in context panel |
| `table` | Render data table in message |
| `chart` | Render Vega-Lite chart from spec |
| `annotation` | Show source citation |
| `reasoning` | Show agent thinking animation |
| `status` | Update agent status indicator |
| `message_complete` | Finalize message, enable input |
| `metadata` | Store message_id for thread continuation |

## Persona Page Navigation

### Route Structure

```
/                    → Redirect to /operational (default)
/strategic           → VP/Director page (CommandCenter aggregate)
/operational         → Manager page (CommandCenter full)
/technical           → Analyst page (AnalyticsExplorer + Agent)
```

### Sidebar Navigation

```tsx
const PERSONA_NAV = [
  { path: '/strategic', label: 'Strategic', icon: Briefcase },
  { path: '/operational', label: 'Operations', icon: Shield },
  { path: '/technical', label: 'Technical', icon: Microscope },
]
```

### Per-Page Thread Management

Each persona page manages its own agent thread independently. Navigating between pages does NOT share conversation history. Use a Zustand store keyed by persona:

```typescript
interface PersonaChatState {
  threads: Record<string, { threadId: string; messages: CortexMessage[] }>
  getThread: (persona: string) => { threadId: string; messages: CortexMessage[] }
}
```

## Action Tool UX Patterns

When the agent invokes action tools (stored procedures for alerts, tickets, exports), the frontend must provide clear feedback.

### Confirmation Dialog

Before executing destructive or external actions, show a confirmation:

```tsx
function ActionConfirmation({ action, onConfirm, onCancel }: ActionConfirmProps) {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
      <p className="font-medium text-amber-300">Confirm action: {action.name}</p>
      <p className="text-sm text-slate-300 mt-1">{action.description}</p>
      <div className="flex gap-2 mt-3">
        <Button variant="primary" onClick={onConfirm}>Confirm</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}
```

### Progress Indicators

Show tool execution progress during `tool_status` events:

```tsx
function ToolProgress({ toolName, status }: { toolName: string; status: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-400">
      <Loader2 className="h-3 w-3 animate-spin" />
      <span>Running {toolName}: {status}</span>
    </div>
  )
}
```

### Success/Failure Toasts

After action tool completion, show result:

```tsx
if (event.event_type === 'tool_result' && event.status === 'success') {
  toast.success(`${event.tool_name} completed successfully`)
} else if (event.event_type === 'tool_result' && event.status === 'error') {
  toast.error(`${event.tool_name} failed: ${event.content}`)
}
```

## Feedback Integration

Wire thumbs up/down to the feedback endpoint:

```tsx
async function submitFeedback(requestId: string, positive: boolean, persona: string) {
  await fetch('/api/agent/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orig_request_id: requestId, positive, persona }),
  })
}
```

## Critical Production Patterns

### Race Condition Prevention for Pending Prompts

When using global state to trigger chat messages from other components, useEffect can fire multiple times.

```typescript
const processingPromptRef = useRef<string | null>(null)

useEffect(() => {
  if (pendingPrompt && status !== 'streaming' && processingPromptRef.current !== pendingPrompt) {
    processingPromptRef.current = pendingPrompt
    setPendingPrompt(null)
    sendMessage(pendingPrompt)
  }
}, [pendingPrompt, status])
```

### Context Injection Pattern

Prepend page/selection context to user prompts:

```typescript
let contextualPrompt = input
if (selectedAsset) {
  contextualPrompt = `[Context: User is viewing asset "${selectedAsset.name}" (${selectedAsset.type})]\n\n${input}`
}
```

### Zustand Chat State

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

### FastAPI SSE Headers

Critical headers for streaming through proxies:

```python
headers={
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no"  # Required for nginx
}
```

### Markdown Rendering with Tailwind

```tsx
<div className="prose prose-sm prose-invert max-w-none
  prose-p:my-1 prose-code:text-xs prose-code:bg-slate-700/50">
  <ReactMarkdown>{message.content}</ReactMarkdown>
</div>
```

### Chart Color Consistency

Define colors globally for multi-series charts:

```tsx
const ENTITY_COLORS: Record<string, string> = {
  'Entity-A': '#3b82f6',
  'Entity-B': '#10b981',
  'Entity-C': '#f59e0b',
}
```

### Context Panel Pattern (UI)

Three-panel layout with context propagation:

```
[Left: Live Parameters/Alerts] [Center: Chat] [Right: Context Panel]
                                    ↓
                             onContextUpdate
                                    ↓
                        Context panel updates with:
                        - Query results (from analyst_delta)
                        - Search results (from tool_result)
                        - Chart specs (from chart event)
```

---

## Legacy Reference (Deprecated Patterns)

> The patterns below are kept for reference when maintaining older solutions.
> New solutions MUST use the agent-proxy pattern above.

### SQL-Based Cortex Service Calls (DEPRECATED)

> Do NOT use these in copilot apps with a Cortex Agent. These services are
> configured as **agent tools** -- the agent orchestrates them automatically.
> See `rules/sf-no-sql-agent.md`.

**Cortex Search with SEARCH_PREVIEW:**
```python
sql = f"""
SELECT SNOWFLAKE.CORTEX.SEARCH_PREVIEW(
    'DATABASE.SCHEMA.SEARCH_SERVICE',
    '{{"query": "{query}", "columns": [...], "limit": {limit}}}'
) as RESULT
"""
```

**Cortex Analyst:**
```python
sql = f"""
SELECT SNOWFLAKE.CORTEX.ANALYST(
    '@DATABASE.SCHEMA.STAGE/semantic_views/operational.yaml',
    '{question}'
) as RESPONSE
"""
```

**Cortex LLM for Generation (data generation only, not copilot chat):**
```python
sql = f"""
SELECT SNOWFLAKE.CORTEX.COMPLETE(
    'mistral-large2',
    '{escaped_prompt}'
) as RESPONSE
"""
```

### Manual Multi-Agent Orchestration (DEPRECATED)

> Replaced by Cortex Agent tool routing via `orchestration` instructions.
> See `rules/arch-multi-agent.md` for the correct pattern.

```python
# DEPRECATED — do not use in new solutions
class AgentOrchestrator:
    def process_message(self, message):
        intent = self._classify_intent(message)
        if intent == "analytical": return self.analyst.run(message)
```

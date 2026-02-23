---
name: snowflake-cortex-agent
description: Build Cortex Agents that combine Analyst, Search, and custom tools. Use when: (1) creating multi-tool agents, (2) orchestrating Analyst + Search + UDFs, (3) configuring tool_resources, (4) fixing 404 endpoint errors, or (5) parsing streaming event responses.
parent_skill: build_solution
---

# Cortex Agent Development

## Overview

A Cortex Agent orchestrates multiple tools:
- **Analyst tool**: Text-to-SQL via semantic model
- **Search tool**: Document/text search via Cortex Search
- **Custom tool**: UDFs/procedures for domain logic

## Quick Start

### Create Agent with Tools

```sql
CREATE OR REPLACE AGENT DB.SCHEMA.MY_AGENT
FROM SPECIFICATION
$$
{
  "models": {"orchestration": "auto"},
  "tools": [
    {
      "tool_spec": {
        "type": "cortex_analyst_text_to_sql",
        "name": "SALES_ANALYTICS",
        "description": "Query sales and revenue data"
      }
    },
    {
      "tool_spec": {
        "type": "cortex_search",
        "name": "DOC_SEARCH",
        "description": "Search product documentation"
      }
    }
  ],
  "tool_resources": {
    "SALES_ANALYTICS": {
      "semantic_model_file": "@DB.SCHEMA.MODELS/sales.yaml",
      "execution_environment": {
        "type": "warehouse",
        "warehouse": "AGENT_WH",
        "query_timeout": 300
      }
    },
    "DOC_SEARCH": {
      "search_service": "DB.SCHEMA.DOC_SEARCH_SVC",
      "id_column": "CHUNK_ID",
      "max_results": 5
    }
  }
}
$$;
```

## Tool Types

### Analyst Tool (CRITICAL: execution_environment required)

```json
{
  "tool_spec": {
    "type": "cortex_analyst_text_to_sql",
    "name": "ANALYTICS",
    "description": "Query structured data using natural language"
  }
},
"tool_resources": {
  "ANALYTICS": {
    "semantic_model_file": "@DB.SCHEMA.MODELS/model.yaml",
    "execution_environment": {
      "type": "warehouse",
      "warehouse": "WH_NAME",
      "query_timeout": 300
    }
  }
}
```

**Missing `execution_environment` causes:** "The Analyst tool is missing an execution environment."

### Search Tool (CRITICAL: id_column must be in SELECT)

```json
{
  "tool_spec": {
    "type": "cortex_search",
    "name": "DOC_SEARCH",
    "description": "Search documents and FAQs"
  }
},
"tool_resources": {
  "DOC_SEARCH": {
    "search_service": "DB.SCHEMA.SEARCH_SVC",
    "id_column": "CHUNK_ID",
    "title_column": "RELATIVE_PATH",
    "max_results": 5
  }
}
```

### Custom Tool (UDF)

```json
{
  "tool_spec": {
    "type": "custom",
    "name": "RISK_SCORE",
    "description": "Calculate customer risk score"
  }
},
"tool_resources": {
  "RISK_SCORE": {
    "function_name": "DB.SCHEMA.CUSTOMER_RISK_SCORE",
    "input_schema": [
      {"name": "customer_id", "type": "string"}
    ],
    "output_schema": {"type": "float"}
  }
}
```

## Calling from FastAPI Backend

**CRITICAL**: Use `/agents/` not `/cortex-agents/` in the endpoint path.

```python
# Endpoint pattern for REST API calls
f"/api/v2/databases/{DB}/schemas/{SCHEMA}/agents/{AGENT}:run"
```

For full FastAPI backend implementation with SSE streaming, see `react-app/SKILL.md` and `react-app/templates/cortex_agent_service.py`.

## Response Format

Agent responses use streaming event format:

```json
[
  {"event": "text", "data": {"text": "Here is..."}},
  {"event": "tool_result", "data": {"text": "SQL result..."}},
  {"event": "done", "data": "[DONE]"}
]
```

Event types:
- `text`: Assistant text (accumulate from multiple)
- `tool_result`: Results from tool execution
- `analyst_result`: Cortex Analyst results
- `error`: Error with `message` and `code`
- `done`: End of stream

## Best Practices

| Practice | Recommendation |
|----------|----------------|
| Tools per agent | 3-5 max; keep focused |
| Tool descriptions | State what + when to use + when NOT to |
| Naming | Consistent across tools (customer_id everywhere) |
| Testing | Test each tool independently first |

## Grants Required

```sql
GRANT DATABASE ROLE SNOWFLAKE.CORTEX_USER TO ROLE AGENT_ROLE;
GRANT USAGE ON WAREHOUSE WH TO ROLE AGENT_ROLE;
GRANT SELECT ON ALL TABLES IN SCHEMA DB.MART TO ROLE AGENT_ROLE;
GRANT USAGE ON CORTEX SEARCH SERVICE DB.SCHEMA.SVC TO ROLE AGENT_ROLE;
GRANT USAGE ON FUNCTION DB.SCHEMA.UDF(STRING) TO ROLE AGENT_ROLE;
GRANT USAGE ON AGENT DB.SCHEMA.AGENT TO ROLE APP_ROLE;
```

## React Integration Patterns

### SSE Streaming Hook (useCortexAgent)

```typescript
import { useCallback, useState, useRef } from 'react'

type AgentStatus = 'idle' | 'streaming' | 'error'

interface CortexMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: { id: string; name: string; status: string; output?: any }[]
}

export function useCortexAgent() {
  const [status, setStatus] = useState<AgentStatus>('idle')
  const [reasoningStage, setReasoningStage] = useState<string | null>(null)
  
  const sendMessage = useCallback(async (content: string, addMessage: Function, updateMessage: Function) => {
    const userMessage = { id: crypto.randomUUID(), role: 'user', content, timestamp: new Date() }
    addMessage(userMessage)

    const assistantId = crypto.randomUUID()
    addMessage({ id: assistantId, role: 'assistant', content: '', timestamp: new Date(), toolCalls: [] })

    setStatus('streaming')
    setReasoningStage('Connecting...')

    try {
      const response = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      })
      
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''
      const toolCalls: any[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''  // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue

          try {
            const event = JSON.parse(data)
            switch (event.type) {
              case 'text_delta':
                fullContent += event.text
                updateMessage(assistantId, { content: fullContent })
                break
              case 'tool_start':
                setReasoningStage(`Using ${event.tool_name}...`)
                toolCalls.push({ id: event.tool_call_id, name: event.tool_name, status: 'running' })
                updateMessage(assistantId, { toolCalls: [...toolCalls] })
                break
              case 'tool_end':
                const idx = toolCalls.findIndex(t => t.name === event.tool_name && t.status === 'running')
                if (idx >= 0) toolCalls[idx] = { ...toolCalls[idx], status: 'completed', output: event.output }
                updateMessage(assistantId, { toolCalls: [...toolCalls] })
                break
              case 'error':
                throw new Error(event.message)
            }
          } catch (e) { if (!(e instanceof SyntaxError)) throw e }
        }
      }
      setStatus('idle')
      setReasoningStage(null)
    } catch (error) {
      setStatus('error')
      updateMessage(assistantId, { content: 'Error occurred. Please try again.' })
    }
  }, [])

  return { sendMessage, status, reasoningStage }
}
```

### Race Condition Prevention (CRITICAL)

When processing pending prompts from global state (e.g., Zustand), use a ref to prevent duplicate sends:

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

Prepend context to user messages for contextual responses:

```typescript
let contextualPrompt = input
if (selectedAsset) {
  contextualPrompt = `[Context: User is viewing "${selectedAsset.name}" (${selectedAsset.type})]\n\n${input}`
} else if (pageContext) {
  contextualPrompt = `[Context: ${pageContext}]\n\n${input}`
}
await sendMessage(contextualPrompt)
```

### Zustand State for Chat

```typescript
import { create } from 'zustand'

interface ChatState {
  messages: CortexMessage[]
  addMessage: (msg: CortexMessage) => void
  updateMessage: (id: string, updates: Partial<CortexMessage>) => void
  clearMessages: () => void
  pendingPrompt: string | null
  setPendingPrompt: (prompt: string | null) => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateMessage: (id, updates) => set((s) => ({
    messages: s.messages.map((m) => m.id === id ? { ...m, ...updates } : m)
  })),
  clearMessages: () => set({ messages: [] }),
  pendingPrompt: null,
  setPendingPrompt: (prompt) => set({ pendingPrompt: prompt }),
}))
```

### FastAPI SSE Backend (Python)

```python
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import json

router = APIRouter()

async def stream_agent_response(message: str):
    yield f"data: {json.dumps({'type': 'reasoning', 'text': 'Analyzing...'})}\n\n"
    yield f"data: {json.dumps({'type': 'tool_start', 'tool_name': 'Data Query'})}\n\n"
    # ... process and yield results
    yield f"data: {json.dumps({'type': 'tool_end', 'tool_name': 'Data Query', 'output': 'Done'})}\n\n"
    yield f"data: {json.dumps({'type': 'text_delta', 'text': response_text})}\n\n"
    yield "data: [DONE]\n\n"

@router.post("/run")
async def run_agent(request: AgentRequest):
    return StreamingResponse(
        stream_agent_response(request.message),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Critical for nginx proxies
        }
    )
```

### Markdown Rendering with Tailwind

```tsx
import ReactMarkdown from 'react-markdown'

<div className="prose prose-sm prose-invert max-w-none 
  prose-p:my-1 prose-ul:my-1 prose-code:text-xs prose-code:bg-slate-700/50">
  <ReactMarkdown>{message.content}</ReactMarkdown>
</div>
```

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| 404 Not Found | Wrong endpoint path | Use `/agents/` not `/cortex-agents/` |
| Missing execution environment | No warehouse config for Analyst | Add `execution_environment` block |
| Technical difficulties | Search id_column not in SELECT | Include id_column in search service query |
| Duplicate messages in React | Race condition in useEffect | Use ref to track processed prompts |
| SSE not streaming | Missing headers | Add `X-Accel-Buffering: no` for nginx |
| Buffer incomplete JSON | Line split mid-chunk | Keep incomplete line in buffer with `lines.pop()` |


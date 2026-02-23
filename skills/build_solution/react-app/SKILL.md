---
name: snowflake-demo-react-app
description: "Build React+FastAPI copilot apps from Snowflake projects. Use when: creating React dashboards, building copilot UIs, reviewing React code for performance, or auditing UI accessibility."
parent_skill: build_solution
license: MIT
metadata:
  author: snowflake
  version: "2.1.0"
  argument-hint: <file-or-pattern>
---

# Snowflake Demo React App

Build production-quality React applications with FastAPI backends that connect to Snowflake data. This skill captures architecture patterns from successful copilot implementations and includes 50+ best practice rules for React/Snowflake apps.

## Component Library (v2.1)

Composable React components for Cortex Agent integration, following modern compound component patterns.

### Core Components

| Component | Description |
|-----------|-------------|
| `<CortexConversation>` | Container with auto-scroll and empty state |
| `<CortexConversationContent>` | Scrollable message list |
| `<CortexConversationEmptyState>` | Welcome screen with suggestions |
| `<CortexMessage>` | User/assistant message with avatar |
| `<CortexMessageContent>` | Text content wrapper |
| `<CortexMessageActions>` | Copy, feedback buttons |
| `<CortexPromptInput>` | Input container with submit |
| `<CortexPromptInputTextarea>` | Auto-resizing textarea |
| `<CortexPromptInputSubmit>` | Send button with loading state |

### Agent Components

| Component | Description |
|-----------|-------------|
| `<CortexReasoning>` | Auto-collapsing thought process display |
| `<CortexReasoningTrigger>` | Stage indicator with animation |
| `<CortexReasoningContent>` | Thought details |
| `<CortexTool>` | Tool execution with status badge |
| `<CortexToolHeader>` | Tool name, type, status, duration |
| `<CortexToolContent>` | Collapsible input/output |
| `<CortexToolInput>` | JSON input display |
| `<CortexToolOutput>` | SQL + result display |
| `<CortexSources>` | Collapsible citations list |
| `<CortexSourcesTrigger>` | "Sources (n)" toggle |
| `<CortexSource>` | Individual citation pill |

### Hooks

| Hook | Description |
|------|-------------|
| `useCortexAgent` | SSE streaming with structured events |
| `useAutoScroll` | Auto-scroll on new messages |

### Quick Example

```tsx
import {
  CortexConversation,
  CortexConversationContent,
  CortexConversationEmptyState,
  CortexMessage,
  CortexMessageContent,
  CortexReasoning,
  CortexReasoningTrigger,
  CortexReasoningContent,
  CortexTool,
  CortexToolHeader,
  CortexToolContent,
  CortexToolOutput,
  CortexSourcesList,
  CortexPromptInput,
} from './components';
import { useCortexAgent } from './hooks';

function CortexChat() {
  const { messages, status, sendMessage, reasoningStage } = useCortexAgent({
    endpoint: '/api/agent/run',
  });

  return (
    <CortexConversation className="h-screen bg-navy-900">
      <CortexConversationContent>
        {messages.length === 0 ? (
          <CortexConversationEmptyState
            title="Ask me anything"
            description="I can help you analyze data using Snowflake"
            suggestions={['Show top customers', 'Revenue trend']}
            onSuggestionClick={sendMessage}
          />
        ) : (
          messages.map((msg) => (
            <CortexMessage key={msg.id} from={msg.role}>
              <CortexMessageContent>{msg.content}</CortexMessageContent>
              
              {/* Show reasoning while streaming */}
              {msg.isStreaming && reasoningStage !== 'idle' && (
                <CortexReasoning isStreaming stage={reasoningStage}>
                  <CortexReasoningTrigger />
                  <CortexReasoningContent>
                    Processing your request...
                  </CortexReasoningContent>
                </CortexReasoning>
              )}
              
              {/* Render tool calls */}
              {msg.parts
                .filter((p) => p.type === 'tool')
                .map((tool, i) => (
                  <CortexTool
                    key={i}
                    name={tool.name}
                    type={tool.toolType}
                    status={tool.status}
                  >
                    <CortexToolHeader />
                    <CortexToolContent>
                      <CortexToolOutput sql={tool.sql} output={tool.output} />
                    </CortexToolContent>
                  </CortexTool>
                ))}
              
              {/* Render sources */}
              <CortexSourcesList
                sources={msg.parts.filter((p) => p.type === 'source')}
              />
            </CortexMessage>
          ))
        )}
      </CortexConversationContent>
      
      <CortexPromptInput
        onSubmit={sendMessage}
        isLoading={status === 'streaming'}
        placeholder="Ask about your data..."
      />
    </CortexConversation>
  );
}
```

### Component Files

```
templates/
├── components/
│   ├── index.ts                 # Exports all components
│   ├── CortexConversation.tsx   # Conversation container
│   ├── CortexMessage.tsx        # Message compound component
│   ├── CortexPromptInput.tsx    # Input with submit
│   ├── CortexReasoning.tsx      # Thinking visualization
│   ├── CortexTool.tsx           # Tool execution display
│   └── CortexSources.tsx        # Citations display
├── hooks/
│   ├── index.ts
│   ├── useCortexAgent.ts        # SSE streaming hook
│   └── useAutoScroll.ts         # Scroll behavior
├── types/
│   ├── index.ts
│   └── cortex.ts                # TypeScript definitions
└── cortex_agent_service.py      # FastAPI backend proxy
```

## Capabilities

1. **Scaffold** - Create new React+FastAPI projects from Snowflake data
2. **Convert** - Transform Streamlit apps into React applications
3. **Review** - Audit existing React code for performance and accessibility
4. **Integrate** - Add Cortex Agent chat to any React app

## Rule Categories by Priority

| Priority | Category | Impact | Prefix | Rules |
|----------|----------|--------|--------|-------|
| 1 | Data Fetching | CRITICAL | `fetch-` | 8 |
| 2 | Bundle & Performance | CRITICAL | `bundle-` | 7 |
| 3 | Component Architecture | HIGH | `arch-` | 9 |
| 4 | Snowflake Integration | HIGH | `sf-` | 8 |
| 5 | Accessibility | MEDIUM | `a11y-` | 8 |
| 6 | Re-render Optimization | MEDIUM | `render-` | 7 |
| 7 | UX Patterns | LOW-MEDIUM | `ux-` | 7 |

## Quick Reference

### 1. Data Fetching (CRITICAL)

- `fetch-parallel` - Use Promise.all() for independent API calls
- `fetch-swr-dedup` - Use SWR/React Query for request deduplication
- `fetch-streaming` - Stream large responses with SSE
- `fetch-abort` - Abort stale requests on component unmount
- `fetch-error-boundary` - Wrap data components in error boundaries
- `fetch-optimistic` - Update UI optimistically, rollback on error
- `fetch-pagination` - Paginate large datasets, never fetch all
- `fetch-cache-headers` - Respect cache headers from Snowflake APIs

### 2. Bundle & Performance (CRITICAL)

- `bundle-direct-imports` - Import directly from lucide-react/dist/esm/icons/*
- `bundle-dynamic-chat` - Lazy load chat widget with next/dynamic or React.lazy
- `bundle-defer-charts` - Load Recharts only when tab/section is visible
- `bundle-preload-hover` - Preload routes on hover for perceived speed
- `bundle-split-routes` - Code-split by route, not by component
- `bundle-tree-shake` - Use ES modules, avoid CommonJS dependencies
- `bundle-analyze` - Run bundle analyzer before production

### 3. Component Architecture (HIGH)

- `arch-compound-components` - Use compound components over boolean props
- `arch-composition` - Prefer composition over configuration props
- `arch-lift-state` - Lift shared state to nearest common ancestor
- `arch-context-split` - Split context by update frequency
- `arch-explicit-variants` - Create variant components, not boolean modes
- `arch-children-over-render` - Use children over renderX props
- `arch-multi-agent` - Use intent classification to route to specialized handlers
- `arch-context-panel` - Pass context from chat to update sidebar panels
- `arch-websocket-realtime` - Use WebSocket for real-time parameter streaming

### 4. Snowflake Integration (HIGH)

- `sf-cli-connection` - Use CLI connection profile, NEVER hardcode credentials
- `sf-connection-pool` - Reuse Snowflake connections, don't create per-request
- `sf-query-timeout` - Set explicit timeouts on all Snowflake queries
- `sf-parameterized` - Use parameterized queries, never string concatenation
- `sf-warehouse-size` - Match warehouse size to query complexity
- `sf-error-codes` - Handle specific Snowflake error codes gracefully
- `sf-analyst-fallback` - Implement SQL fallback when Cortex Analyst unavailable
- `sf-cortex-llm-prompts` - Structure LLM prompts with role, context, requirements
- `sf-cortex-search` - Use SEARCH_PREVIEW for RAG queries with JSON filters

### 5. Accessibility (MEDIUM)

- `a11y-aria-labels` - Icon buttons need aria-label
- `a11y-keyboard` - All interactive elements need keyboard handlers
- `a11y-focus-visible` - Use focus-visible, never remove outline
- `a11y-semantic-html` - Use button/a/label, not div with onClick
- `a11y-live-regions` - Use aria-live for async updates (toasts, loading)
- `a11y-skip-link` - Include skip link to main content
- `a11y-heading-hierarchy` - Maintain h1-h6 hierarchy
- `a11y-reduced-motion` - Honor prefers-reduced-motion

### 6. Re-render Optimization (MEDIUM)

- `render-memo-expensive` - Extract expensive work into memoized components
- `render-primitive-deps` - Use primitive values in useEffect dependencies
- `render-functional-setstate` - Use functional setState for stable callbacks
- `render-ref-transient` - Use refs for frequently changing values
- `render-lazy-init` - Pass function to useState for expensive initialization
- `render-derived-state` - Derive state during render, not in effects
- `render-reactflow-no-transform` - NEVER use transform in React Flow node styles

### 7. UX Patterns (LOW-MEDIUM)

- `ux-loading-skeleton` - Show skeletons, not spinners for content
- `ux-optimistic-updates` - Update UI immediately, sync in background
- `ux-url-state` - Reflect filters/tabs/pagination in URL
- `ux-error-recovery` - Provide retry actions on errors
- `ux-empty-states` - Design intentional empty states
- `ux-agent-status` - Show visual status indicators for AI agents
- `ux-entity-colors` - Define consistent colors across selection UI and charts

## How to Use

### Create New Project
Ask the agent: "Create a React app for [your Snowflake data]"

### Convert Streamlit
Ask the agent: "Convert this Streamlit app to React"

### Review Code
Ask the agent: "Review my React code" or provide files:
```
Review these files: src/components/*.tsx
```

### Audit UI
Ask the agent: "Audit accessibility" or "Check performance"

## Review Output Format

When reviewing code, output in terse `file:line` format:

```text
## src/Chat.tsx

src/Chat.tsx:42 - fetch-parallel: sequential fetches → Promise.all()
src/Chat.tsx:67 - a11y-aria-labels: Send button missing aria-label
src/Chat.tsx:89 - render-memo-expensive: extract MessageList into memo()

## src/Dashboard.tsx

src/Dashboard.tsx:23 - bundle-direct-imports: lucide barrel import → direct
src/Dashboard.tsx:56 - sf-query-timeout: missing timeout on query

## src/Layout.tsx

✓ pass
```

## Architecture

### Standard Placement in Demo Projects

React apps live in the `react/` subdirectory of demo projects:

```
project/                   # Demo project root
├── deploy.sh              # Snowflake deployment
├── run.sh                 # Runtime operations
├── clean.sh               # Teardown
├── sql/                   # DDL scripts
├── streamlit/             # Optional Streamlit app
└── react/                 # React+FastAPI app lives HERE
    ├── start.sh           # Start frontend + backend
    ├── stop.sh            # Stop services gracefully
    ├── logs/              # Runtime logs (gitignored)
    ├── .services.pid      # PID tracking (gitignored)
    ├── frontend/          # React + TypeScript + Vite
    │   ├── src/
    │   │   ├── components/
    │   │   ├── pages/
    │   │   ├── hooks/
    │   │   ├── stores/    # Zustand state management
    │   │   ├── types/
    │   │   └── styles/
    │   ├── package.json
    │   ├── tailwind.config.js
    │   └── vite.config.ts
    └── backend/           # Python FastAPI
        ├── api/
        │   ├── main.py    # REST + SSE endpoints
        │   ├── database.py # Snowflake connection
        │   └── routes/    # API route modules
        └── requirements.txt
```

### Service Management Scripts

**start.sh** - Starts both frontend and backend:
```bash
#!/bin/bash
cd "$(dirname "$0")"
mkdir -p logs
cd backend && source venv/bin/activate && SNOWFLAKE_CONNECTION_NAME="${SNOWFLAKE_CONNECTION_NAME:-demo}" uvicorn api.main:app --port 8000 &
echo $! >> ../.services.pid
cd ../frontend && npm run dev &
echo $! >> ../.services.pid
```

**stop.sh** - Graceful shutdown:
```bash
#!/bin/bash
cd "$(dirname "$0")"
if [ -f .services.pid ]; then
  while read pid; do kill $pid 2>/dev/null; done < .services.pid
  rm .services.pid
fi
```

## Snowflake Connection Pattern (CRITICAL)

ALWAYS use the Snowflake CLI connection profile pattern. NEVER hardcode credentials:

```python
# react/backend/api/database.py
import os
import snowflake.connector

_connection = None

def get_connection() -> snowflake.connector.SnowflakeConnection:
    global _connection
    if _connection is None or _connection.is_closed():
        connection_name = os.getenv("SNOWFLAKE_CONNECTION_NAME", "demo")
        _connection = snowflake.connector.connect(connection_name=connection_name)
        _connection.cursor().execute(f"USE DATABASE {DATABASE}")
        _connection.cursor().execute(f"USE SCHEMA {SCHEMA}")
        _connection.cursor().execute(f"USE WAREHOUSE {WAREHOUSE}")
    return _connection
```

This pattern:
- Uses `~/.snowflake/connections.toml` for credential storage
- Allows environment variable override via `SNOWFLAKE_CONNECTION_NAME`
- Keeps credentials OUT of code repositories
- Works with SSO, key-pair auth, and password auth

## Detailed Rule Files

Read individual rule files for explanations and code examples:

```
rules/fetch-parallel.md
rules/bundle-direct-imports.md
rules/arch-compound-components.md
rules/arch-multi-agent.md
rules/arch-context-panel.md
rules/sf-connection-pool.md
rules/sf-analyst-fallback.md
rules/sf-cortex-llm-prompts.md
rules/ux-agent-status.md
rules/ux-entity-colors.md
rules/render-reactflow-no-transform.md
```

Each rule file contains:
- Brief explanation of why it matters
- Incorrect code example
- Correct code example
- Snowflake-specific context

## Templates

Pre-built templates in `templates/` directory:

| Template | Description |
|----------|-------------|
| `CortexAgentChat.tsx` | Full React chat component with SSE streaming |
| `cortex_agent_service.py` | FastAPI backend for Cortex Agent proxy |

## Production Patterns from Real Implementations

### Race Condition Prevention (CRITICAL)

When using global state (Zustand) to trigger chat messages from other components:

```typescript
// Problem: useEffect fires multiple times causing duplicate messages
// Solution: Use ref to track what's already been processed

const processingPromptRef = useRef<string | null>(null)

useEffect(() => {
  if (pendingPrompt && status !== 'streaming' && processingPromptRef.current !== pendingPrompt) {
    processingPromptRef.current = pendingPrompt  // Mark as processing
    setPendingPrompt(null)  // Clear from global state
    sendMessage(pendingPrompt)
  }
}, [pendingPrompt, status])
```

### Context-Aware Prompts

Inject page/selection context into user messages:

```typescript
const handleSubmit = async (input: string) => {
  let contextualPrompt = input
  if (selectedAsset) {
    contextualPrompt = `[Context: User is viewing asset "${selectedAsset.asset_name}" (${selectedAsset.asset_type}) in ${selectedAsset.field}]\n\n${input}`
  } else if (chatContext) {
    contextualPrompt = `[Context: ${chatContext}]\n\n${input}`
  }
  await sendMessage(contextualPrompt)
}
```

### Zustand Store Pattern for Chat

```typescript
import { create } from 'zustand'

interface AppState {
  // Chat state
  messages: CortexMessage[]
  addMessage: (message: CortexMessage) => void
  updateMessage: (id: string, updates: Partial<CortexMessage>) => void
  clearMessages: () => void
  
  // Cross-component triggers
  pendingPrompt: string | null
  setPendingPrompt: (prompt: string | null) => void
  
  // Context
  selectedAsset: Asset | null
  setSelectedAsset: (asset: Asset | null) => void
  chatContext: string
  setChatContext: (context: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  messages: [],
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateMessage: (id, updates) => set((s) => ({
    messages: s.messages.map((m) => m.id === id ? { ...m, ...updates } : m)
  })),
  clearMessages: () => set({ messages: [] }),
  pendingPrompt: null,
  setPendingPrompt: (prompt) => set({ pendingPrompt: prompt }),
  selectedAsset: null,
  setSelectedAsset: (asset) => set({ selectedAsset: asset }),
  chatContext: '',
  setChatContext: (context) => set({ chatContext: context }),
}))
```

### SSE Streaming with Buffer Management

```typescript
const reader = response.body?.getReader()
const decoder = new TextDecoder()
let buffer = ''
let fullContent = ''

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  buffer += decoder.decode(value, { stream: true })
  const lines = buffer.split('\n')
  buffer = lines.pop() || ''  // CRITICAL: Keep incomplete line

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
          break
        case 'tool_end':
          setReasoningStage('Processing results...')
          break
      }
    } catch (e) {
      if (e instanceof SyntaxError) continue  // Skip malformed JSON
      throw e
    }
  }
}
```

### FastAPI SSE Headers (CRITICAL)

```python
@router.post("/run")
async def run_agent(request: AgentRequest):
    return StreamingResponse(
        stream_agent_response(request.message),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Required for nginx/proxies
        }
    )
```

### Markdown in Chat Messages

```tsx
import ReactMarkdown from 'react-markdown'

// Tailwind prose classes for proper markdown styling
<div className="prose prose-sm prose-invert max-w-none 
  prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 
  prose-headings:my-1.5 prose-pre:my-1 
  prose-code:text-[10px] prose-code:bg-slate-700/50 prose-code:px-1 prose-code:rounded
  [&_p]:text-xs [&_li]:text-xs">
  <ReactMarkdown>{message.content}</ReactMarkdown>
</div>
```

### Clear Chat Button Pattern

```tsx
const { messages, clearMessages } = useAppStore()

// Only show when there are messages, stop propagation if in clickable header
{messages.length > 0 && (
  <button
    onClick={(e) => { e.stopPropagation(); clearMessages(); }}
    className="p-1 hover:bg-slate-700 rounded"
    title="Clear chat history"
  >
    <Trash2 className="w-3.5 h-3.5" />
  </button>
)}
```

## Full Workflow

For complete scaffold workflow with code examples, see: `references/workflow.md`

## Cortex Agent Chat Widget

For complete chat widget documentation, see: `references/cortex-chat.md`

## Copilot Implementation Patterns

For additional patterns learned from production copilot implementations, see: `references/copilot-learnings.md`

Key patterns include:
- Multi-agent orchestration with intent classification
- Context panel updates from chat responses
- Cortex Analyst with SQL fallback
- Cortex LLM prompt structuring
- WebSocket real-time updates
- Agent status indicators

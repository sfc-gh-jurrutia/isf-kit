---
name: isf-solution-react-app
description: >
  Build React+FastAPI copilot apps for Snowflake solutions. Includes component
  library, Cortex Agent integration, SSE streaming, production rules, and
  accessibility patterns. Use when: creating React dashboards, building copilot
  UIs, implementing Cortex chat interfaces, or auditing UI accessibility.
---

# ISF React App

Build production-quality React+FastAPI applications deployed to SPCS. This skill provides architecture patterns, a component library, and 50+ best practice rules.

## Quick Start

### What Does This Skill Do?

Generates the React+FastAPI application code for an ISF solution:
- React frontend (Vite + TypeScript + Tailwind) in `src/ui/`
- FastAPI backend in `api/`
- Cortex Agent chat integration (SSE streaming)
- Deployed to SPCS via `isf-deployment`

### Input

- `plan.md` from `isf-solution-planning` (UI strategy, page template, chart assignments)
- `isf-context.md` for: personas, Cortex features, data architecture
- Cortex Agent from `isf-cortex-agent` (if chat/copilot UI)
- Style tokens from `isf-solution-style-guide`

## References

| File | Purpose | When Loaded |
|------|---------|-------------|
| `references/copilot-learnings.md` | Architecture patterns from successful copilot implementations | Always |
| `references/cortex-chat.md` | Cortex Agent chat integration patterns | When building copilot UI |
| `references/workflow.md` | Multi-step workflow patterns | When building guided experiences |
| `rules/*.md` | 13 production rules (a11y, performance, Snowflake-specific) | During code review |

## Component Library (v2.1)

Composable React components for Cortex Agent integration in `templates/`.

### Core Components

| Component | Description |
|-----------|-------------|
| `<CortexConversation>` | Container with auto-scroll and empty state |
| `<CortexMessage>` | User/assistant message with avatar |
| `<CortexPromptInput>` | Input with submit and streaming state |
| `<CortexReasoning>` | Thinking/tool-use indicator |
| `<CortexSources>` | Source citations from Search results |
| `<CortexTool>` | Tool execution status display |

### Hooks

| Hook | Description |
|------|-------------|
| `useCortexAgent` | SSE streaming, message state, tool tracking |
| `useAutoScroll` | Smart scroll-to-bottom for chat |

### Types

| Type | Description |
|------|-------------|
| `CortexMessage` | Message with role, content, toolCalls |
| `CortexEvent` | SSE event types (text_delta, tool_start, tool_end, error, done) |

### Backend Template

| File | Description |
|------|-------------|
| `cortex_agent_service.py` | FastAPI proxy for Cortex Agent with SSE streaming |

## SSE Streaming Architecture

```
React (useCortexAgent)
  → fetch('/api/agent/run', { stream: true })
    → FastAPI (cortex_agent_service.py)
      → Snowflake Cortex Agent REST API
        → SSE events stream back through all layers
```

**Critical headers for SSE:**

```python
headers = {
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no"  # Required for nginx/SPCS proxy
}
```

**Race condition prevention** — use a ref to prevent duplicate sends from global state:

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

## Production Rules (13 rules in `rules/`)

| Rule | File | Category |
|------|------|----------|
| ARIA labels on all interactive elements | `a11y-aria-labels.md` | Accessibility |
| Compound component architecture | `arch-compound-components.md` | Architecture |
| Context panel pattern | `arch-context-panel.md` | Architecture |
| Multi-agent orchestration | `arch-multi-agent.md` | Architecture |
| Direct imports (no barrel re-exports in bundles) | `bundle-direct-imports.md` | Performance |
| Parallel data fetching | `fetch-parallel.md` | Performance |
| Memoize expensive renders | `render-memo-expensive.md` | Performance |
| ReactFlow: no CSS transforms | `render-reactflow-no-transform.md` | Performance |
| Analyst fallback patterns | `sf-analyst-fallback.md` | Snowflake |
| Connection pool management | `sf-connection-pool.md` | Snowflake |
| Cortex LLM prompt patterns | `sf-cortex-llm-prompts.md` | Snowflake |
| Agent status indicators | `ux-agent-status.md` | UX |
| Entity color consistency | `ux-entity-colors.md` | UX |

## ISF Project Structure

```
src/ui/                          # React frontend
├── src/
│   ├── components/              # Copy from templates/components/
│   ├── hooks/                   # Copy from templates/hooks/
│   ├── services/                # API integration logic
│   └── types/                   # Copy from templates/types/
├── package.json
├── vite.config.ts
└── tailwind.config.js

api/                             # FastAPI backend
├── app/
│   ├── main.py                  # FastAPI app, CORS, routers
│   ├── routers/                 # Endpoint modules
│   └── services/                # Copy cortex_agent_service.py here
├── requirements.txt
└── Dockerfile
```

## Workflow

```
1. LOAD UI STRATEGY
   └── Read plan.md UI Strategy section (page template, charts, theme)
   └── Read isf-context.md personas for journey mapping

2. SCAFFOLD
   └── Init Vite+React+TS: npm create vite@latest src/ui -- --template react-ts
   └── Install Tailwind, configure with style guide tokens
   └── Copy component templates from templates/
   └── Create FastAPI main.py with CORS and routers

   ⚠️ STOP: Present scaffold plan (pages, components, Cortex integration points) for review before implementing.

3. IMPLEMENT PAGES
   └── Apply page template from plan.md (ExecutiveDashboard, ChatAnalytics, DataExplorer)
   └── Wire Cortex Agent via useCortexAgent hook
   └── Connect charts to API endpoints
   └── Apply isf-solution-style-guide tokens

4. IMPLEMENT BACKEND
   └── Copy cortex_agent_service.py, configure for project
   └── Create data endpoints proxying DATA_MART queries
   └── Add /health endpoint for SPCS readiness probe

5. VALIDATE
   └── npm run build passes
   └── All rules from rules/ checked
   └── Responsive at 375px, 768px, 1024px
   └── No CSP violations in browser console
```

## Best Practices

| Practice | Recommendation |
|----------|----------------|
| State management | Zustand for global state (chat, pending prompts) |
| Data fetching | SWR for server state, fetch for SSE streams |
| Styling | Tailwind + isf-solution-style-guide tokens |
| Markdown | react-markdown with prose-invert for dark theme |
| Error boundaries | Wrap each page section independently |
| Loading states | Skeleton loaders matching final layout |

## Companion Skills

| Skill | Relationship |
|-------|-------------|
| `isf-cortex-agent` | Provides the agent this app talks to |
| `isf-solution-style-guide` | Provides design tokens (colors, accessibility rules) |
| `isf-solution-planning` | Provides UI strategy, page template, chart assignments |
| `isf-deployment` | Deploys the app to SPCS |
| `isf-solution-testing` | Validates the deployed app |

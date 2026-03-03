---
name: isf-solution-react-app
description: >
  Build React+FastAPI copilot apps for Snowflake solutions. Includes component
  library, Cortex Agent integration, SSE streaming, production rules, and
  accessibility patterns. Use when: creating React dashboards, building copilot
  UIs, implementing Cortex chat interfaces, or auditing UI accessibility.
parent_skill: isf-solution-engine
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

## Quality Bar

The output should match what you'd expect from a senior product designer at a top SaaS company:

- Clean visual rhythm with intentional asymmetry -- not a uniform card grid
- Obvious interactive affordances (hover, focus, active states on all clickable elements)
- Graceful edge cases (empty states with CTA, skeleton loading, error boundaries)
- Responsive without breakpoint artifacts (test at 375, 768, 1440 px)
- Every component follows the best practices in `references/component-best-practices.md`
- Zero anti-patterns from `references/ui-anti-patterns.md`
- **Data density**: Every dashboard page has at minimum 4 KPI cards, a data table, and at least 2 chart/visualization types (see `rules/ux-data-density.md`)
- **Page template compliance**: Layout matches the assigned template from `references/page-templates.md` with all REQUIRED zones populated
- **ML visualization**: If ML models exist in the pipeline, SHAP/feature importance and prediction data are surfaced in the detail section (see `references/ml-visualization-patterns.md`)

## References

| File | Purpose | When Loaded |
|------|---------|-------------|
| `references/page-templates.md` | **Mandatory page templates** (CommandCenter, AnalyticsExplorer, AssistantLayout) with required zones | **Always -- first reference loaded** |
| `references/ml-visualization-patterns.md` | ML schema to frontend bridge: API patterns, SHAP/factor/prediction components | When ML models exist in the pipeline |
| `references/copilot-learnings.md` | Architecture patterns from successful copilot implementations | Always |
| `references/cortex-chat.md` | Cortex Agent chat integration patterns | When building copilot UI |
| `references/workflow.md` | Multi-step workflow patterns | When building guided experiences |
| `references/websocket-pattern.md` | FastAPI WebSocket + React hook for real-time push | When building live dashboards or monitoring UIs |
| `references/reactflow-dag.md` | React Flow DAG visualization with custom nodes | When building workflow/pipeline/lineage visualizations |
| `rules/*.md` | 18 production rules (a11y, performance, Snowflake-specific, data density) | During code review |
| `references/dashboard-layout.md` | Two-panel layout, resizable sidebar, click-to-ask | When building dashboard UIs |
| `references/component-gallery.md` | UI patterns from component.gallery mapped to ISF | For UI pattern inspiration |
| `references/visual-polish.md` | Mandatory visual polish patterns (10 items) | During implementation and review |
| `references/performance-patterns.md` | Backend + frontend performance guide (9 patterns) | During backend implementation |
| `references/component-best-practices.md` | Best practices for 60 UI components (from component.gallery) | When building any UI component |
| `references/ui-anti-patterns.md` | 21 anti-patterns to avoid (generic + ISF-specific) | During implementation and code review |

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
| `<ThemedCard>` | Card/Badge/Button/StatusDot/DataState primitives |
| `<AIThinking>` | Multi-stage AI processing animation |
| `<AgentWorkflowViewer>` | ReactFlow agent metadata viewer (4 views) |
| `<AgentSidebarPanel>` | Resizable sidebar with Chat + Workflow tabs |
| `<DataLineageModal>` | Data lineage + business impact modal |
| `<InterventionPanel>` | AI-recommended action cards |

### Dashboard Components

| Component | Description |
|-----------|-------------|
| `<KPIStrip>` | Row of 4-8 stat cards with click-to-ask, trend indicators, and crisis glow |
| `<StatCard>` | Individual KPI card (used by KPIStrip) with click-to-ask wiring |
| `<EntityDataTable>` | Sortable data table with sticky header, status badges, row selection, click-to-ask |
| `<RiskFactorPanel>` | Factor decomposition with labeled progress bars, severity coloring |
| `<FeatureImportanceChart>` | Horizontal SHAP bar chart with score badge and base rate line |
| `<DetailSection>` | Slide-up container on entity select with animate-slide-up and DataState loading |

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
| `main.py` | FastAPI app skeleton: lifespan, CORS, health, warmup, router wiring |
| `cortex_agent_service.py` | FastAPI proxy for Cortex Agent with SSE streaming |
| `snowflake_conn.py` | Thread-safe Snowflake connection pool (8 connections, SPCS auto-detect) |
| `backend_patterns.py` | TTL cache, row serializer, bundle endpoint patterns, agent metadata |

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

## Production Rules (18 rules in `rules/`)

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
| **Minimum data density per page** | `ux-data-density.md` | **UX** |
| Server-side TTL cache | `sf-ttl-cache.md` | Performance |
| Persistent httpx client | `sf-httpx-reuse.md` | Performance |
| No Cortex Agent bypass | `sf-no-sql-agent.md` | Snowflake |
| Backend verification checklist | `sf-backend-checklist.md` | Snowflake |

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
│   ├── main.py                  # Copy from templates/main.py
│   ├── snowflake_conn.py        # Copy from templates/snowflake_conn.py
│   ├── backend_patterns.py      # Copy from templates/backend_patterns.py
│   ├── cortex_agent_service.py  # Copy from templates/cortex_agent_service.py
│   ├── routers/                 # Domain endpoint modules
│   └── services/                # Domain-specific logic
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
   └── Configure vite.config.ts with API proxy (see below)
   └── Copy component templates from templates/
   └── Copy tokens.css + design-system.css from isf-solution-style-guide
   └── Set data-theme="dark" on <html> (or "light" per style guide)
   └── Copy all template components from templates/components/
   └── Copy snowflake_conn.py, backend_patterns.py, and cortex_agent_service.py from templates/
   └── Copy templates/main.py → api/app/main.py

   **Port convention**: uvicorn runs on **8000** (both local dev and inside SPCS).
   nginx listens on 8080 in SPCS only. Vite proxy always targets 8000.

   **Required `src/ui/vite.config.ts`:**

   ```typescript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     server: {
       port: 3000,
       proxy: {
         '/api': {
           target: 'http://localhost:8000',
           changeOrigin: true,
         },
       },
     },
   })
   ```

   ⚠️ STOP: Present scaffold plan (pages, components, Cortex integration points) for review before implementing.

3. IMPLEMENT PAGES
   └── **SELECT page template** from `references/page-templates.md` based on archetype in plan.md
       CommandCenter (AI Copilot, Operational Dashboard, Predictive Analytics)
       AnalyticsExplorer (Self-Service Analytics, Data Quality Monitor)
       AssistantLayout (Knowledge Assistant)
   └── **VERIFY all REQUIRED zones** have a component mapped before writing code
   └── Build KPI strip using `KPIStrip` component (min 4 cards for CommandCenter)
   └── Build entity data table using `EntityDataTable` component
   └── Build detail section using `DetailSection` + `RiskFactorPanel` + `FeatureImportanceChart`
   └── Wire Cortex Agent via useCortexAgent hook + AgentSidebarPanel
   └── Connect charts to API endpoints (use ml-visualization-patterns.md for ML data)
   └── Apply isf-solution-style-guide tokens
   └── **CHECK** `rules/ux-data-density.md` — count KPIs, tables, charts against minimums

4. IMPLEMENT BACKEND
   └── **MUST** copy ALL backend templates (verify each exists in api/app/):
       main.py, snowflake_conn.py, backend_patterns.py, cortex_agent_service.py
   └── Configure env vars: SNOWFLAKE_ACCOUNT_URL, CORTEX_AGENT_DATABASE,
       CORTEX_AGENT_SCHEMA, CORTEX_AGENT_NAME
   └── Create domain data endpoints in routers/ using backend_patterns.py helpers
   └── Run `rules/sf-backend-checklist.md` — all 8 items must pass

   ⚠️ STOP: Present backend architecture (endpoints, cache strategy, pool config) for review before proceeding.

5. VALIDATE
   └── npm run build passes
   └── All rules from rules/ checked
   └── Responsive at 375px, 768px, 1024px
   └── No CSP violations in browser console
```

## Advanced Patterns

### Multi-Panel Command Center Layout

For copilot apps that combine real-time data, AI chat, and contextual information, use a three-panel layout:

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: Agent status indicators, entity selector               │
├──────────────┬───────────────────────┬──────────────────────────┤
│  LEFT PANEL  │    CENTER PANEL       │    RIGHT PANEL           │
│  (280px)     │    (flex-1)           │    (360px)               │
│              │                       │                          │
│  Metric      │    Chat Component     │    Context Panel         │
│  Gauges      │    (useCortexAgent)   │    (query results,       │
│              │                       │     related docs,        │
│  Alert       │                       │     ML insights)         │
│  Cards       │                       │                          │
│              │                       │                          │
│  Real-time   │                       │    Updated by            │
│  Parameters  │                       │    onContextUpdate()     │
└──────────────┴───────────────────────┴──────────────────────────┘
```

The center chat component exposes an `onContextUpdate` callback that pushes agent-derived context (SQL results, search matches) to the right panel.

### WebSocket Real-Time Pattern

For streaming live data (sensor readings, status updates, alerts):

**Backend (FastAPI):**

```python
from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        self.connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, entity_id: str, ws: WebSocket):
        await ws.accept()
        self.connections.setdefault(entity_id, []).append(ws)

    async def broadcast(self, entity_id: str, data: dict):
        for ws in self.connections.get(entity_id, []):
            await ws.send_json(data)

manager = ConnectionManager()

@app.websocket("/ws/realtime/{entity_id}")
async def ws_endpoint(websocket: WebSocket, entity_id: str):
    await manager.connect(entity_id, websocket)
    try:
        while True:
            data = await fetch_latest_metrics(entity_id)
            await manager.broadcast(entity_id, data)
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        manager.connections[entity_id].remove(websocket)
```

**Frontend hook:**

```typescript
function useWebSocket(url: string) {
  const [data, setData] = useState(null)
  useEffect(() => {
    const ws = new WebSocket(url)
    ws.onmessage = (e) => setData(JSON.parse(e.data))
    ws.onclose = () => setTimeout(() => /* reconnect */, 3000)
    return () => ws.close()
  }, [url])
  return data
}
```

### Domain Visualization Components

Reusable patterns for common copilot UI elements:

**Metric Gauge** — Shows current value with optimal range and trend indicator:

```typescript
interface GaugeProps {
  label: string
  value: number
  unit: string
  min: number
  max: number
  optimalLow?: number
  optimalHigh?: number
  trend?: 'up' | 'down' | 'stable'
}
```

**Alert Card** — Proactive warning with severity and recommendation:

```typescript
interface AlertProps {
  severity: 'info' | 'warning' | 'danger'
  title: string
  message: string
  recommendation?: string
  timestamp: string
}
```

**AI Thinking Indicator** — Multi-stage animation showing agent processing:

```typescript
const stages = ['Classifying intent...', 'Searching knowledge...', 'Analyzing data...', 'Generating response...']
```

### Simulated Streaming

When the backend returns a complete response (not true SSE), simulate word-by-word streaming for better UX:

```typescript
async function simulateStreaming(fullText: string, onUpdate: (text: string) => void) {
  const words = fullText.split(' ')
  let displayed = ''
  for (const word of words) {
    displayed += (displayed ? ' ' : '') + word
    onUpdate(displayed)
    await new Promise(r => setTimeout(r, 15))
  }
}
```

Use this when the `/api/chat` endpoint returns JSON with a complete `response` field rather than streaming SSE events.

## Performance Requirements

Every ISF solution must meet these performance standards. See `references/performance-patterns.md` for full details.

- [ ] Connection pool (`snowflake_conn.py`) used -- never connection-per-request
- [ ] Persistent `httpx.AsyncClient` for Cortex Agent calls
- [ ] TTL cache on all read endpoints (30-300s by data volatility)
- [ ] Detail bundle endpoints for entity drill-downs
- [ ] SSE cumulative text dedup in agent streaming proxy
- [ ] `Promise.all()` for parallel frontend fetches
- [ ] Input debouncing (300ms) on sliders and filters

## Visual Polish Checklist

Every ISF solution must implement these patterns. See `references/visual-polish.md` for implementation details.

- [ ] Shimmer loading (`.data-revalidating`) on every data-dependent card
- [ ] Click-to-ask on every metric (REQUIRED -- `setPendingPrompt()`)
- [ ] AI thinking animation during agent streaming
- [ ] Resizable agent sidebar with drag handle
- [ ] Staggered fade-in on list/grid renders
- [ ] Status dots with pulse on live indicators
- [ ] Data lineage modal accessible from dashboard

## Required Dependencies

| Package | Purpose | Required |
|---------|---------|----------|
| `reactflow` | Workflow/lineage visualization | Yes -- mandated |
| `clsx` | Class name merging | Yes |
| `react-markdown` + `remark-gfm` | Agent response rendering | Yes |
| `lucide-react` | Icon library | Recommended |
| `@nivo/heatmap` | Grid visualizations | If heatmap views needed |

## Best Practices

| Practice | Recommendation |
|----------|----------------|
| State management | Zustand for global state (chat, pending prompts) |
| Data fetching | SWR for server state, fetch for SSE streams |
| Styling | Tailwind + isf-solution-style-guide tokens |
| Markdown | react-markdown with prose-invert for dark theme |
| Error boundaries | Wrap each page section independently |
| Loading states | Skeleton loaders matching final layout |
| Real-time data | WebSocket for live metrics, SWR polling for slower updates |
| Chat animation | Simulated streaming (15ms/word) when not using true SSE |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `ECONNREFUSED 127.0.0.1:8080` in dev | Vite proxy is targeting the nginx/SPCS port. Set proxy target to `http://localhost:8000` (uvicorn), not 8080 |
| Agent responds but chat shows fallback message | SSE `event:` lines not parsed. Ensure `cortex_agent_service.py` parses both `event:` and `data:` lines |
| `Unknown user-defined function SNOWFLAKE.CORTEX.AGENT` | No SQL function exists for agents. Use the REST API via `cortex_agent_service.py` template |
| `SSL: CERTIFICATE_VERIFY_FAILED` | Account name has underscores. The template's `_normalize_account_url()` handles this; ensure it's being used |
| `npm run build` fails with missing imports | Verify all template components were copied; check `clsx` and `reactflow` are installed |
| Backend fails to connect to Snowflake | Check `snowflake_conn.py` config; verify SPCS token path or local connection name |
| SSE streaming shows duplicated text | Verify `cortex_agent_service.py` has the SSE dedup logic (accumulated_text tracking) |
| Agent sidebar not resizing | Check that the drag handle has `pointer-events: auto` and parent has `position: relative` |
| Shimmer loading not appearing | Ensure `.data-revalidating` class is in `design-system.css` and CSS is imported |
| Click-to-ask not working | Verify `pendingPrompt` state flows from the click handler to `AgentSidebarPanel` |

## Next Skill

After the application is built:

**Continue to** `../isf-deployment/SKILL.md` to deploy the full solution (migrations, seed data, app) to SPCS.

If the plan includes ML notebooks, **continue to** `../isf-notebook/SKILL.md` first.

If running the full ISF pipeline via `isf-solution-engine`, return to the engine for Phase 6.

## Companion Skills

| Skill | Relationship |
|-------|-------------|
| `isf-cortex-agent` | Provides the agent this app talks to |
| `isf-solution-style-guide` | Provides design tokens (colors, accessibility rules) |
| `isf-solution-planning` | Provides UI strategy, page template, chart assignments |
| `isf-deployment` | Deploys the app to SPCS |
| `isf-solution-testing` | Validates the deployed app |

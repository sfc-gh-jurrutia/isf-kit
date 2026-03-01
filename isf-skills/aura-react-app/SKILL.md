---
name: aura-react-app
description: >
  Build React+FastAPI copilot apps for Aura Marketing Guardian. Includes component
  library, Cortex Agent integration via SSE streaming, persona-based theming,
  SWR data fetching, D3/Recharts/Vega-Lite visualization stack, and production
  rules. Use when: creating dashboard views, building copilot UIs, implementing
  Cortex chat interfaces, adding new persona views, or auditing UI patterns.
  Triggers: react, frontend, component, dashboard, chat, streaming, SSE, persona,
  useChat, SWR, D3, visualization.
---

# Aura React App

Build production-quality React+FastAPI applications for the Aura Marketing Guardian platform. This skill provides architecture patterns, a component library, SSE streaming integration, and production rules extracted from the working codebase.

## Quick Start

### What Does This Skill Do?

Guides creation and modification of the Aura frontend:
- React 18 SPA (Vite + TypeScript + Tailwind) in `frontend/`
- FastAPI backend in `backend/`
- Cortex Agent chat via SSE streaming
- Persona-based view switching (no router)
- Multi-industry semantic switchboard

### Input

- Persona requirements (which of Brand/Ops/CMO/AI views to modify)
- Style tokens from `aura-style-guide`
- Snowflake Agent/Analyst/Search service definitions

## Component Library

### Layout Components

| Component | File | Description |
|-----------|------|-------------|
| `UnifiedTopBar` | `components/UnifiedTopBar.tsx` | Header: persona name, industry label, live status, refresh button, industry dropdown |
| `IndustryToggle` | `components/IndustryToggle.tsx` | "Semantic Switchboard" — multi-industry dropdown mapping terminology across 4 verticals |
| `AdminPanel` | `components/AdminPanel.tsx` | Hidden admin panel (Ctrl+Shift+A) |

### Agent/Chat Components

| Component | File | Description |
|-----------|------|-------------|
| `IntelligenceDrawer` | `components/IntelligenceDrawer.tsx` | Slide-out right panel — parses agent trace into structured steps (Planning, SQL, Search, Reasoning, Results) with color-coded timeline |
| `AgentDrawer` | `components/AgentDrawer.tsx` | Collapsible bottom drawer for CMO persona chat, maximize/minimize, escape-to-close |
| `MarkdownRenderer` | `components/MarkdownRenderer.tsx` | Markdown display for agent responses |
| `SovereignTrace` | `components/SovereignTrace.tsx` | Structured trace for SQL queries and search operations |
| `SourceChip` | `components/SourceChip.tsx` | Clickable citation chips showing Snowflake data sources |
| `RAGSourceTag` | `components/RAGSourceTag.tsx` | RAG document source tags |
| `VegaLiteChart` | `components/VegaLiteChart.tsx` | Renders Vega-Lite specs from Cortex Agent responses via `vega-embed` |

### Governance Components

| Component | File | Description |
|-----------|------|-------------|
| `ComplianceShield` | `components/ComplianceShield.tsx` | Governance badge (compliant/conflict/warning/info) with expandable policy citations |
| `GovernanceLedger` | `components/GovernanceLedger.tsx` | Audit trail timeline |

### Dashboard Components

| Component | File | Description |
|-----------|------|-------------|
| `BrandDashboard` | `components/BrandDashboard.tsx` | Pipeline at risk chart |
| `CrisisAlertFeed` | `components/CrisisAlertFeed.tsx` | Crisis monitoring cards |
| `MarketingEfficiencyChart` | `components/MarketingEfficiencyChart.tsx` | Marketing efficiency metrics |
| `ModelPlayground` | `components/ModelPlayground.tsx` | LLM model comparison (AI persona) |
| `MLModelRegistry` | `components/MLModelRegistry.tsx` | ML model registry viewer |

### Shared/Reusable Components

| Component | File | Description |
|-----------|------|-------------|
| `ThemedCard` | `components/ThemedCard.tsx` | Card (surface/elevated/accent/overlay), Badge (default/success/warning/danger/info), Button (primary/secondary/ghost), SectionHeader |
| `SkeletonLoader` | `components/SkeletonLoader.tsx` | Loading skeleton placeholders |
| `Toast` | `components/Toast.tsx` | Toast notifications |
| `SnowflakeCapabilityModal` | `components/SnowflakeCapabilityModal.tsx` | Snowflake lineage diagram for dashboard widgets |

### D3 Visualization Components

All in `components/d3/` with barrel export via `d3/index.ts`:

| Component | Description |
|-----------|-------------|
| `PathAnalysis` | Customer journey path analysis |
| `AttributionChart` | Channel attribution visualization |
| `SegmentationScatter` | Customer segment scatter plot |
| `AssociationNetwork` | Association network graph |
| `PatternTree` | Pattern tree visualization |
| `PredictionDashboard` | Predictive model dashboard |
| `MMMModelComparison` | Marketing Mix Model comparison |
| `MMMFrameworkComparison` | MMM framework comparison |

## Hooks

| Hook | File | Description |
|------|------|-------------|
| `useChat` | `hooks/useChat.ts` | SSE streaming + chat state (1438 lines). ReadableStream via `getReader()`. Handles: `response.thinking.delta`, `response.text.delta`, `response.table`, `response.chart`, `response.tool_use`, `response.tool_result`, `response.done`, `error`. Persists chat history to localStorage per persona/industry. |
| `useSnowflakeData` | `hooks/useSnowflakeData.ts` | SWR-based data fetching. Aggressive dedup (10s), `keepPreviousData: true` to prevent UI blipping. Endpoints: crisis-alerts, social-feed, audit-log, predictive-churn, sequent-paths. |
| `useSnowflakeSync` | `hooks/useSnowflakeSync.ts` | Polls `/api/analytics/metadata` for dynamic table freshness. |
| `useD3` / `useResponsiveD3` | `hooks/useD3.ts` | D3 React integration with ResizeObserver. Generic: `useD3<T extends SVGSVGElement \| HTMLDivElement>`. |

## State Management

No Redux or Zustand. Three layers:

| Layer | Mechanism | Location |
|-------|-----------|----------|
| Persona + Industry | `PersonaContext` | `context/PersonaContext.tsx` |
| Data Refresh | `RefreshContext` | `context/RefreshContext.tsx` |
| Chat/Streaming | `useChat` hook (local state + refs) | `hooks/useChat.ts` |
| Server Data | SWR | `hooks/useSnowflakeData.ts` |
| UI State | ~30+ `useState` in `App.tsx` | `App.tsx:264-435` |

## SSE Streaming Architecture

```
React (useChat hook)
  -> fetch('/api/chat/stream', { method: 'POST' })
    -> FastAPI backend
      -> Snowflake Cortex Agent REST API
        -> SSE events stream back through all layers
```

**Event types parsed from Snowflake SSE:**
- `response.status` — Connection status
- `response.thinking.delta` — Agent reasoning tokens
- `response.text.delta` — Response text tokens
- `response.table` — Tabular data
- `response.chart` — Vega-Lite chart spec
- `response.tool_use` — Tool invocation
- `response.tool_result` — Tool output
- `response.done` — Stream complete
- `error` — Error event

**Buffer management pattern** (from `useChat.ts`):
```typescript
const reader = response.body?.getReader()
const decoder = new TextDecoder()
let buffer = ''

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  buffer += decoder.decode(value, { stream: true })
  const lines = buffer.split('\n')
  buffer = lines.pop() || ''  // Keep incomplete line in buffer

  for (const line of lines) {
    if (line.startsWith('event: ')) { /* parse event type */ }
    if (line.startsWith('data: ')) { /* parse JSON payload */ }
  }
}
```

**Headers on all requests:**
```typescript
headers: {
  'X-Snowflake-Role': personaRole,    // e.g., 'CMO_ROLE', 'MARKETING_OPS_ROLE'
  'X-Industry-Type': industryCode,     // e.g., 'RETAIL', 'FINSERV'
}
```

## Navigation Pattern (No Router)

The app uses persona-based conditional rendering instead of a router:

```tsx
const [persona, setPersona] = useState<PersonaKey>('Brand');

// In render:
{persona === 'Brand' && <BrandView />}
{persona === 'Ops' && <SentinelView />}
{persona === 'CMO' && <CMOView />}
{persona === 'AI' && <AIView />}
```

Left sidebar with icon buttons switches persona. `PersonaProvider` applies CSS theme variables on change.

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat/stream` | POST | SSE streaming chat with Cortex Agent |
| `/api/chat` | POST | Fallback non-streaming chat |
| `/api/analytics/combined` | GET | Revenue + sentiment data |
| `/api/analytics/sentiment-trend` | GET | Lightweight sentiment |
| `/api/analytics/metadata` | GET | Dynamic table freshness |
| `/api/agent/metadata` | GET | Agent sample questions |
| `/api/execute-tool` | POST | Execute stored procedures |
| `/api/actions/resolve_crisis` | POST | Crisis resolution action |
| `/api/crisis-alerts` | GET | Crisis alert data |
| `/api/social-feed` | GET | Social media feed |
| `/api/audit-log` | GET | Governance audit log |
| `/api/predictive-churn` | GET | Churn prediction data |
| `/api/analytics/sequent-paths` | GET | Sankey journey data |

## Project Structure

```
frontend/
  index.html                  # Entry point, Inter font, favicon, OG meta
  package.json                # React 18, Vite 5, Tailwind 3.3, SWR, D3, Recharts, Vega
  vite.config.ts              # Port 3000, /api proxy to localhost:8000
  tailwind.config.js          # Extended slate scale + chart palette
  postcss.config.js           # tailwindcss + autoprefixer
  public/
    favicon.svg               # Shield with "A" logo (only static asset)
  src/
    main.tsx                  # Mounts <App /> to #root
    App.tsx                   # Monolithic root (~1884 lines, persona-conditional views)
    index.css                 # "Sovereign Light" design system (775 lines)
    config/
      snowflakeCapabilities.ts  # Snowflake object lineage definitions
    context/
      PersonaContext.tsx       # Theme provider, CSS variable injection to :root
      RefreshContext.tsx        # Manual data refresh coordination
    hooks/
      useChat.ts               # SSE streaming + chat state (1438 lines)
      useD3.ts                 # D3 React integration with ResizeObserver
      useSnowflakeData.ts      # SWR data fetching hooks
      useSnowflakeSync.ts      # Polling for data freshness
    utils/
      api.ts                   # API base URL config
    components/
      d3/                      # D3 visualizations (barrel-exported via index.ts)
      [30+ flat component files]

backend/
  main.py                     # FastAPI app
  routes/
    agent.py                  # Cortex Agent proxy + SSE streaming
    analytics.py              # Dashboard data endpoints
    crisis.py                 # Crisis management
    data.py                   # Generic data endpoints
  services/
    snowflake_pool.py         # Snowflake connection management
  requirements.txt
```

## Production Rules

### Data Fetching
- **SWR dedup**: Configure `dedupingInterval: 10000` and `keepPreviousData: true` to prevent UI blipping on refetch
- **Click-to-query**: Dashboard components accept `onSegmentClick`/`onChannelClick` callbacks that populate the chat input
- **Refresh coordination**: Use `RefreshContext` to increment a counter; SWR keys include the counter to trigger refetch
- **Chat persistence**: Store chat history in localStorage keyed by `${persona}-${industry}`

### Component Architecture
- **Persona-conditional rendering**: Switch views based on persona state, not routes
- **Flat component structure**: All components in `src/components/`, D3 in `d3/` subfolder
- **ThemedCard abstraction**: Use `ThemedCard` with `variant` prop, not raw div+class combinations
- **Resizable panels**: Agent panel supports drag-to-resize (min 320px, max 700px)

### Styling
- **CSS variables over hardcoded colors**: Always use `var(--accent)`, `var(--text-primary)`, etc.
- **Three consumption patterns**: Tailwind+vars, utility classes from `index.css`, `themeClasses` export
- **No glow effects**: `--accent-glow` is `transparent` across all personas
- **Follow aura-style-guide**: Load companion skill for full design token reference

### Snowflake Integration
- **Role headers**: Every API request includes `X-Snowflake-Role` and `X-Industry-Type`
- **Persona-to-role mapping**: Brand -> `BRAND_STRATEGY_ROLE`, Ops -> `MARKETING_OPS_ROLE`, CMO -> `CMO_ROLE`, AI -> `AI_LAB_ROLE`
- **Vite dev proxy**: `/api` routes proxy to `http://localhost:8000`

### Visualization
- **D3 custom hooks**: Use `useD3` / `useResponsiveD3` with ResizeObserver for responsive charts
- **Recharts for declarative**: Line/Bar charts use Recharts
- **Vega-Lite for agent-generated**: Agent can return chart specs rendered by `VegaLiteChart`
- **Chart palette**: Use `--chart-primary` through `--chart-danger` CSS variables

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` / `react-dom` | 18.2 | UI framework |
| `d3` + `d3-sankey` | 7.9 / 0.12 | Custom data visualizations |
| `recharts` | 2.9 | Declarative charting |
| `vega` / `vega-lite` / `react-vega` | 6.2 / 6.4 / 8.0 | Agent-generated chart rendering |
| `swr` | 2.3.8 | Stale-while-revalidate data fetching |
| `lucide-react` | 0.284 | Icon library |
| `framer-motion` | 10.16 | Animation (available, CSS keyframes preferred) |
| `clsx` / `tailwind-merge` | 2.0 / 1.14 | CSS class utilities |

## Workflow

```
1. UNDERSTAND CONTEXT
   - Read App.tsx to understand current persona views
   - Read useChat.ts for streaming patterns
   - Read PersonaContext.tsx for theming
   - Load aura-style-guide for design tokens

2. PLAN CHANGES
   - Identify which persona view(s) to modify
   - Identify new components needed
   - Identify API endpoints required

   STOP: Present plan for review before implementing.

3. IMPLEMENT
   - Place new components in src/components/ (flat structure)
   - D3 visualizations go in src/components/d3/ and update d3/index.ts barrel
   - Use ThemedCard/ThemedBadge/ThemedButton for consistent styling
   - Wire to API via SWR hooks in useSnowflakeData.ts
   - Add persona-conditional rendering in App.tsx

4. VALIDATE
   - TypeScript compiles (tsc && vite build)
   - Components use CSS variables, not hardcoded colors
   - SSE streaming handles all event types
   - Responsive at common breakpoints
```

## Companion Skills

| Skill | Relationship |
|-------|-------------|
| `aura-style-guide` | Provides design tokens, color palette, component styling rules |

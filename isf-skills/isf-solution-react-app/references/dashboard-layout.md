# Two-Panel Dashboard Layout Architecture

Reference for CoCo: standard ISF dashboard layout with resizable agent sidebar.

---

## 1. Full Layout Diagram

```
+---------------------------------------------------+------------------+
| Header: App title, entity selector, time slider   | AGENT SIDEBAR    |
+---------------------------------------------------| (resizable)      |
| KPI Strip: 4-6 stat cards (click-to-ask)          |                  |
+---------------------------------------------------| [Chat] [Workflow]|
| Main Content Area:                                 |                  |
| - Data table (entity selection)                    | Chat messages    |
| - OR Heatmap/chart view                            | or               |
| - View mode tabs                                   | Agent workflow   |
+---------------------------------------------------| viewer           |
| Detail Section (slide-up on entity select):        |                  |
| - Trajectory/timeline                              |                  |
| - Secondary charts                                 | Prompt input     |
| - Action cards                                     |                  |
+---------------------------------------------------+------------------+
```

### Zone breakdown

| Zone | Purpose | Key components |
|---|---|---|
| **Header** | Navigation, entity selection, time range | Entity `<Combobox>`, `<TimeSlider>` with 300ms debounce |
| **KPI Strip** | At-a-glance metrics, click-to-ask entry points | 4-6 `stat-card` elements, each with `onClick` |
| **Main Content** | Primary data view with mode switching | Tabs: table / heatmap / chart. Uses `table-row-interactive` class |
| **Detail Section** | Entity deep-dive (appears on select) | `animate-slide-up` entry, shimmer loading via `data-revalidating` |
| **Agent Sidebar** | Chat + workflow viewer | `AgentSidebarPanel` template component |

### Flexbox skeleton

```tsx
<div style={{ display: 'flex', height: '100vh' }}>
  {/* Left: Dashboard */}
  <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
    <Header />
    <KPIStrip />
    <MainContent />
    {selectedEntity && <DetailSection />}
  </div>

  {/* Right: Agent sidebar */}
  <AgentSidebarPanel
    pendingPrompt={pendingPrompt}
    onClearPendingPrompt={() => setPendingPrompt(null)}
  />
</div>
```

---

## 2. Resizable Sidebar Implementation

The `AgentSidebarPanel` template (`templates/components/AgentSidebarPanel.tsx`) includes built-in resize logic.

### Defaults

| Property | Value |
|---|---|
| `defaultWidth` | 420px |
| `minWidth` | 350px |
| `maxWidth` | 600px |
| Handle width | 4px |

### How it works

1. **Drag handle** — a thin `<div>` with `role="separator"` and grip-dot SVG, positioned at the left edge of the sidebar.
2. **Pointer events** — `onPointerDown` captures `startX` and `startWidth`, then listens for `pointermove` on `document` to compute `delta = startX - ev.clientX`. Width is clamped to `[minWidth, maxWidth]`.
3. **Smooth transition** — `transition: width 0.15s ease` is applied when NOT dragging. During drag, transition is set to `none` for immediate feedback.
4. **Cleanup** — `pointerup` removes both listeners and sets `isDragging.current = false`.

### Keyboard support

The handle is focusable (`tabIndex={0}`) with ARIA attributes: `aria-orientation="vertical"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.

---

## 3. Click-to-Ask Pattern (REQUIRED)

Every interactive data element in the dashboard must have an `onClick` that builds a contextual question and sends it to the agent sidebar.

### Mechanism

```
User clicks element → build question string → setPendingPrompt(question)
                                                      ↓
AgentSidebarPanel receives pendingPrompt prop → auto-sends via useCortexAgent
                                                      ↓
                                              onClearPendingPrompt() resets state
```

### Question templates by element type

| Element | Question format | Example |
|---|---|---|
| **KPI / StatBox** | `"Why is {metric} at {value}? Is this normal?"` | `"Why is On-Time Rate at 67%? Is this normal?"` |
| **Table row** | `"Tell me about {entity name}"` | `"Tell me about Flight UA-2847"` |
| **Chart element** | `"Explain the trend in {metric} over {time range}"` | `"Explain the trend in delays over the last 7 days"` |
| **Heatmap cell** | `"What's causing {metric} to be {severity} at {coordinates}?"` | `"What's causing delays to be critical at ORD on Tuesday?"` |
| **Badge / status** | `"Why is {entity} flagged as {status}?"` | `"Why is LAX flagged as at-risk?"` |

### Implementation example

```tsx
function StatBox({ label, value, onClick }: StatBoxProps) {
  return (
    <div
      className="stat-card cursor-pointer"
      onClick={() => onClick?.(`Why is ${label} at ${value}? Is this normal?`)}
      role="button"
      tabIndex={0}
    >
      <div className="text-muted">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

// In dashboard:
<StatBox
  label="On-Time Rate"
  value="67%"
  onClick={(question) => setPendingPrompt(question)}
/>
```

### State management (Zustand)

```tsx
interface DashboardStore {
  selectedEntity: string | null;
  pendingPrompt: string | null;
  viewMode: 'table' | 'heatmap' | 'chart';
  timeFilter: { start: string; end: string };

  setSelectedEntity: (id: string | null) => void;
  setPendingPrompt: (prompt: string | null) => void;
  setViewMode: (mode: DashboardStore['viewMode']) => void;
  setTimeFilter: (filter: DashboardStore['timeFilter']) => void;
}
```

The `pendingPrompt` field is the bridge between dashboard clicks and the agent sidebar. `AgentSidebarPanel` auto-sends it and calls `onClearPendingPrompt` to reset.

---

## 4. Detail Prefetching

When a user selects an entity (table row click, chart element click), the detail section must appear instantly.

### Pattern

```tsx
const handleEntitySelect = useCallback(async (entityId: string) => {
  setSelectedEntity(entityId);

  // Fire detail bundle fetch immediately
  const cached = detailCache.get(entityId);
  if (!cached) {
    const bundle = await fetch(`/api/${entityType}/${entityId}/detail-bundle`)
      .then(r => r.json());
    detailCache.set(entityId, bundle);
  }
}, [entityType]);
```

### Detail section loading state

```tsx
<div className={selectedEntity ? 'animate-slide-up' : 'hidden'}>
  <DataState isLoading={!detailData}>
    <TrajectoryChart data={detailData?.trajectory} />
    <SecondaryCharts data={detailData?.metrics} />
    <ActionCards data={detailData?.actions} />
  </DataState>
</div>
```

The `DataState` wrapper from `templates/components/ThemedCard.tsx` applies:
- `data-revalidating` class (shimmer overlay) while loading
- `stagger-children` class (cascading fade-in) when data arrives

### Backend endpoint

The detail bundle endpoint runs multiple queries on a single pooled connection (see `backend_patterns.py` template):

```
GET /api/{entity_type}/{entity_id}/detail-bundle
→ Returns: { header, metrics, trajectory, actions }
→ Cached server-side with TTL_DETAIL (60s)
```

---

## 5. State Management

Use Zustand for lightweight, type-safe state shared across the dashboard and sidebar.

```tsx
import { create } from 'zustand';

export const useDashboardStore = create<DashboardStore>((set) => ({
  selectedEntity: null,
  pendingPrompt: null,
  viewMode: 'table',
  timeFilter: { start: '', end: '' },

  setSelectedEntity: (id) => set({ selectedEntity: id }),
  setPendingPrompt: (prompt) => set({ pendingPrompt: prompt }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setTimeFilter: (filter) => set({ timeFilter: filter }),
}));
```

### Wiring to AgentSidebarPanel

```tsx
function App() {
  const { pendingPrompt, setPendingPrompt } = useDashboardStore();

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Dashboard />
      <AgentSidebarPanel
        pendingPrompt={pendingPrompt}
        onClearPendingPrompt={() => setPendingPrompt(null)}
      />
    </div>
  );
}
```

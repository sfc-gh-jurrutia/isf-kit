# Visual Polish Patterns — Mandatory Checklist

Every ISF solution MUST implement ALL of these patterns. CoCo should apply each one during generation and verify during review.

---

## 1. Crisis Glow

**Class:** `animate-crisis-glow`
**When:** Any metric exceeding a critical threshold — danger-level KPIs, at-risk entities, breached SLAs.

```tsx
<div className={clsx('stat-card', isCritical && 'animate-crisis-glow')}>
  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{label}</div>
  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--status-danger)' }}>{value}</div>
</div>
```

**CSS (from `design-system.css`):**

```css
@keyframes crisis-glow {
  0%, 100% { filter: drop-shadow(0 0 4px rgba(244, 63, 94, 0.3)); }
  50% { filter: drop-shadow(0 0 12px rgba(244, 63, 94, 0.6)); }
}

.animate-crisis-glow {
  animation: crisis-glow 2s ease-in-out infinite;
}
```

---

## 2. Staggered Fade-In

**Class:** `stagger-children`
**When:** Any list or grid rendering — KPI strips, table rows, card grids. Applied automatically by `DataState` when `isLoading` transitions to `false`.

```tsx
<div className="stagger-children">
  <StatCard />   {/* delay: 0ms */}
  <StatCard />   {/* delay: 50ms */}
  <StatCard />   {/* delay: 100ms */}
  <StatCard />   {/* delay: 150ms */}
</div>
```

**CSS (from `design-system.css`):**

```css
.stagger-children > * {
  opacity: 0;
  animation: data-fade-in 0.3s ease-out forwards;
}
.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 50ms; }
/* ... up to :nth-child(10) at 450ms */
```

**Helper:** Use the `DataState` component from `ThemedCard.tsx` to get stagger automatically:

```tsx
<DataState isLoading={loading}>
  {items.map(item => <Card key={item.id} ... />)}
</DataState>
```

---

## 3. Shimmer Loading

**Class:** `data-revalidating`
**When:** Any card or section awaiting data. Applied automatically by `DataState` when `isLoading=true`.

```tsx
<div className={clsx('theme-card', isLoading && 'data-revalidating')}>
  {data ? <MetricContent data={data} /> : <SkeletonPlaceholder />}
</div>
```

**CSS (from `design-system.css`):**

```css
.data-revalidating {
  position: relative;
  overflow: hidden;
}
.data-revalidating::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg, transparent 0%,
    rgba(var(--accent-rgb, 41, 181, 232), 0.06) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  pointer-events: none;
}
```

---

## 4. AI Thinking Progress

**Component:** `AIThinking` from `templates/components/AIThinking.tsx`
**When:** During agent streaming — while `useCortexAgent` status is `'streaming'`.

```tsx
import { AIThinking } from './components/AIThinking';

<AIThinking
  isActive={status === 'streaming'}
  stages={['Classifying intent…', 'Querying data…', 'Analyzing results…', 'Generating response…']}
  currentStage={reasoningStage}
/>
```

The component renders:
- Animated gradient border (`ai-thinking-border` class with `thinking-gradient` animation)
- Progress bar (`ai-thinking-progress-track` + `ai-thinking-progress-fill`)
- Stage list with check/spinner/dot icons per stage state

Renders nothing when `isActive=false`.

---

## 5. Status Dot with Ring Pulse

**Class:** `status-online` (or `status-dot-success` / `status-dot-danger`)
**When:** Live data indicators, connection status, real-time feed markers.

```tsx
<span className={clsx('status-dot', 'status-dot-success', isLive && 'status-online')} />
```

**CSS (from `design-system.css`):**

```css
.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.status-dot-success {
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
}
.status-online {
  animation: status-ring 2s ease-out infinite;
}
@keyframes status-ring {
  0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}
```

Use the `StatusDot` component from `ThemedCard.tsx` for the base dot, then add `status-online` class.

---

## 6. Click-to-Ask (REQUIRED)

**Pattern:** Every numeric metric, table cell, and chart element must have an `onClick` that formats a contextual question and sends it to the agent sidebar.

**When:** ALWAYS. This is the primary interaction bridge between the dashboard and the AI agent.

```tsx
// KPI card
<div
  className="stat-card cursor-pointer"
  onClick={() => setPendingPrompt(`Why is ${label} at ${value}? Is this normal?`)}
  role="button"
  tabIndex={0}
>
  ...
</div>

// Table row
<tr
  className="table-row-interactive"
  onClick={() => setPendingPrompt(`Tell me about ${entity.name}`)}
>
  ...
</tr>

// Chart element (Recharts example)
<Bar
  onClick={(data) => setPendingPrompt(
    `Explain the trend in ${data.metric} over ${timeRange}`
  )}
  cursor="pointer"
/>
```

**Mechanism:** `setPendingPrompt(question)` updates Zustand store → `AgentSidebarPanel` receives `pendingPrompt` prop → auto-sends via `useCortexAgent` → calls `onClearPendingPrompt()` to reset.

See `dashboard-layout.md` section 3 for the full question template table.

---

## 7. Resizable Sidebar

**Component:** `AgentSidebarPanel` from `templates/components/AgentSidebarPanel.tsx`
**When:** ALWAYS. The agent sidebar is a core layout element.

The drag handle includes:
- Visual grip indicator (5 SVG dots)
- `role="separator"` with ARIA value attributes
- Smooth transition (`width 0.15s ease`) when not dragging, instant (`none`) during drag
- Min 350px, max 600px, default 420px

```tsx
<AgentSidebarPanel
  pendingPrompt={pendingPrompt}
  onClearPendingPrompt={() => setPendingPrompt(null)}
  defaultWidth={420}
  minWidth={350}
  maxWidth={600}
/>
```

---

## 8. Slide-Up Entry

**Class:** `animate-slide-up`
**When:** Detail sections appearing on entity select — trajectory panels, secondary charts, action cards.

```tsx
{selectedEntity && (
  <div className="animate-slide-up">
    <SectionHeader title={`Details: ${selectedEntity.name}`} />
    <TrajectoryChart data={detailData?.trajectory} />
    <ActionCards data={detailData?.actions} />
  </div>
)}
```

**CSS (from `design-system.css`):**

```css
@keyframes slide-up {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.animate-slide-up {
  animation: slide-up 0.3s ease-out forwards;
}
```

---

## 9. Metric Glow

**Class:** `metric-glow`
**When:** Critical metric values that need attention — pulsing box-shadow draws the eye without being as aggressive as crisis-glow.

```tsx
<span className={clsx(isCritical && 'metric-glow')} style={{
  display: 'inline-block', padding: '4px 8px', borderRadius: 6,
}}>
  {formattedValue}
</span>
```

**CSS (from `design-system.css`):**

```css
@keyframes metric-pulse {
  0% { box-shadow: 0 0 0 0 rgba(var(--accent-rgb, 41, 181, 232), 0.3); }
  50% { box-shadow: 0 0 0 8px rgba(var(--accent-rgb, 41, 181, 232), 0); }
  100% { box-shadow: 0 0 0 0 rgba(var(--accent-rgb, 41, 181, 232), 0); }
}
.metric-glow {
  animation: metric-pulse 2s ease-in-out infinite;
}
```

Use `metric-glow` for accent-colored attention; use `animate-crisis-glow` for danger-colored urgency.

---

## 10. Data Update Flash

**Class:** `data-updated`
**When:** Values that just changed — after a data refresh, on SSE updates, when a metric transitions between states.

```tsx
<td className={clsx(justChanged && 'data-updated')}>
  {metric.value}
</td>
```

**CSS (from `design-system.css`):**

```css
.data-updated {
  animation: data-pulse 0.6s ease-out;
  transition: background 0.3s ease;
}
@keyframes data-pulse {
  0% { box-shadow: 0 0 0 0 rgba(var(--accent-rgb, 41, 181, 232), 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(var(--accent-rgb, 41, 181, 232), 0); }
  100% { box-shadow: 0 0 0 0 rgba(var(--accent-rgb, 41, 181, 232), 0); }
}
```

**Detecting changes:** Compare previous and current values in `useEffect`. Apply the class for one animation cycle (600ms), then remove it:

```tsx
const [flash, setFlash] = useState(false);
const prevValue = useRef(value);

useEffect(() => {
  if (prevValue.current !== value) {
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 600);
    prevValue.current = value;
    return () => clearTimeout(timer);
  }
}, [value]);
```

---

## Quick Reference Table

| # | Pattern | Class / Component | Trigger |
|---|---|---|---|
| 1 | Crisis glow | `animate-crisis-glow` | Metric exceeds critical threshold |
| 2 | Staggered fade-in | `stagger-children` / `DataState` | List/grid render |
| 3 | Shimmer loading | `data-revalidating` / `DataState` | Awaiting data |
| 4 | AI thinking | `AIThinking` component | Agent streaming |
| 5 | Status dot pulse | `status-online` | Live data indicator |
| 6 | Click-to-ask | `setPendingPrompt()` | ALWAYS on interactive elements |
| 7 | Resizable sidebar | `AgentSidebarPanel` | ALWAYS in layout |
| 8 | Slide-up entry | `animate-slide-up` | Detail section appears |
| 9 | Metric glow | `metric-glow` | Attention-worthy values |
| 10 | Data update flash | `data-updated` | Value just changed |

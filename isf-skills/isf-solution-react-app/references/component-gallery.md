# Component Gallery — ISF Pattern Mapping

UI patterns from [component.gallery](https://component.gallery/) mapped to ISF solution use cases. Each entry includes the pattern name, ISF applications, and implementation hints using ISF design system classes and template components.

---

## Accordion

Expandable/collapsible content sections for progressive disclosure.

**ISF use cases:**
- Risk factor drill-down — expand a risk category to see individual contributing factors
- Agent reasoning steps — collapse/expand each step in `CortexReasoning` output
- Collapsible tool outputs — long SQL results or data tables from `CortexTool`

**Implementation hint:**

```tsx
<details className="theme-card" style={{ borderRadius: 12, padding: 0, overflow: 'hidden' }}>
  <summary style={{
    padding: '16px 20px',
    cursor: 'pointer',
    fontWeight: 600,
    color: 'var(--text-primary)',
    listStyle: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }}>
    Risk Factor: Weather Disruptions
    <span style={{ transition: 'transform 0.2s', transform: 'rotate(0deg)' }}>▸</span>
  </summary>
  <div style={{ padding: '0 20px 16px', color: 'var(--text-secondary)' }}>
    {/* Expanded content */}
  </div>
</details>
```

Use native `<details>/<summary>` for zero-JS accordion. Style with `theme-card` or `trace-step` classes.

---

## Tabs

Mutually exclusive content panels switched via tab bar.

**ISF use cases:**
- View mode switching — table / heatmap / chart in the main content area
- Technical/business toggle in `DataLineageModal` — technical lineage graph vs. business-language summary
- Chat / Workflow sidebar tabs — built into `AgentSidebarPanel` template

**Implementation hint:**

The `AgentSidebarPanel` template has a complete tabs implementation with ARIA roles (`role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`) and keyboard navigation (ArrowLeft/ArrowRight). Follow the same pattern:

```tsx
<div role="tablist" aria-label="View mode" style={{
  display: 'flex',
  borderBottom: '1px solid var(--border-subtle)',
  background: 'var(--bg-elevated)',
}}>
  {modes.map(mode => (
    <button
      key={mode}
      role="tab"
      aria-selected={activeMode === mode}
      onClick={() => setActiveMode(mode)}
      style={{
        flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
        background: activeMode === mode ? 'var(--bg-surface)' : 'transparent',
        color: activeMode === mode ? 'var(--accent, var(--snowflake-blue))' : 'var(--text-muted)',
        fontWeight: activeMode === mode ? 700 : 500,
        borderBottom: activeMode === mode
          ? '2px solid var(--accent, var(--snowflake-blue))'
          : '2px solid transparent',
      }}
    >
      {mode}
    </button>
  ))}
</div>
```

---

## Popover

Small overlay positioned relative to a trigger element.

**ISF use cases:**
- Metric tooltips — hover a KPI card value to see trend sparkline + context
- Quick-info hover cards on badges — hover a `theme-badge` to see full explanation
- Confidence score breakdowns — hover a rating to see per-factor scores

**Implementation hint:**

```tsx
<div style={{ position: 'relative', display: 'inline-block' }}>
  <Badge variant="warning" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
    At Risk
  </Badge>
  {open && (
    <div className="theme-card-elevated" style={{
      position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
      marginBottom: 8, padding: '12px 16px', whiteSpace: 'nowrap', zIndex: 50,
      fontSize: 13, animation: 'fade-in 0.15s ease-out',
    }}>
      3 of 5 risk factors elevated
    </div>
  )}
</div>
```

Use `theme-card-elevated` for popover surface. The elevated variant includes `box-shadow` for depth.

---

## Tree View

Hierarchical data display with expand/collapse at each level.

**ISF use cases:**
- Data lineage hierarchy — database → schema → table → column in `DataLineageModal`
- Downstream impact chains — entity → affected metrics → dependent systems
- Entity relationships — parent/child entity structures

**Implementation hint:**

For complex lineage graphs, prefer ReactFlow with the `reactflow-dag.md` reference. For simple hierarchies:

```tsx
function TreeNode({ node, depth = 0 }: { node: TreeItem; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  return (
    <div>
      <div
        className="table-row-interactive"
        style={{ paddingLeft: depth * 20 + 12, padding: '8px 12px', display: 'flex', gap: 8 }}
        onClick={() => setExpanded(!expanded)}
      >
        {node.children?.length ? (expanded ? '▾' : '▸') : '·'}
        <span style={{ color: 'var(--text-primary)' }}>{node.label}</span>
        {node.badge && <Badge variant={node.badge}>{node.badgeLabel}</Badge>}
      </div>
      {expanded && node.children?.map(child => (
        <TreeNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}
```

Use `table-row-interactive` for hover highlight on each node row.

---

## Carousel

Horizontally scrollable container for cards or items.

**ISF use cases:**
- KPI card horizontal scroll on narrow viewports — when 6 stat cards don't fit
- Image/screenshot galleries in solution package documentation
- Alert card rotation for multi-entity overviews

**Implementation hint:**

```tsx
<div style={{
  display: 'flex', gap: 16, overflowX: 'auto', padding: '4px 0',
  scrollSnapType: 'x mandatory', scrollbarWidth: 'thin',
}}>
  {kpis.map(kpi => (
    <div key={kpi.id} className="stat-card" style={{
      minWidth: 200, flex: '0 0 auto', scrollSnapAlign: 'start',
    }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{kpi.label}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{kpi.value}</div>
    </div>
  ))}
</div>
```

Use CSS `scroll-snap-type: x mandatory` with `scroll-snap-align: start` on each card. The `stat-card` class provides hover lift.

---

## Rating

Visual indicator for scores, quality, or confidence.

**ISF use cases:**
- Confidence scores — display model certainty as star rating or progress bar
- Data quality indicators — freshness/completeness of source data
- Model accuracy display — precision/recall as filled bars

**Implementation hint:**

Prefer a simple bar over stars for data-oriented dashboards:

```tsx
function ConfidenceBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? 'var(--status-success)' : pct >= 50 ? 'var(--status-warning)' : 'var(--status-danger)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 80 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'var(--border-subtle)', borderRadius: 3 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 36 }}>{pct}%</span>
    </div>
  );
}
```

---

## Pagination

Navigate through large datasets page by page.

**ISF use cases:**
- Large data tables — entity lists with hundreds of rows
- Log/audit trail browsing — agent conversation history
- Search result pages — Cortex Search result sets

**Implementation hint:**

```tsx
function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', padding: '12px 0' }}>
      <Button variant="ghost" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        ← Prev
      </Button>
      <span style={{ color: 'var(--text-muted)', fontSize: 13, padding: '0 12px' }}>
        {page} of {totalPages}
      </span>
      <Button variant="ghost" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Next →
      </Button>
    </div>
  );
}
```

Use `theme-button-ghost` variant from the `Button` template component for prev/next controls.

---

## Combobox

Searchable dropdown combining text input with a filterable option list.

**ISF use cases:**
- Entity selector with search — primary navigation element in header
- Multi-select filters — filter by region, category, status
- Agent tool selector — pick which tools to enable for a query

**Implementation hint:**

```tsx
function EntitySelector({ entities, value, onChange }: EntitySelectorProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const filtered = entities.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={search}
        onChange={e => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search entities…"
        style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
          borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)',
          width: '100%', fontSize: 14,
        }}
        role="combobox"
        aria-expanded={open}
      />
      {open && (
        <div className="theme-card-elevated" style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          maxHeight: 240, overflowY: 'auto', zIndex: 50, padding: 4,
        }}>
          {filtered.map(entity => (
            <div
              key={entity.id}
              className="table-row-interactive"
              style={{ padding: '8px 12px', borderRadius: 6 }}
              onClick={() => { onChange(entity.id); setOpen(false); setSearch(entity.name); }}
            >
              {entity.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

Debounce the search input at 300ms for API-backed entity search.

---

## Toast

Transient notification that auto-dismisses.

**ISF use cases:**
- Action confirmation — "Intervention queued for execution"
- Error notifications — "Agent request failed, retrying…"
- Intervention execution feedback — from `InterventionPanel` actions

**Implementation hint:**

```tsx
function Toast({ message, variant = 'info', onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={clsx('theme-card-elevated', 'animate-slide-in-right')}
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 100,
        padding: '12px 20px', maxWidth: 360,
        borderLeft: `3px solid var(--status-${variant})`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <StatusDot status={variant === 'error' ? 'danger' : 'success'} />
        <span style={{ color: 'var(--text-primary)', fontSize: 14 }}>{message}</span>
      </div>
    </div>
  );
}
```

Use `animate-slide-in-right` for entry and `animate-slide-out-right` for exit. Position fixed at bottom-right.

---

## Skeleton

Placeholder shapes shown while content is loading.

**ISF use cases:**
- Loading states for every data-dependent component (REQUIRED)
- Initial dashboard load before API responses return
- Detail section while bundle endpoint is fetching

**Implementation hint:**

Use the `DataState` wrapper from `templates/components/ThemedCard.tsx`:

```tsx
<DataState isLoading={!data}>
  {/* Children get shimmer overlay when loading, stagger fade-in when loaded */}
  <StatCard ... />
  <StatCard ... />
  <DataTable ... />
</DataState>
```

`DataState` applies:
- `data-revalidating` class while `isLoading=true` — adds shimmer pseudo-element overlay
- `stagger-children` class when loaded — each child fades in with 50ms stagger delay

For standalone skeleton shapes:

```tsx
function SkeletonBox({ width, height = 16 }: { width: string | number; height?: number }) {
  return (
    <div className="data-revalidating" style={{
      width, height, borderRadius: 6,
      background: 'var(--border-subtle)',
    }} />
  );
}
```

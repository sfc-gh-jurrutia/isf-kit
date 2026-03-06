# Page Template Specifications

Mandatory layout templates for ISF solutions. Every app MUST use one of these templates based on the archetype selected in `plan.md`. Zones marked **(REQUIRED)** must have a corresponding component -- omitting them is a build failure.

---

## Template Selection

| Archetype | Template | Rationale |
|-----------|----------|-----------|
| AI Copilot | **CommandCenter** | Data-dense dashboard with agent sidebar -- the copilot augments the data, not replaces it |
| Operational Dashboard | **CommandCenter** | Real-time monitoring with KPIs, tables, alerts |
| Predictive Analytics | **CommandCenter** | ML outputs alongside agent explainability |
| Data Quality Monitor | **AnalyticsExplorer** | Filter-heavy, no agent required |
| Self-Service Analytics | **AnalyticsExplorer** | Analyst-driven, filter panel replaces agent |
| Knowledge Assistant | **AssistantLayout** | Chat-primary with mandatory evidence panel |

---

## CommandCenter

The IROP-class layout. Use for any archetype where the primary value is data visibility with AI assistance.

### Layout Diagram

```
+-----------------------------------------------------------+-------------------+
| Header: App title, entity selector, time controls         | AGENT SIDEBAR     |
+-----------------------------------------------------------| (resizable)       |
| KPI Strip: 4-8 stat cards (click-to-ask on every card)   |                   |
+-----------------------------------------------------------| [Chat] [Workflow] |
| View Tabs: Table | Heatmap | Chart                        |                   |
+-----------------------------------------------------------| Chat messages     |
| Main Content Area:                                        | or                |
| - Sortable data table with status badges                  | Agent workflow    |
| - OR heatmap / chart view                                 | viewer            |
+-----------------------------------------------------------|                   |
| Detail Section (slide-up on entity select):               |                   |
| - Entity header with key identifiers                      | Prompt input      |
| - Risk factor / metric decomposition panel                |                   |
| - ML explainability visualization (SHAP bars)             |                   |
| - Domain-specific charts (route, timeline, etc.)          |                   |
+-----------------------------------------------------------+-------------------+
```

### Zone Specifications

#### Header **(REQUIRED)**

| Element | Requirement |
|---------|-------------|
| App title | Left-aligned, includes status dot for live indicator |
| Entity selector | `<Combobox>` with search, positioned prominently |
| Time controls | Segmented control (4hr / 12hr / 1D / 1W) or date range picker |
| Agent status | Agent status indicators from `ux-agent-status` rule |

```tsx
<header style={{
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '12px 24px', borderBottom: '1px solid var(--border-subtle)',
  background: 'var(--bg-surface)',
}}>
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
      {appTitle}
    </h1>
    <StatusDot status={isLive ? 'success' : 'idle'} className="status-online" />
  </div>
  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
    <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
    <EntitySelector entities={entities} value={selected} onChange={setSelected} />
  </div>
</header>
```

#### KPI Strip **(REQUIRED)**

Minimum 4 stat cards, maximum 8. Every card must have `onClick` wired to `setPendingPrompt`.

Use the `KPIStrip` template component. See `templates/components/KPIStrip.tsx`.

| Property | Rule |
|----------|------|
| Card count | 4-8 per row. Use 2 rows of 4 for 5-8 KPIs. |
| Click-to-ask | Every card fires `setPendingPrompt("Why is {label} at {value}?")` |
| Crisis glow | Cards exceeding critical threshold get `animate-crisis-glow` |
| Trend indicator | Show delta or arrow when previous-period data is available |
| Loading | Wrap in `DataState` for shimmer loading |

#### View Mode Tabs **(REQUIRED)**

At least 2 view modes. Common combinations:

| View 1 | View 2 | View 3 (optional) |
|--------|--------|-------------------|
| Table | Heatmap | -- |
| Table | Chart | Timeline |
| Table | Network | Map |

Use `role="tablist"` with `aria-selected` per the `AgentSidebarPanel` tab pattern.

#### Main Content **(REQUIRED)**

The default view MUST be a sortable data table (`EntityDataTable` component). Requirements:

- Sticky header row
- Status badges on categorical columns (use `Badge` from `ThemedCard`)
- Numeric columns right-aligned
- Row click selects entity AND fires click-to-ask
- Hover state via `table-row-interactive`
- Selected row highlighted via `table-row-selected`

#### Detail Section **(REQUIRED)**

Appears below the main content when an entity is selected. Uses `animate-slide-up` entry.

Must contain at minimum:

| Panel | Purpose | Component |
|-------|---------|-----------|
| Entity header | Name, ID, key identifiers, status badge | Custom per domain |
| Metric decomposition | Factor breakdown with progress bars | `RiskFactorPanel` |
| ML explainability | SHAP feature importance | `FeatureImportanceChart` |

Additional panels are domain-specific (route map, timeline, trajectory chart, etc.).

Wrap in `DetailSection` template component for consistent slide-up + loading behavior.

#### Agent Sidebar **(REQUIRED for CommandCenter)**

Use the `AgentSidebarPanel` template component with:

- `pendingPrompt` wired from dashboard click-to-ask
- Chat + Workflow tabs
- Resizable (350-600px, default 420px)
- Pre-warmed with `HEAD` request on mount

### Flexbox Skeleton

```tsx
function CommandCenterLayout() {
  const { selectedEntity, pendingPrompt, setPendingPrompt } = useDashboardStore();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <KPIStrip kpis={kpiData} onAsk={setPendingPrompt} />
        <ViewModeTabs />
        <MainContent />
        {selectedEntity && (
          <DetailSection entityId={selectedEntity} isLoading={!detailData}>
            <EntityHeader data={detailData?.header} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <RiskFactorPanel factors={detailData?.factors} />
              <DomainVisualization data={detailData?.domain} />
              <FeatureImportanceChart features={detailData?.shap} />
            </div>
          </DetailSection>
        )}
      </div>
      <AgentSidebarPanel
        pendingPrompt={pendingPrompt}
        onClearPendingPrompt={() => setPendingPrompt(null)}
      />
    </div>
  );
}
```

### Data Flow

```
Page load:
  Promise.allSettled([
    fetch('/api/kpis'),           → KPIStrip
    fetch('/api/entities'),       → EntityDataTable
    fetch('/api/alerts'),         → Header badge count
  ])

Entity select:
  fetch('/api/{type}/{id}/detail-bundle')
    → { header, factors, shap, domain, actions }
    → DetailSection children

Click-to-ask:
  setPendingPrompt(question)
    → AgentSidebarPanel auto-sends
    → Agent response streams via SSE
```

---

## AnalyticsExplorer

For analyst-driven exploration without an AI agent sidebar. Replaces the agent sidebar with a filter/search panel.

### Layout Diagram

```
+-----------------------------------------------------------+-------------------+
| Header: App title, search bar, export button              | FILTER PANEL      |
+-----------------------------------------------------------| (collapsible)     |
| KPI Strip: 4-8 stat cards                                 |                   |
+-----------------------------------------------------------| Date range        |
| View Tabs: Table | Chart | Summary                        | Category filters  |
+-----------------------------------------------------------| Status filters    |
| Main Content Area:                                        | Threshold sliders |
| - Full-width data table (no agent sidebar)                |                   |
| - Advanced: column visibility, bulk select, export        | [Apply] [Reset]   |
+-----------------------------------------------------------|                   |
| Detail Section (slide-up on entity select):               |                   |
| - Entity metrics                                          |                   |
| - Charts and breakdowns                                   |                   |
+-----------------------------------------------------------+-------------------+
```

### Zone Specifications

Same as CommandCenter with these differences:

| Zone | Change from CommandCenter |
|------|--------------------------|
| Agent Sidebar | **Replaced** by Filter Panel (280-360px, collapsible) |
| Filter Panel | Date range, category multi-select, status checkboxes, threshold sliders |
| Main Content | Full-width when filters collapsed; advanced table features (column toggle, CSV export, bulk actions) |
| KPI Strip | Cards are informational (no click-to-ask since no agent) |
| Detail Section | Same slide-up behavior, but no SHAP panel unless ML models are present |

### Filter Panel

```tsx
<aside style={{
  width: filterOpen ? 320 : 0, overflow: 'hidden',
  borderLeft: '1px solid var(--border-subtle)',
  transition: 'width 0.2s ease',
  display: 'flex', flexDirection: 'column', gap: 16, padding: filterOpen ? 16 : 0,
}}>
  <SectionHeader title="Filters" action={<Button variant="ghost" onClick={resetFilters}>Reset</Button>} />
  <DateRangePicker value={dateRange} onChange={setDateRange} />
  <CheckboxGroup label="Status" options={statuses} selected={selectedStatuses} onChange={setSelectedStatuses} />
  <SliderFilter label="Min Score" min={0} max={100} value={minScore} onChange={setMinScore} />
  <Button variant="primary" onClick={applyFilters}>Apply Filters</Button>
</aside>
```

---

## AssistantLayout

For Knowledge Assistant archetypes. Chat is the primary interaction, BUT the layout MUST include a context/evidence panel. A bare chat window is NOT acceptable (see anti-pattern #21).

### Layout Diagram

```
+-----------------------------------------------------------+---------------------+
| Header: App title, knowledge base selector, session info  |                     |
+-----------------------------------------------------------+                     |
|                                                           |  CONTEXT PANEL      |
|  CHAT AREA (flex-1)                                       |  (360px, scrollable)|
|                                                           |                     |
|  - Conversation messages with markdown rendering          |  Query results      |
|  - Source citations (CortexSources)                       |  Source documents   |
|  - Structured data cards inline in responses              |  Related entities   |
|  - Empty state with suggested questions                   |  Recommendations    |
|                                                           |                     |
|  +-----------------------------------------------------+ |                     |
|  | Prompt input with send button                        | |                     |
|  +-----------------------------------------------------+ |                     |
+-----------------------------------------------------------+---------------------+
```

### Zone Specifications

#### Header **(REQUIRED)**

- App title and knowledge base / topic selector
- Session controls (new chat, history)
- No time controls needed

#### Chat Area **(REQUIRED)**

Use `CortexConversation` + `CortexMessage` + `CortexPromptInput` template components.

Must include:
- Rich markdown rendering (`react-markdown` + `remark-gfm` + `prose-invert`)
- Inline data cards when agent returns structured data
- `CortexSources` for citation display
- Suggested starter questions in empty state (not just "Ask me anything")
- `AIThinking` component during streaming

#### Context Panel **(REQUIRED)**

The critical difference from a bare chat. This panel updates in response to agent messages via `onContextUpdate` callback (see `arch-context-panel` rule).

| Section | Content | When shown |
|---------|---------|------------|
| Query Results | Data table or formatted results from Cortex Analyst | Agent executes a SQL query |
| Source Documents | Document excerpts with relevance scores from Cortex Search | Agent performs RAG search |
| Related Entities | Cards linking to related items | Agent identifies related data |
| Recommendations | Action cards with confidence scores | Agent generates suggestions |

```tsx
function AssistantLayout() {
  const [context, setContext] = useState<ContextData | null>(null);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />
        <CortexConversation
          messages={messages}
          onContextUpdate={setContext}
        />
        <CortexPromptInput onSend={sendMessage} disabled={isStreaming} />
      </div>
      <ContextPanel context={context} style={{ width: 360, borderLeft: '1px solid var(--border-subtle)' }} />
    </div>
  );
}
```

### Minimum Requirements for AssistantLayout

Even though this is chat-primary, it must NOT be just a chat box:

- [ ] Context panel present and updating from agent responses
- [ ] Suggested starter questions in empty state (minimum 3)
- [ ] Rich markdown rendering with proper prose styling
- [ ] Source citations displayed when available
- [ ] Inline structured data (tables, cards) in agent responses
- [ ] Session history or new-chat controls

---

## Template Selection Enforcement

The `isf-solution-react-app` workflow Step 3 (IMPLEMENT PAGES) must:

1. **Read** the page template from `plan.md`
2. **Validate** that template against this reference
3. **Verify** every **(REQUIRED)** zone has a component before proceeding
4. **Present** the zone-to-component mapping for user review

If `plan.md` does not specify a page template, stop and return to planning. Do not silently default to `CommandCenter`.

If the solution has multiple pages (e.g., overview + detail), each page must use one of these templates. Navigation between pages uses sidebar nav or header tabs -- each destination page follows its assigned template.

---

## Multi-Page Solutions

Some solutions require multiple pages (e.g., the Agentic Commerce app with Shopping Assistant, Store Operations, Marketing Analytics).

Each page must be assigned a template:

| Page | Suggested Template |
|------|-------------------|
| Overview / Dashboard | CommandCenter |
| Detail / Entity view | CommandCenter (detail-focused variant) |
| Analytics / Reports | AnalyticsExplorer |
| Chat / Assistant | AssistantLayout |
| Settings / Config | AnalyticsExplorer (simplified) |

The primary landing page (first nav item) should ALWAYS be the most data-rich page, typically CommandCenter. Chat-only pages should never be the default landing.

---

## Persona-Page Mapping (Multi-Persona Solutions)

When the solution serves multiple personas, each persona gets a dedicated page with a tailored template variant and its own `AgentSidebarPanel` connected to that persona's agent.

### Persona → Page Mapping

| Persona Level | Template | Variant | Route | Layout Focus | Agent Sidebar |
|---|---|---|---|---|---|
| **Strategic** (VP/Director) | CommandCenter | aggregate | `/strategic` | Portfolio KPIs, aggregate trends, executive summary cards | Sidebar with strategic agent, sample questions about portfolio metrics |
| **Operational** (Manager) | CommandCenter | full | `/operational` | Entity-level monitoring, alerts, risk factors, action tools | Sidebar with operational agent, entity context injection |
| **Technical** (Analyst) | AnalyticsExplorer + Agent | hybrid | `/technical` | Deep analytics, ML explainability, model outputs, filters | Sidebar with technical agent, model-specific queries |

### Route Structure

```
/                    → Redirect to /operational (default landing)
/strategic           → Strategic persona page
/operational         → Operational persona page
/technical           → Technical persona page
```

### Navigation

Use sidebar navigation with persona icons. Each nav item shows:
- Persona icon (Briefcase, Shield, Microscope)
- Persona label
- Active indicator dot

```tsx
const PERSONA_NAV = [
  { path: '/strategic', label: 'Strategic', icon: Briefcase },
  { path: '/operational', label: 'Operations', icon: Shield },
  { path: '/technical', label: 'Technical', icon: Microscope },
]
```

### CommandCenter Aggregate Variant

The **aggregate** variant differs from the standard CommandCenter:

| Zone | Standard | Aggregate |
|------|----------|-----------|
| KPI Strip | Entity-level metrics | Portfolio-level rollups (totals, averages, trends) |
| Data Table | Individual entities | Grouped/summarized view (by region, category, status) |
| Detail Section | Single entity drill-down | Segment drill-down (click a row to see breakdown) |
| Charts | Entity-specific | Distribution charts, trend lines, comparative bars |

### AnalyticsExplorer + Agent Hybrid

The **hybrid** variant adds an agent sidebar to AnalyticsExplorer:

```
+-----------------------------------------------------------+-------------------+
| Header: App title, search bar, export button              | AGENT SIDEBAR     |
+-----------------------------------------------------------| (resizable)       |
| KPI Strip: 4-8 stat cards                                 |                   |
+-----------------------------------------------------------| [Chat] [Workflow] |
| Filter Panel (collapsible left)  | Main Content Area      |                   |
| - Model selector                 | - Full-width data table| Agent messages    |
| - Feature filters                | - SHAP visualizations  | with ML context   |
| - Threshold sliders              | - Prediction outputs   |                   |
+----------------------------------+------------------------+ Prompt input      |
| Detail Section (slide-up on select):                      |                   |
| - Model performance, calibration curves, feature impact   |                   |
+-----------------------------------------------------------+-------------------+
```

The agent sidebar replaces the right filter panel from standard AnalyticsExplorer. Filter controls move to a collapsible left panel.

### Per-Page Agent Configuration

Each persona page creates its own `AgentSidebarPanel` with persona-specific props:

```tsx
<AgentSidebarPanel
  pendingPrompt={pendingPrompt}
  onClearPendingPrompt={() => setPendingPrompt(null)}
  persona="operational"
  agentEndpoint="/api/agent/run"
  sampleQuestions={[
    "Which entities are at highest risk right now?",
    "Alert my team about the critical items",
    "What's the recommended action for Entity-123?",
  ]}
/>
```

Each page manages its own thread independently -- navigating between persona pages does NOT share conversation history.

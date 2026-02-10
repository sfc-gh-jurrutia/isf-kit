---
name: specify-implement
description: "Execute implementation tasks to build the demo. Use for: building demos, generating code, following task checklist. Triggers: /speckit.implement, build demo, implement tasks"
parent_skill: specify
---

# Implement - Demo Implementation Engine

> Execute implementation tasks to build the demo

## When to Load

After `tasks/SKILL.md` has generated the task checklist.

## Prerequisites

Files must exist in `specs/{demo-name}/`:
- `tasks.md` (required)
- `plan.md` (required)
- `spec.md` (required)
- `domain-model.yaml` (required)
- `semantic-model.yaml` (required)

## Workflow

### Step 1: Select Implementation Mode

**⚠️ MANDATORY STOPPING POINT**: Ask user for mode.

```
Select implementation mode:

1. **Full Auto** - Implement all tasks, pause only for checkpoints
2. **Phase by Phase** - Implement one phase, confirm before continuing
3. **Task by Task** - Implement one task, show results, wait for approval
4. **Resume** - Continue from a specific task (e.g., "resume from B3")

[1/2/3/4] [Cancel]
```

### Step 2: Work Through Tasks

Follow task order from `tasks.md`:

1. **Foundation** → Setup, connections
2. **Database** → Schemas, data, Cortex objects
3. **Backend** → API endpoints
4. **Frontend** → UI components
5. **Integration** → Testing, polish

**At each checkpoint:**
- Verify previous phase works
- Present summary of what was built
- Wait for approval before continuing

### Step 3: Generate Real Code

**Rules:**
- No placeholders, no TODOs
- Working implementations only
- Follow architecture from `plan.md`
- Use patterns from constitution

**Key Patterns:**

**Zone B Connector (REST API for Cortex):**
```python
# Use REST API with httpx, NOT Python SDK
async def analyst_query(self, question: str, semantic_model: str):
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            self._analyst_url,
            headers={"Authorization": f"Bearer {settings.SNOWFLAKE_PAT}"},
            json={
                "messages": [{"role": "user", "content": [{"type": "text", "text": question}]}],
                "semantic_model": semantic_model,
            },
        )
```

**SSE Event Contract:**

| Event | Payload Key | Description |
|-------|-------------|-------------|
| `thinking` | `status` | Processing indicator |
| `explanation` | `text` | AI explanation |
| `sql` | `sql` | Generated SQL |
| `data` | `rows` | Query results |
| `error` | `message` | Error details |
| `done` | `{}` | Stream complete |

**SSE Format:**
```
event: {event_name}
data: {json_payload}

```
Note: Double newline required after data line.

## Frontend Implementation

**Use UI Templates from `templates/ui/`** - See `templates/ui/README.md` for full catalog.

### Apply UI Strategy from Plan

Before implementing frontend, read the **UI Strategy** section from `plan.md` (generated in `/speckit.plan` Step 5.5).

The UI Strategy specifies:
- **Page Template**: Which template to use (ExecutiveDashboard, ChatAnalytics, DataExplorer)
- **Theme Configuration**: Industry overlay + persona accent colors
- **Chart Assignments**: Which chart component for each question
- **Executive Components**: Whether to include TechnicalMetadata, CrisisKPI, Skeletons

**Do NOT guess visualizations** - use the confirmed selections from plan.md.

### Implementation Checklist

Apply UI decisions from `plan.md` and `sample-questions.yaml`:

```
□ Copy page template from templates/ui/pages/{template_name}.tsx
□ Apply theme tokens:
  - Import industryTints.{industry} for accent colors
  - Import personaAccents.{persona} for primary colors
  - Update tailwind.config.js with custom colors if needed
□ For each question in sample-questions.yaml:
  - Use visualization.recommended_chart component
  - If threshold is set, use CrisisKPI instead of KPICard
  - Apply visualization.notes for special handling
□ Add executive components as specified:
  - TechnicalMetadata: Add to key charts showing SQL/lineage
  - CrisisKPI: Replace KPICard for metrics with thresholds
  - Skeleton loaders: Add chart-specific skeletons for loading states
□ Wire up API endpoints to chart data props
□ Test responsive breakpoints
```

### Page Templates (Reference)

Choose based on frontend pattern from plan.md:

| Frontend Pattern | Template | Description |
|-----------------|----------|-------------|
| Executive Dashboard | `ExecutiveDashboard` | KPIs + trend charts + insights |
| Conversational BI | `ChatAnalytics` | AI chat with live analytics |
| Data Exploration | `DataExplorer` | SQL query with auto-visualization |

```tsx
// Copy template, then customize for your domain
import { ExecutiveDashboard } from '../templates/ui/pages';

<ExecutiveDashboard
  title="Marketing Analytics"
  kpiData={yourDomainKPIs}
  trendData={yourMetricTrends}
  onRefresh={fetchFromBackend}
/>
```

### Layout Templates (For Custom Pages)

| Layout | Use Case |
|--------|----------|
| `DashboardShell` | App shell with sidebar navigation |
| `KPIGrid` | Responsive grid for KPI cards |
| `ChartGrid` | Multi-chart layouts (equal, featured, sidebar) |
| `SplitView` | Side-by-side panels for chat + analytics |

### Chart Components

All charts from `templates/ui/charts/`:
- `KPICard` - Metric with trend indicator
- `LineChart` - Time series, trends
- `BarChart` - Comparisons, rankings
- `PieChart` - Distributions, proportions
- `AreaChart` - Cumulative metrics
- `HorizontalBarChart` - Long labels, rankings

### Customization Checklist

When adapting templates:
- [ ] Replace sample data with API calls to your backend
- [ ] Update KPI definitions for your domain
- [ ] Customize suggested questions (ChatAnalytics)
- [ ] Wire up Cortex Agent/Analyst endpoints
- [ ] Update example queries (DataExplorer)
- [ ] Add your branding to DashboardShell

## Implementation Checkpoints

| After Phase | Verify |
|-------------|--------|
| Foundation | Both zone connections work |
| Database | Sample queries return expected data |
| Backend | All API endpoints return valid responses |
| Frontend | Full UI functional, SSE streaming works |
| Integration | Demo ready for presentation |

## Output

At completion:

```
✅ Demo implementation complete

Summary:
- Backend: {n} endpoints implemented
- Frontend: {n} pages built
- Database: {n} tables with {n} rows

Start commands:
  Backend:  cd backend && uvicorn app.main:app --reload
  Frontend: cd frontend && npm run dev

Demo is ready for presentation.
```

## Stopping Points

- ✋ After each phase for checkpoint verification
- ✋ When blocked by missing information
- ✋ When a decision is needed (multiple valid approaches)

**Resume rule:** Upon user approval, proceed directly without re-asking.

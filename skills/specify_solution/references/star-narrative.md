# STAR Narrative Framework

> Load when generating persona journeys in spec.md

## STAR Method (Design Philosophy)

Structure each persona's solution journey using Situation → Task → Action → Result.
(Do NOT reference "STAR" in solution UI—use as internal design philosophy.)

| Element | Purpose | Solution Implementation |
|---------|---------|---------------------|
| **Situation** | Show current state/problem | KPI cards showing gap, "before" metrics |
| **Task** | Define what needs solving | Clear header stating the challenge |
| **Action** | Enable user interaction | Sliders, filters, buttons, parameters |
| **Result** | Visualize the outcome | Updated charts, "after" metrics |

### STAR Navigation Checklist

For each persona, verify:

- [ ] Entry point immediately presents the Situation (current problem)
- [ ] Task is clearly stated (what are we solving?)
- [ ] Action elements are interactive and intuitive
- [ ] Result is quantifiable and prominent

## Hidden Discovery Pattern

The most compelling solutions reveal non-obvious insights.

### Design Process

1. **Define the Discovery** - What hidden insight should emerge?
2. **Engineer the Data** - Structure synthetic data to guarantee this discovery
3. **Validate the Reveal** - Test that discovery actually appears in output

### Example Patterns

| Pattern | Example |
|---------|---------|
| Hidden dependency | "Supplier X appears minor (11% of orders) but serves 70% of critical manufacturers" |
| Emerging trend | "Defect rate looks stable overall but accelerating in newest product line" |
| Counterintuitive finding | "Highest-cost region actually has best ROI when considering lifetime value" |
| Network effect | "Small customer cluster drives 40% of referral revenue" |

### Discovery Specification (for spec.md)

Include in every spec:

- **Discovery Statement**: One sentence describing the hidden insight
- **Surface Appearance**: What the data looks like before analysis
- **Revealed Reality**: What emerges after applying the solution
- **Business Impact**: Why this discovery matters

## Persona Framework

Every solution should include three persona levels:

| Level | Typical Roles | Focus |
|-------|---------------|-------|
| **Strategic** | VP, Director, C-Suite | Aggregate metrics, investment decisions |
| **Operational** | Manager, Supervisor | Alerts, resource deployment, daily ops |
| **Technical** | Engineer, Analyst, Data Scientist | Root cause analysis, ML correlation |

### User Story Template

```
"As a [Role], I want to [Action] so that I can [Outcome]."
```

## Persona-Specific Visualizations

### Strategic (Executive) Personas

| Goal | Recommended Visuals |
|------|---------------------|
| Understand ROI | Aggregated KPI cards with financial impact |
| Compare scenarios | "Before vs. After" comparison charts |
| Regional overview | Geospatial maps (PyDeck) |
| Forecast impact | Trend lines with clear forecast indicators |

### Operational (Manager) Personas

| Goal | Recommended Visuals |
|------|---------------------|
| Identify issues | Interactive tables with conditional formatting |
| Detect outliers | Histograms, scatter plots with anomaly highlighting |
| Segment data | Filter panels for deep segmentation |
| Prioritize work | "Top 10" actionable lists |

### Technical (Engineer/Analyst) Personas

| Goal | Recommended Visuals |
|------|---------------------|
| Trust the model | ROC curves, confusion matrices, lift charts |
| Understand drivers | Feature importance plots |
| Verify data | Raw data explorers, JSON/source row tabs |
| Track pipeline | Data lineage, pipeline status indicators |

## STAR Narrative Mapping Template

For each persona, complete this mapping:

**Strategic Persona Journey:**

| STAR Element | Implementation |
|--------------|----------------|
| **Situation** | [KPI card or metric showing current gap/problem] |
| **Task** | [Clear statement of what needs to be decided] |
| **Action** | [Interactive element: filter, toggle, scenario selector] |
| **Result** | [Visualization showing impact: before/after, projected savings] |

**Operational Persona Journey:**

| STAR Element | Implementation |
|--------------|----------------|
| **Situation** | [Dashboard showing operational status/anomalies] |
| **Task** | [Specific issue to investigate or resolve] |
| **Action** | [Drill-down, filter panel, or action button] |
| **Result** | [Actionable list, prioritized recommendations] |

**Technical Persona Journey:**

| STAR Element | Implementation |
|--------------|----------------|
| **Situation** | [Model performance metrics, data quality indicators] |
| **Task** | [Analysis objective: root cause, correlation, prediction] |
| **Action** | [Parameter tuning, feature selection, query builder] |
| **Result** | [Model outputs, feature importance, diagnostic plots] |

# {Demo Name} Specification

> {Narrative hook - the story this demo tells}

## Overview

| Attribute | Value |
|-----------|-------|
| **Purpose** | {Sales Demo / POC / Training / Event / Customer Success} |
| **Industry** | {Industry} |
| **Primary Persona** | {Persona} |
| **Demo Duration** | {5 / 15 / 30 / 60+ minutes} |
| **Data Scale** | {Minimal / Realistic / Scale Test} |
| **Created** | {Date} |
| **Status** | Draft |

## Business Context

### Target Audience
{Description of who will see this demo}

- **Company Type**: {Enterprise / Mid-Market / SMB / Startup}
- **Current Stack**: {Legacy / Cloud DW / None / Unknown}
- **Pain Points**: {List of pain points being addressed}

### Narrative
{Expanded narrative hook - the story arc of the demo}

---

## User Stories

### [US1] {Primary Capability} (P1)

**As a** {persona},  
**I want to** {action},  
**So that** {benefit}.

**Acceptance Criteria:**
- [ ] {Criterion 1 - tied to a key question}
- [ ] {Criterion 2}
- [ ] {Criterion 3}

**Demo Script:**
1. {Step 1 of showing this feature}
2. {Step 2}
3. {Expected "wow" moment}

---

### [US2] {Secondary Capability} (P1)

**As a** {persona},  
**I want to** {action},  
**So that** {benefit}.

**Acceptance Criteria:**
- [ ] {Criterion 1}
- [ ] {Criterion 2}

---

### [US3] {Additional Capability} (P2)

**As a** {persona},  
**I want to** {action},  
**So that** {benefit}.

**Acceptance Criteria:**
- [ ] {Criterion 1}

---

## Key Questions

The demo must successfully answer these natural language questions:

| # | Question | Expected Result | User Story |
|---|----------|-----------------|------------|
| 1 | "{Natural language question}" | {single value / table / chart} | [US1] |
| 2 | "{Question 2}" | {result type} | [US1] |
| 3 | "{Question 3}" | {result type} | [US2] |
| 4 | "{Question 4}" | {result type} | [US2] |
| 5 | "{Question 5}" | {result type} | [US3] |

---

## Features

### Cortex Capabilities

| Feature | Included | Notes |
|---------|----------|-------|
| Cortex Analyst (Text-to-SQL) | {Yes/No} | {Notes} |
| Cortex Agent (Orchestrated AI) | {Yes/No} | {Notes} |
| RAG (Document Search) | {Yes/No} | {Notes} |
| LLM Functions | {Yes/No} | {Notes} |
| Cortex Search | {Yes/No} | {Notes} |

### Additional Features

| Feature | Included | Notes |
|---------|----------|-------|
| Real-time Dashboard | {Yes/No} | |
| Alerting / Notifications | {Yes/No} | |
| Data Export | {Yes/No} | |
| Saved Queries | {Yes/No} | |
| Audit Trail | {Yes/No} | |

---

## Data Requirements

### Entities

| Entity | Description | Row Count | Key Fields |
|--------|-------------|-----------|------------|
| {entity1} | {description} | {count} | {fields} |
| {entity2} | {description} | {count} | {fields} |

**Full schema**: See `domain-model.yaml`

### Time Range
- **Start**: {start date}
- **End**: {end date}
- **Granularity**: {daily / hourly}

### Data Characteristics
- [ ] Anomalies / Outliers
- [ ] Seasonality
- [ ] Trends
- [ ] Missing Data
- [ ] Data Quality Issues

---

## Technical Configuration

### Cortex Pattern
- **Pattern**: {Inline Configuration / Agent Object}
- **Streaming**: {Yes / No}
- **Model**: {claude-4-sonnet / mistral-large2 / etc.}

### Architecture
- **Zone A (Postgres)**: {What's stored here}
- **Zone B (Snowflake)**: {What's stored here}
- **Multi-tenant**: {Yes / No}

---

## UI Strategy

> Generated during `/speckit.plan` based on industry, persona, and question analysis.
> See `templates/ui/visualization-matrix.md` for decision logic.

### Page Template

| Selection | Rationale |
|-----------|-----------|
| {ExecutiveDashboard / ChatAnalytics / DataExplorer} | {Why this template fits persona + features} |

### Theme Configuration

| Setting | Value | Color |
|---------|-------|-------|
| Industry Overlay | {industry} | {color hex} |
| Persona Accent | {persona} | {color hex} |

### Visualization Assignments

| Question | Result Type | Chart Component | Notes |
|----------|-------------|-----------------|-------|
| "{Question 1}" | {type} | {ChartComponent} | {threshold, special handling} |
| "{Question 2}" | {type} | {ChartComponent} | |
| "{Question 3}" | {type} | {ChartComponent} | |

### Executive Components

| Component | Include | Rationale |
|-----------|---------|-----------|
| TechnicalMetadata | {Yes/No} | {Why - data provenance needs} |
| CrisisKPI | {Yes/No} | {Why - threshold alerts needed} |
| Skeleton Loaders | {Yes/No} | {Why - loading state UX} |

### Dashboard Layout

```
{ASCII diagram of layout - KPI grid, chart positions, etc.}
```

---

## Out of Scope

The following are explicitly **NOT** included in this demo:

- {Exclusion 1}
- {Exclusion 2}
- {Exclusion 3}

---

## Success Criteria

This demo is successful when:

1. [ ] All key questions return accurate results
2. [ ] Demo completes within {duration} time limit
3. [ ] {Persona} can complete workflow without assistance
4. [ ] {Specific success metric}

---

## References

- **Domain Model**: `domain-model.yaml`
- **Semantic Model**: `semantic-model.yaml`
- **Sample Questions**: `sample-questions.yaml`
- **Constitution**: `../../.specify/memory/constitution.md`

---

*Generated by `/speckit.specify` on {date}*

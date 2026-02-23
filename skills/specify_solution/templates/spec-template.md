# {Solution Name} Specification

> {Narrative hook - the story this solution tells}

## 1. Strategic Overview

| Attribute | Value |
|-----------|-------|
| **Purpose** | {Sales / POC / Training / Event / Customer Success} |
| **Industry** | {Industry} |
| **Sub-segment** | {Sub-segment if applicable} |
| **Primary Persona** | {Persona} |
| **Duration** | {5 / 15 / 30 / 60+ minutes} |
| **Data Scale** | {Minimal / Realistic / Scale Test} |
| **Created** | {Date} |
| **Status** | Draft |

### Problem Statement

{Synthesize a professional problem statement addressing data silos, manual processes, or lack of visibility.}

### Target Business Goals (KPIs)

| KPI | Current State | Target State | Improvement |
|-----|---------------|--------------|-------------|
| {KPI 1} | {current} | {target} | {%/abs change} |
| {KPI 2} | {current} | {target} | {%/abs change} |
| {KPI 3} | {current} | {target} | {%/abs change} |

### The "Wow" Moment

{Describe the single most impressive interaction in the solution, typically involving AI instant answers.}

### Hidden Discovery

| Aspect | Description |
|--------|-------------|
| **Discovery Statement** | {One sentence describing the non-obvious insight} |
| **Surface Appearance** | {What the data looks like before analysis} |
| **Revealed Reality** | {What emerges after applying the solution} |
| **Business Impact** | {Why this discovery matters - quantified if possible} |

### Self-Guided Requirements

| Requirement | Value | Implementation |
|-------------|-------|----------------|
| Presenter Required | {Yes/No} | |
| Contextual Tooltips | {Yes/No} | {Where/how} |
| Callout Boxes | {Yes/No} | {Where/how} |
| Guided Mode Toggle | {Yes/No} | {Behavior} |
| Story Flow | {Description} | {Entry to conclusion path} |

---

## 2. User Personas & Stories

| Persona Level | Role Title | Key User Story |
|---------------|------------|----------------|
| **Strategic** | {e.g., VP of Operations} | "As a {Role}, I want to see global {Metric} aggregated across all regions to make investment decisions." |
| **Operational** | {e.g., Plant Manager} | "As a {Role}, I want to receive alerts when {Metric} deviates from the norm so I can deploy resources." |
| **Technical** | {e.g., Process Engineer} | "As a {Role}, I want to use ML to correlate {Variable A} with {Variable B} to identify root causes." |

### Strategic Persona Journey (STAR)

| STAR Element | Implementation |
|--------------|----------------|
| **Situation** | {KPI card or metric showing current gap/problem} |
| **Task** | {Clear statement of what needs to be decided} |
| **Action** | {Interactive element: filter, toggle, scenario selector} |
| **Result** | {Visualization showing impact: before/after, projected savings} |

### Operational Persona Journey (STAR)

| STAR Element | Implementation |
|--------------|----------------|
| **Situation** | {Dashboard showing operational status/anomalies} |
| **Task** | {Specific issue to investigate or resolve} |
| **Action** | {Drill-down, filter panel, or action button} |
| **Result** | {Actionable list, prioritized recommendations} |

### Technical Persona Journey (STAR)

| STAR Element | Implementation |
|--------------|----------------|
| **Situation** | {Model performance metrics, data quality indicators} |
| **Task** | {Analysis objective: root cause, correlation, prediction} |
| **Action** | {Parameter tuning, feature selection, query builder} |
| **Result** | {Model outputs, feature importance, diagnostic plots} |

---

## 3. Data Architecture

### Layer Design

| Layer | Schema | Tables | Purpose |
|-------|--------|--------|---------|
| Landing | `RAW` | {list tables} | External data in original format |
| Canonical | `ATOMIC` | {list tables} | Normalized enterprise model |
| Consumption | `{DATA_MART}` | {list views/tables} | Consumer-facing data products |

### RAW Layer

| Table | Source Type | Metadata Pattern | Est. Rows |
|-------|-----------|------------------|-----------|
| {TABLE_1} | {File/CDC/API} | {staging/cdc/api} | {count} |
| {TABLE_2} | {File/CDC/API} | {staging/cdc/api} | {count} |

### ATOMIC Layer

| Table | SCD Type | Key Relationships | Est. Rows |
|-------|----------|-------------------|-----------|
| {TABLE_1} | {Type 1/Type 2} | {FK references} | {count} |
| {TABLE_2} | {Type 1/Type 2} | {FK references} | {count} |

### DATA_MART Layer ({DATA_MART_NAME})

| Object | Type | Purpose | Source Tables |
|--------|------|---------|---------------|
| {VIEW_1} | View | {description} | {source tables} |
| {AGG_TABLE_1} | Table | {description} | {source tables} |

### Structured Data Summary

| Table | Description | Grain | Est. Rows | Key Fields |
|-------|-------------|-------|-----------|------------|
| {TABLE_1} | {description} | {grain} | {count} | {fields} |
| {TABLE_2} | {description} | {grain} | {count} | {fields} |

**Full schema**: See `domain-model.yaml`

### Unstructured Data (Tribal Knowledge)

| Source Material | Purpose | Format |
|-----------------|---------|--------|
| {e.g., Maintenance Manuals} | Used for "How-to" questions via Cortex Search | {PDF/DOCX} |
| {e.g., Physician Notes} | Qualitative context via RAG | {Text} |

### Time Range

- **Start**: {start date}
- **End**: {end date}
- **Granularity**: {daily / hourly}

### Data Characteristics

- [ ] Anomalies / Outliers (engineered for Hidden Discovery)
- [ ] Seasonality
- [ ] Trends
- [ ] Missing Data (intentional or realistic gaps)

### ML Notebook Specification

| Attribute | Value |
|-----------|-------|
| **Objective** | {e.g., Churn Prediction, Anomaly Detection} |
| **Target Variable** | `{Column_Name}` |
| **Algorithm Choice** | {e.g., XGBoost, Prophet} |
| **Inference Output** | Predictions written to `{OUTPUT_TABLE_NAME}` |

---

## 4. Cortex Intelligence Specifications

> Full implementation details in `cortex-spec.yaml`

### Cortex Analyst (Structured Data / SQL)

**Semantic Model Scope:**

| Type | Fields |
|------|--------|
| **Measures** | {List 3 key numerical metrics users will ask about} |
| **Dimensions** | {List 3 key categorical columns for filtering} |
| **Time Dimensions** | {Date/timestamp columns} |

**Semantic Model Requirements:**

| Requirement | Value |
|-------------|-------|
| `primary_key` defined | {Yes — for every table} |
| `verified_at` format | Unix timestamp (int64) |
| Metrics/filters location | Inside table definitions |
| Column descriptions | Specific (include units, ranges) |
| Synonyms | Industry-specific alternate names |

**Golden Queries (Verification):**

| # | Question | Expected Result | Validation |
|---|----------|-----------------|------------|
| 1 | "{Question}" | {result type} | {how to verify} |
| 2 | "{Question}" | {result type} | {how to verify} |
| 3 | "{Question}" | {result type} | {how to verify} |

### Cortex Search (Unstructured Data / RAG)

| Attribute | Value |
|-----------|-------|
| **Service Name** | `{DOMAIN}_SEARCH_SERVICE` |
| **Source Table** | `{DATABASE}.{SCHEMA}.{TABLE}` |
| **ID Column** | `{ID_COLUMN}` (must be in SELECT) |
| **Text Column** | `{TEXT_COLUMN}` |
| **Attributes** | {filterable metadata columns} |
| **Chunking Strategy** | {recursive_character / paragraph / sentence} |
| **Chunk Size** | {target tokens, e.g., 1000} |
| **Sample RAG Prompt** | "{Question that requires reading PDF documents}" |

### Cortex Agent (if multi-tool orchestration needed)

| Attribute | Value |
|-----------|-------|
| **Agent Name** | `{DOMAIN}_AGENT` |
| **Model** | {snowflake-llama-3.3-70b / claude-3-5-sonnet} |
| **Tools** | {List: analyst, search, custom functions} |
| **Orchestration Pattern** | {Sequential / Parallel / Conditional} |
| **REST Endpoint** | `/api/v2/databases/{DB}/schemas/{SCHEMA}/agents/{AGENT}:run` |
| **HTTP Client** | `httpx` (NOT `requests`) |

**Agent Tools:**

| Tool Name | Type | Resource |
|-----------|------|----------|
| {tool_1} | cortex_analyst_text_to_sql | {semantic_model} |
| {tool_2} | cortex_search | {search_service} |
| {tool_3} | custom | {DB.SCHEMA.UDF} |

### LLM Functions

| Function | Use Case | Input | Output |
|----------|----------|-------|--------|
| `SNOWFLAKE.CORTEX.COMPLETE` | {use case} | {input description} | {text/json} |
| `SNOWFLAKE.CORTEX.SENTIMENT` | {use case} | {text column} | FLOAT (-1.0 to 1.0) |
| `SNOWFLAKE.CORTEX.SUMMARIZE` | {use case} | {text column} | VARCHAR |

### Feature Matrix

| Feature | Included | Notes |
|---------|----------|-------|
| Cortex Analyst (Text-to-SQL) | {Yes/No} | {Notes} |
| Cortex Agent (Orchestrated AI) | {Yes/No} | {Notes} |
| Cortex Search (Document RAG) | {Yes/No} | {Notes} |
| LLM Functions | {Yes/No} | {Notes} |

---

## 5. Application UX/UI

### App Type

| Attribute | Value |
|-----------|-------|
| **Primary App** | React + FastAPI |
| **Reasoning** | {Why this architecture fits the use case} |

### Page Template

| Selection | Rationale |
|-----------|-----------|
| {ExecutiveDashboard / ChatAnalytics / DataExplorer} | {Why this template fits persona + features} |

### Theme Configuration

| Setting | Value | Color |
|---------|-------|-------|
| Industry Overlay | {industry} | {color hex} |
| Persona Accent | {persona} | {color hex} |
| Primary Color | Snowflake Blue | #29B5E8 |
| Background | Dark theme | #121212 |

### Component Logic

| Component | Purpose | Integration |
|-----------|---------|-------------|
| Visualizations | {e.g., Altair Heatmap showing defect density} | {Data source} |
| Chat Integration | {How user toggles between Analyst (Numbers) and Search (Docs)} | {UX pattern} |

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

## 5.5. React Components (if React frontend)

### Component Mapping

| Feature | Components | Hook |
|---------|-----------|------|
| Agent Chat | `CortexConversation`, `CortexPromptInput` | `useCortexAgent` |
| Query Results | `CortexTool` (analyst_result) | — |
| Document Search | `CortexSources` | — |
| Reasoning | `CortexReasoning` | — |
| Auto-scroll | — | `useAutoScroll` |

### SSE Event Handling

| Event Type | UI Behavior |
|------------|-------------|
| `text` | Append to current message (streaming) |
| `tool_result` | Show tool invocation with expandable details |
| `analyst_result` | Render query + data table/chart |
| `error` | Show error message to user |
| `done` | Finalize message, re-enable input |

### Suggested Prompts

| Category | Prompts |
|----------|---------|
| Initial | {3 starter prompts for first interaction} |
| Follow-up | {3 drill-down prompts} |
| Hidden Discovery | {1 prompt that leads to planted insight} |

---

## 6. Success Criteria

### Technical Validator

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| Query response time | < 3 seconds | System processes NL query and visualizes result |
| Error rate | < 1% | All key questions return accurate results |

### Business Validator

| Criterion | Current State | Future State |
|-----------|---------------|--------------|
| Time-to-insight | {Current} | {Target} |
| {Business metric} | {Current} | {Target} |

### Solution Validator

- [ ] All key questions return accurate results
- [ ] Solution completes within {duration} time limit
- [ ] {Persona} can complete workflow without assistance
- [ ] Hidden Discovery moment is clearly visible
- [ ] Self-guided mode works (if applicable)

---

## Key Questions

The solution must successfully answer these natural language questions:

| # | Question | Expected Result | Persona | User Story |
|---|----------|-----------------|---------|------------|
| 1 | "{Natural language question}" | {single value / table / chart} | {persona} | [US1] |
| 2 | "{Question 2}" | {result type} | {persona} | [US1] |
| 3 | "{Question 3}" | {result type} | {persona} | [US2] |
| 4 | "{Question 4}" | {result type} | {persona} | [US2] |
| 5 | "{Question 5}" | {result type} | {persona} | [US3] |

---

## Out of Scope

The following are explicitly **NOT** included in this solution:

- {Exclusion 1}
- {Exclusion 2}
- {Exclusion 3}

---

## 6.5. Testing Plan

### Golden Query Validation

| # | Question | Expected SQL Pattern | Expected Result | Validation Method |
|---|----------|---------------------|-----------------|-------------------|
| 1 | "{Question}" | `SELECT ... FROM ...` | {shape + range} | {how to verify} |
| 2 | "{Question}" | `SELECT ... FROM ...` | {shape + range} | {how to verify} |
| 3 | "{Question}" | `SELECT ... FROM ...` | {shape + range} | {how to verify} |

### Acceptance Criteria

| Component | Criterion | Pass Condition |
|-----------|-----------|----------------|
| Data | RAW tables load | `COPY INTO` succeeds, row counts match |
| Data | ATOMIC transforms | Expected row counts, metadata populated |
| Data | Hidden Discovery | Insight reliably present in data |
| Cortex | Agent responds | All tools resolve, streaming completes |
| Cortex | Golden queries pass | Expected SQL generated, results correct |
| Cortex | Search returns relevant results | Top-3 contain expected documents |
| App | Pages load without errors | No console errors, all widgets interactive |
| App | Agent chat functional | Send message → receive streamed response |

### Test Execution Order

1. Deploy (`deploy.sh`)
2. Validate data (row counts, referential integrity)
3. Verify Cortex services (agent, search, analyst)
4. Run golden queries
5. Test frontend interactions
6. Clean (`clean.sh`)
7. Re-deploy (verify idempotent)

---

## 7. Deployment

### Script Model

| Script | Purpose | Location |
|--------|---------|----------|
| `deploy.sh` | Creates all Snowflake objects, loads data | Project root |
| `run.sh` | Starts the application | Project root |
| `clean.sh` | Drops all objects (with confirmation) | Project root |

### SQL Execution Order

| Order | File | Creates |
|-------|------|---------|
| 1 | `sql/01_setup.sql` | Database, schemas, roles, warehouses |
| 2 | `sql/02_raw.sql` | RAW layer tables |
| 3 | `sql/03_atomic.sql` | ATOMIC layer tables + transforms |
| 4 | `sql/04_data_mart.sql` | DATA_MART views + aggregations |
| 5 | `sql/05_cortex.sql` | Agent, Search, Semantic Model |

### Connection Configuration

| Setting | Value |
|---------|-------|
| **Env Variable** | `SNOWFLAKE_CONNECTION_NAME` |
| **Default** | `demo` |
| **Pattern** | `connection_name=os.getenv("SNOWFLAKE_CONNECTION_NAME", "demo")` |

### SPCS Configuration (if applicable)

| Setting | Value |
|---------|-------|
| **Instance Family** | `CPU_X64_XS` |
| **Auto-Suspend** | 300 seconds |
| **Readiness Probe** | Port 8080, path `/health` |
| **Min/Max Instances** | 1 / 1 |

---

## 8. Solution Packaging

### Repository Structure

```
{project-slug}/
├── deploy.sh
├── run.sh
├── clean.sh
├── README.md
├── sql/
│   ├── 01_setup.sql
│   ├── 02_raw.sql
│   ├── 03_atomic.sql
│   ├── 04_data_mart.sql
│   └── 05_cortex.sql
├── data/
│   └── seed/                    # Pre-generated with seed=42
├── react/                       # React + FastAPI application
├── notebooks/                   # ML notebooks (if applicable)
├── models/
│   └── semantic-model.yaml      # Cortex Analyst model
├── cortex-spec.yaml             # Cortex feature specification
└── specs/
    └── {NNN}-{slug}/
        ├── spec.md
        ├── domain-model.yaml
        ├── sample-questions.yaml
        └── prompt_plan.md
```

### Environment Requirements

| Requirement | Value |
|-------------|-------|
| **Python** | `>=3.10,<3.12` |
| **HTTP Client** | `httpx` (not `requests`) |
| **Snowflake CLI** | `snow` for deployment scripts |
| **Node.js** | `>=18` (if React) |

### Pre-Publication Checklist

- [ ] Three scripts in project root (deploy.sh, run.sh, clean.sh)
- [ ] `deploy.sh` is idempotent (`CREATE OR REPLACE`)
- [ ] No hardcoded credentials in any file
- [ ] No `ACCOUNTADMIN` role in solution code
- [ ] Synthetic data pre-generated with `seed=42` and committed
- [ ] All golden queries validated
- [ ] DRD (spec.md) complete with all sections
- [ ] README.md with setup instructions
- [ ] No CSP-blocked libraries (D3, Leaflet, Plotly Geo)
- [ ] Hidden Discovery insight reliably present in data

---

## References

- **Domain Model**: `domain-model.yaml`
- **Cortex Spec**: `cortex-spec.yaml`
- **Semantic Model**: `semantic-model.yaml`
- **Sample Questions**: `sample-questions.yaml`
- **Prompt Plan**: `prompt_plan.md`
- **Constitution**: `../../memory/constitution.md`

---

*Generated by `/speckit.specify` on {date}*

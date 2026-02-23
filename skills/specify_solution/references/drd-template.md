# Solution Requirements Document (DRD) Template

> Load this reference when generating spec.md to include DRD sections

## DRD Structure

The DRD has 6 required sections that transform unstructured ideas into professional-grade specifications.

## Section 1: Strategic Overview

```markdown
## 1. Strategic Overview

**Problem Statement:** [Synthesize a professional problem statement addressing data silos, manual processes, or lack of visibility.]

**Target Business Goals (KPIs):**
- [KPI 1 - e.g., Reduce Scrap Rate by 15%]
- [KPI 2 - e.g., Increase Forecast Accuracy by 10%]

**The "Wow" Moment:** [Describe the single most impressive interaction in the solution, typically involving AI instant answers.]

### Hidden Discovery

- **Discovery Statement:** [One sentence describing the non-obvious insight]
- **Surface Appearance:** [What the data looks like before analysis]
- **Revealed Reality:** [What emerges after applying the solution]
- **Business Impact:** [Why this discovery matters - quantified if possible]

### Self-Guided Requirements

- **Presenter Required:** [Yes/No]
- **Contextual Guidance:** [Tooltips, callout boxes, guided mode toggles]
- **Story Flow:** [How the solution tells its story from entry to conclusion]
```

## Section 2: User Personas & Stories

```markdown
## 2. User Personas & Stories

| Persona Level | Role Title | Key User Story (Solution Flow) |
|---------------|------------|----------------------------|
| **Strategic** | [e.g., VP of Operations] | "As a [Role], I want to see global [Metric] aggregated across all regions to make investment decisions." |
| **Operational** | [e.g., Plant Manager] | "As a [Role], I want to receive alerts when [Metric] deviates from the norm so I can deploy resources." |
| **Technical** | [e.g., Process Engineer] | "As a [Role], I want to use ML to correlate [Variable A] with [Variable B] to identify root causes." |

### STAR Narrative Mapping

**Strategic Persona Journey:**

| STAR Element | Implementation |
|--------------|----------------|
| **Situation** | [KPI showing current gap/problem] |
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
```

## Section 3: Data Architecture

```markdown
## 3. Data Architecture & Snowpark ML

**Structured Data (Schema):**
- `[TABLE_1]`: [Description of columns and grain]
- `[TABLE_2]`: [Description of columns and grain]

**Unstructured Data (Tribal Knowledge):**
- **Source Material:** [e.g., Maintenance Manuals, Physician Notes, Legal Contracts]
- **Purpose:** Used to answer "How-to" or qualitative questions via Cortex Search.

**ML Notebook Specification:**
- **Objective:** [e.g., Churn Prediction, Anomaly Detection]
- **Target Variable:** `[Column_Name]`
- **Algorithm Choice:** [e.g., XGBoost, Prophet]
- **Inference Output:** Predictions written to table `[OUTPUT_TABLE_NAME]`
```

## Section 4: Cortex Intelligence Specs

```markdown
## 4. Cortex Intelligence Specifications

### Cortex Analyst (Structured Data / SQL)

**Semantic Model Scope:**
- **Measures:** [List 3 key numerical metrics users will ask about]
- **Dimensions:** [List 3 key categorical columns for filtering]

**Golden Query (Verification):**
- *User Prompt:* "[Insert realistic natural language question]"
- *Expected SQL Operation:* `SELECT [Measure] FROM [Table] GROUP BY [Dimension]`

### Cortex Search (Unstructured Data / RAG)

- **Service Name:** `[DOMAIN]_SEARCH_SERVICE`
- **Indexing Strategy:**
  - **Document Attribute:** [e.g., Indexing by `product_id` or `policy_type`]
- **Sample RAG Prompt:** "[Insert a question that requires reading the PDF documents]"

### Cortex Agent (if multi-tool orchestration needed)

- **Agent Name:** `[DOMAIN]_AGENT`
- **Tools:** [List tools: analyst, search, custom functions]
- **Orchestration Pattern:** [Sequential / Parallel / Conditional]
```

## Section 5: Streamlit/React UX

```markdown
## 5. Application UX/UI

**App Type:** [Streamlit / React]

**Layout Strategy:**
- **Page 1 (Executive):** High-level KPI cards and aggregate trends
- **Page 2 (Action):** Interactive ML drill-down and Chat Interface

**Component Logic:**
- **Visualizations:** [e.g., Altair Heatmap showing defect density]
- **Chat Integration:** [How user toggles between Analyst (Numbers) and Search (Docs)]

**UI Theme:**
- Primary color: Snowflake Blue (#29B5E8)
- Background: Dark theme (#121212)
```

## Section 6: Success Criteria

```markdown
## 6. Success Criteria

**Technical Validator:** 
- The system processes a natural language query and visualizes the result in < 3 seconds

**Business Validator:** 
- The workflow reduces time-to-insight from [Current State] to [Future State]

**Solution Validator:**
- [ ] All key questions return accurate results
- [ ] Solution completes within [duration] time limit
- [ ] [Persona] can complete workflow without assistance
```

## Snowflake Component Mapping

Map user needs to Snowflake capabilities:

| Need | Snowflake Component |
|------|---------------------|
| Predictive modeling / ML | Snowpark ML & Notebooks |
| Natural language → SQL | Cortex Analyst |
| Document search / RAG | Cortex Search |
| Multi-tool AI reasoning | Cortex Agents |
| Interactive dashboards | Streamlit in Snowflake |
| Feature engineering | ML Feature Store & Model Registry |
| PDF/document extraction | Document AI / AI_EXTRACT |
| Low-latency transactions | Hybrid Tables (Unistore) |
| Incremental pipelines | Dynamic Tables |
| ML job orchestration | Snowflake ML Jobs |

## Quality Checklist

Before finalizing a DRD:

**Strategic Overview**
- [ ] Problem statement is specific and measurable
- [ ] At least 2 KPIs defined with target improvements
- [ ] "Wow Moment" clearly articulated
- [ ] Hidden Discovery specified (surface vs. revealed reality)

**Personas & Narrative**
- [ ] Three distinct personas with user stories
- [ ] Each persona has STAR journey mapped
- [ ] Persona-specific visualizations identified
- [ ] Self-guided requirements defined (if applicable)

**Data & ML**
- [ ] Structured data tables have defined grain
- [ ] Unstructured data sources identified
- [ ] ML objective and target variable specified
- [ ] Data engineered to guarantee hidden discovery

**Cortex Intelligence**
- [ ] Cortex Analyst measures and dimensions listed
- [ ] Cortex Search service and indexing strategy defined

**UX & Validation**
- [ ] App layout described per persona
- [ ] Success criteria include time-to-insight metric

## DRD Generation Workflow

| Step | Action | Output |
|------|--------|--------|
| 1. Gather Context | Load research brief + intake answers + industry defaults | Input document |
| 2. Draft Sections | Generate all 6 DRD sections using templates above | Draft DRD |
| 3. Review | Validate against quality checklist | Issue list |
| 4. Finalize | Resolve gaps, confirm hidden discovery, confirm STAR completeness | Final DRD |

## DRD Quality Gate

| Check | Required |
|-------|----------|
| All 7 intake categories addressed | industry, audience, persona, pain points, hidden discovery, self-guided, data context |
| Component mapping complete | Every feature maps to a Snowflake capability |
| Hidden discovery engineered | Data design guarantees the insight appears |
| STAR journeys complete | Each persona has all 4 elements (Situation, Task, Action, Result) |
| Terminology consistent | Customer terms mapped to standard terms throughout |

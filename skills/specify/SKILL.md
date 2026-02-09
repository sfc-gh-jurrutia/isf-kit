---
name: specify
description: "Generate demo specifications through guided conversation. Use for: creating new demos, gathering requirements, defining domain models, specifying Cortex features. Triggers: new demo, create spec, demo specification, /speckit.specify"
---

# Specify - Demo Specification Generator

> Generate a demo specification through guided conversation

You are a Demo Specification Assistant. Your job is to gather requirements for a Snowflake demo application through a structured conversation, then generate specification files.

## When to Use

- User wants to create a new demo
- User needs to define requirements for a Snowflake solution
- User mentions industries: Healthcare, Financial, Retail, Manufacturing, Energy, Media, SaaS

## Workflow

### Step 1: Business Context

**Ask** the user for purpose:

```
Let's create a demo specification. First, what's the primary purpose?

1. **Sales Demo** - Showcase capabilities to a prospect
2. **Proof of Concept** - Validate technical fit with real requirements  
3. **Internal Training** - Teach team members Snowflake capabilities
4. **Conference/Event** - Public presentation or booth demo
5. **Customer Success** - Help existing customer expand usage

Which one? (or describe something different)

[Cancel]
```

**⚠️ STOP**: Wait for response.

**Then ask** for industry:

```
What industry is this demo targeting?

- Healthcare & Life Sciences
- Financial Services
- Retail & CPG
- Manufacturing
- Energy & Utilities
- Media & Entertainment
- Technology / SaaS
- Other (describe)

[Cancel]
```

**⚠️ STOP**: Wait for response.

**Industry defaults:**

| Industry | Default Entities | Sample KPIs |
|----------|------------------|-------------|
| Healthcare | patients, encounters, claims, providers | readmission_rate, avg_los, cost_per_case |
| Financial | accounts, transactions, customers, products | aum, fraud_rate, customer_ltv |
| Retail | products, orders, customers, inventory, stores | revenue, basket_size, conversion_rate |
| Manufacturing | equipment, sensors, work_orders, inventory | oee, downtime, defect_rate |
| Energy | assets, readings, customers, outages | uptime, consumption, peak_demand |
| Media | content, users, sessions, subscriptions | dau_mau, watch_time, churn_rate |
| SaaS | users, accounts, events, subscriptions | mrr, churn, nps, feature_adoption |

### Step 2: Persona & Goals

**Ask** for primary persona:

```
Who is the primary user in the demo?

1. **Executive / Decision Maker** - Low technical, wants KPIs and trends
2. **Business Analyst** - Medium technical, exploratory queries
3. **Data Analyst / Scientist** - High technical, SQL + natural language
4. **Operations / Front-line** - Low technical, task-focused
5. **Developer / Engineer** - Very high technical, API-focused
```

**⚠️ STOP**: Wait for response.

**Ask** for 3-5 key questions the persona should be able to ask.

**⚠️ STOP**: Wait for response.

### Step 3: Features & Scope

**Ask** which Cortex capabilities to showcase:

- Cortex Analyst (Text-to-SQL)
- Cortex Agent (Orchestrated AI)
- RAG (Document Search)
- LLM Functions (Complete, Summarize)
- Cortex Search

**⚠️ STOP**: Wait for response.

**Ask** for demo duration and out-of-scope items.

**⚠️ STOP**: Wait for response.

### Step 4: Data Model

**Ask** for data scale, time range, and data characteristics (anomalies, seasonality, trends).

**⚠️ STOP**: Wait for response.

**Present** default entities based on industry and validate questions against the data model.

**⚠️ STOP**: Wait for confirmation of data model.

### Step 5: Generate Specification

**⚠️ MANDATORY STOPPING POINT**: Present summary and wait for confirmation before generating files.

Upon confirmation:

1. **Determine spec number**: Find highest existing spec number in `specs/` directory, use N+1
2. **Create folder**: `specs/{NNN}-{slug}/` (e.g., `specs/001-retail-demo/`)
3. **Generate files**:
   - `spec.md` - Main specification
   - `domain-model.yaml` - Data entities
   - `sample-questions.yaml` - Validation questions
   - `semantic-model.yaml` - Cortex Analyst config

**Numbering convention:**
```bash
# Check existing specs
ls specs/ | grep -E '^[0-9]{3}-' | sort -r | head -1

# Examples:
specs/001-retail-demo/
specs/002-healthcare-analytics/
specs/003-financial-fraud/
```

## Stopping Points

- ✋ After asking purpose (Step 1)
- ✋ After asking industry (Step 1)
- ✋ After asking persona (Step 2)
- ✋ After asking key questions (Step 2)
- ✋ After asking Cortex features (Step 3)
- ✋ After presenting summary (Step 5) - confirm before generating

## Output

```
✓ Specification files created in specs/{NNN}-{slug}/

Files generated:
- spec.md
- domain-model.yaml
- sample-questions.yaml
- semantic-model.yaml

Next steps:
1. Run `/speckit.clarify` to resolve any ambiguities
2. Run `/speckit.plan` to create the technical architecture
3. Run `/speckit.tasks` to break down into implementable tasks
4. Run `/speckit.analyze` to validate before implementation
```

## Workflow Diagram

```
specify → clarify → plan → tasks → analyze → generate → implement
   │         │        │       │        │          │          │
   │         │        │       │        │          │          └─ Execute tasks
   │         │        │       │        │          └─ Data & artifacts
   │         │        │       │        └─ Quality gate
   │         │        │       └─ Task breakdown
   │         │        └─ Architecture
   │         └─ Resolve ambiguities
   └─ Gather requirements
```

## Sub-Skills

| Intent | Load | When |
|--------|------|------|
| Resolve ambiguities | `clarify/SKILL.md` | After specify, before plan |
| Create technical plan | `plan/SKILL.md` | After clarify |
| Generate task checklist | `tasks/SKILL.md` | After plan |
| Pre-implementation review | `analyze/SKILL.md` | After tasks, before implement |
| Generate demo data | `generate/SKILL.md` | After analyze |
| Implement the demo | `implement/SKILL.md` | After analyze passes |

## Error Handling

- **Off-track**: "Let me capture that, but first let's finish [current section] so we don't miss anything."
- **Conflicts**: "You mentioned [X] but also [Y] - which should take priority?"
- **Scope too large**: "This scope might be ambitious. Consider focusing on [suggestion] for core demo."

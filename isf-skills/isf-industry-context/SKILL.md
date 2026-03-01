---
name: isf-industry-context
description: >
  Generate domain knowledge documents and RAG corpus for Cortex Search.
  Use when: (1) creating industry-specific knowledge bases for copilot agents,
  (2) generating synthetic narrative documents from structured data,
  (3) writing domain procedures, protocols, or guides for search indexing,
  (4) populating the docs/ directory for a solution, or
  (5) designing the RAG content strategy for a Cortex Agent.
parent_skill: isf-solution-engine
---

# ISF Industry Context

## Quick Start

### What Does This Skill Do?

Creates the domain knowledge layer that feeds Cortex Search — the "institutional memory" that transforms a generic data app into an industry-aware copilot. Produces two types of content:

1. **Domain knowledge documents** — Expert-written procedures, protocols, best practices, and guides that live in `docs/` and are indexed by Cortex Search
2. **Synthetic narrative documents** — Text generated from structured data (DATA_MART tables) via SQL CONCAT, turning metrics and events into searchable narrative chunks

### Input

- `isf-context.md` for: industry, pain points, personas, hidden discovery, domain terminology
- Entity YAMLs from `isf-data-architecture/references/entities/` for domain vocabulary
- DATA_MART views from `isf-data-architecture` (if generating synthetic narratives)

### Output

- `docs/` directory with domain knowledge markdown files
- Search-prep views or tables in DATA_MART for synthetic narratives (consumed by `isf-cortex-search`)

## Core Workflow

```
1. READ SPEC
   └── Load isf-context.md: industry, pain_points, personas, domain terminology
   └── Load entity YAML for the industry (domain vocabulary)
   └── Identify Cortex Search services planned in the architecture

2. PLAN CONTENT STRATEGY
   └── Identify knowledge gaps: what should the copilot "know" beyond the data?
   └── Map persona questions to content types (procedures, guides, policies)
   └── Decide which content is hand-written docs vs synthetic from data
   └── Define document taxonomy (types, sections, tags)

   ⚠️ STOP: Present content plan (document list, types, estimated sections) for review.

3. GENERATE DOMAIN KNOWLEDGE DOCS
   └── For each planned document, generate markdown in docs/
   └── Structure: title, sections, subsections with actionable content
   └── Include decision frameworks, thresholds, procedures, reference tables
   └── Tag for Cortex Search ATTRIBUTES (document_type, topic, severity)

4. DESIGN SYNTHETIC NARRATIVES (if applicable)
   └── Identify DATA_MART views with searchable content
   └── Design SQL CONCAT patterns that produce useful narrative text
   └── Create search-prep views or tables for isf-cortex-search

5. OUTPUT
   └── docs/ directory with markdown files
   └── Search-prep views/tables DDL (appended to migrations or cortex SQL)
```

## Domain Knowledge Documents

### Structure

Each document follows a consistent pattern for consistent search quality:

```
docs/
├── {topic_a}_procedures.md      # Standard procedures for {topic_a}
├── {topic_b}_guide.md           # Best practices and parameter guides
├── {topic_c}_protocol.md        # Decision protocols for {topic_c}
└── troubleshooting_guide.md     # Common issues and resolution steps
```

### Document Template

```markdown
# {Topic Title}

## Overview
{1-2 paragraph summary of what this document covers and when to reference it.}

## {Section 1: Core Procedures}

### {Procedure Name}
**When to use:** {trigger conditions}
**Priority:** {HIGH / MEDIUM / LOW}

**Steps:**
1. {Step with specific thresholds, values, or actions}
2. {Step referencing domain-specific metrics}
3. {Step with decision point}

**If {condition A}:** {action}
**If {condition B}:** {escalation path}

## {Section 2: Parameter Reference}

| Parameter | Normal Range | Warning Threshold | Critical Threshold | Unit |
|-----------|-------------|-------------------|-------------------|------|
| {param_a} | {range}     | {threshold}       | {threshold}       | {unit} |

## {Section 3: Decision Framework}

```
Is {condition}?
  ├── Yes → {action_a}
  │         └── Did it resolve? → Yes → Document and monitor
  │                              → No → Escalate to {role}
  └── No → Continue monitoring
```

## {Section 4: Industry-Specific Context}

{Domain knowledge that the LLM wouldn't know from training data:
 - Proprietary thresholds
 - Regulatory requirements
 - Organizational standards
 - Lessons learned from past incidents}
```

### Content Guidelines

| Guideline | Rationale |
|-----------|-----------|
| Write for retrieval, not reading | Cortex Search returns chunks — each section should be self-contained |
| Include specific numbers | "Threshold is 15%" is searchable; "threshold is elevated" is not |
| Use consistent terminology | Match the entity YAML vocabulary so search queries align |
| Structure with clear headings | Cortex Search uses section boundaries for chunking |
| Tag documents by type | Enables ATTRIBUTES-based filtering in search queries |
| Cover "why" not just "what" | The copilot should explain reasoning, not just recite steps |

### Document Types

| Type | Purpose | Example Content |
|------|---------|----------------|
| `procedures` | Step-by-step operational protocols | Incident response, maintenance procedures |
| `guide` | Best practices and parameter references | Optimization guides, configuration standards |
| `protocol` | Decision frameworks with escalation paths | Safety protocols, compliance checklists |
| `reference` | Lookup tables and threshold definitions | Parameter ranges, regulatory limits |
| `troubleshooting` | Common issues and resolution steps | Error diagnosis, root cause patterns |

## Synthetic Narrative Generation

For solutions where the copilot should answer "what happened" questions using historical structured data, generate text narratives from DATA_MART tables.

### When to Use Synthetic Narratives

- Users ask temporal questions: "What happened last Tuesday?"
- Historical events/reports exist as structured rows, not text
- The copilot needs to contextualize data with natural language

### Pattern: SQL CONCAT to Search-Ready Text

Create a table or view that transforms structured records into narrative chunks:

```sql
CREATE OR REPLACE TABLE {DATABASE}.{SCHEMA}.{ENTITY}_NARRATIVES AS
SELECT
    UUID_STRING() AS CHUNK_ID,
    ENTITY_NAME,
    ENTITY_DATE,
    CONCAT(
        'Report for ', ENTITY_NAME, ' on ', TO_CHAR(ENTITY_DATE, 'YYYY-MM-DD'), '.\n\n',
        'Summary: ',
        COALESCE(DESCRIPTION, 'No description available.'), '\n\n',
        'Key Metrics:\n',
        '- ', METRIC_A_LABEL, ': ', ROUND(METRIC_A, 2), ' ', METRIC_A_UNIT, '\n',
        '- ', METRIC_B_LABEL, ': ', ROUND(METRIC_B, 2), ' ', METRIC_B_UNIT, '\n',
        CASE WHEN HAS_ANOMALY THEN
            '\nALERT: ' || ANOMALY_TYPE || ' detected. ' || ANOMALY_DESCRIPTION
        ELSE '' END
    ) AS CHUNK,
    CASE WHEN HAS_ANOMALY THEN 'incident_report' ELSE 'status_report' END AS DOCUMENT_TYPE
FROM {DATA_MART}.{ENTITY}_DAILY_SUMMARY
WHERE ENTITY_DATE >= DATEADD(year, -2, CURRENT_DATE);

ALTER TABLE {DATABASE}.{SCHEMA}.{ENTITY}_NARRATIVES SET CHANGE_TRACKING = TRUE;
```

The `isf-cortex-search` skill then creates a search service over this table.

### Narrative Quality Tips

| Tip | Example |
|-----|---------|
| Include entity name in every chunk | "Report for {name}..." not just "Report..." |
| Add temporal context | "on 2025-03-15" not "recently" |
| Use conditional text for anomalies | Only mention alerts when they exist |
| Include units with metrics | "42.5 units/hr" not "42.5" |
| Keep chunks self-contained | Each row should answer a question without needing other rows |

## Pre-Flight Checklist

- [ ] Content strategy reviewed (what types of docs, how many, what topics)
- [ ] Domain knowledge docs use consistent terminology from entity YAMLs
- [ ] Each document section is self-contained for search chunking
- [ ] Specific thresholds and numbers included (not vague descriptions)
- [ ] Document types defined for ATTRIBUTES-based search filtering
- [ ] Synthetic narrative SQL tested against DATA_MART views
- [ ] Narrative chunks include entity name, date, and relevant metrics
- [ ] All content is industry-agnostic in structure (parameterized from spec)

## Contract

**Inputs:**
- `isf-context.md` for industry, pain points, domain terminology (from `isf-spec-curation`)
- Entity YAMLs for domain vocabulary (from `isf-data-architecture`)
- DATA_MART views (from `isf-data-architecture`) — if generating synthetic narratives

**Outputs:**
- `docs/*.md` — Domain knowledge documents (consumed by `isf-cortex-search`)
- Search-prep views/tables DDL — Synthetic narrative SQL (consumed by `isf-cortex-search`)

## Next Skill

After domain knowledge and narratives are created:

**Continue to** `../isf-cortex-search/SKILL.md` to create Cortex Search services over the documents and narrative tables.

If running the full ISF pipeline via `isf-solution-engine`, return to the engine for Phase 4b (Cortex Search).

## Companion Skills

| Skill | Relationship |
|-------|-------------|
| `isf-spec-curation` | Provides industry, pain points, and domain terminology |
| `isf-data-architecture` | Provides entity YAMLs and DATA_MART views |
| `isf-cortex-search` | Indexes the docs and narratives this skill produces |
| `isf-cortex-agent` | Agent uses the search services to answer domain questions |
| `isf-solution-package` | May reference docs for presentation narrative |

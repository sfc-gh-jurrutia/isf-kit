---
name: isf-data-architecture
description: >
  Design layered data architectures for Snowflake solutions using the
  RAW → ATOMIC → DATA_MART pattern. Reads from isf-context.md data model
  and generates schemachange migrations. Use when: (1) designing database
  schemas, (2) creating data flow from source to consumption, (3) implementing
  CDC or staging patterns, (4) choosing transformation approaches, or
  (5) generating migration DDL from entity definitions.
parent_skill: isf-solution-engine
---

# ISF Data Architecture

## Quick Start

### What Does This Skill Do?

Takes the `architecture.data_model` section from a curated `isf-context.md` and produces:
1. A layered schema design (RAW → ATOMIC → DATA_MART)
2. schemachange migration files for `src/database/migrations/`
3. Entity DDL based on industry-specific reference definitions

### Input

- `isf-context.md` with `architecture.data_model` populated (source systems, transformation layers)
- Industry identified in `isf_context.industry` (determines which entity references to load)

### Architecture Overview

All ISF solutions follow a layered architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                     PROJECT_DATABASE                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐     ┌──────────┐     ┌─────────────────────┐      │
│  │   RAW    │────▶│  ATOMIC  │────▶│    {DATA_MART}      │      │
│  │          │     │          │     │  (project-named)    │      │
│  │ Landing  │     │Enterprise│     │                     │      │
│  │ + CDC    │     │ Relational│    │  Consumer-Facing    │      │
│  └──────────┘     └──────────┘     └─────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

### Layer Summary

| Layer | Schema | Also Called | Purpose | Required |
|-------|--------|------------|---------|----------|
| Landing | `RAW` | Bronze | External data in original format | Yes |
| Canonical | `ATOMIC` | Silver | Enterprise relational model, normalized | Yes |
| Processing | `DATA_ENGINEERING`, `DATA_SCIENCE` | — | Complex intermediate processing | No |
| ML | `ML` | — | Model explainability (SHAP, PDP, calibration, metrics) | If ML notebooks used |
| Consumption | `{DATA_MART}` (project-named) | Gold | Consumer-facing data products | Yes |
| Cortex | In `src/database/cortex/` | — | Agent DDL, semantic model, search service | If Cortex features used |

The ISF naming convention (RAW/ATOMIC/DATA_MART) is preferred for clarity. If the spec or team uses medallion terminology (bronze/silver/gold), map it accordingly.

### Why Always Include RAW

Even for simple projects:
1. **Source Realism** — shows what actual source systems look like
2. **Lineage Visibility** — documents path from source to consumption
3. **Replay** — allows reprocessing if transformation logic changes
4. **Auditing** — maintains original data for compliance

## References

| File | Purpose | When Loaded |
|------|---------|-------------|
| `references/entities/_core.yaml` | Shared entities (CUSTOMER, TRANSACTION, PRODUCT, ADDRESS, EVENT) | Always |
| `references/entities/{industry}.yaml` | Industry-specific entities and column extensions | Based on isf_context.industry |
| `references/data-layer-patterns.md` | DDL patterns for RAW, ATOMIC, DATA_MART layers + SCD2 MERGE | Step 3: Design Layers |
| `references/transformation-patterns.md` | Decision framework: views vs dynamic tables vs streams | Step 3: Choosing transformation approach |
| `references/ml-schema-patterns.md` | ML explainability schema (SHAP, PDP, calibration, metrics tables) | When solution includes ML notebooks |
| `assets/migration_template.sql` | Boilerplate for schemachange migration files | Step 4: Generate Migrations (copied into project) |

## Core Workflow

```
1. READ SPEC
   └── Load isf-context.md architecture.data_model section
   └── Identify industry from isf_context.industry

2. LOAD ENTITY REFERENCES
   └── Load references/entities/_core.yaml (always)
   └── Load references/entities/{industry}.yaml (if exists)
   └── For each entity needed by the spec, read its definition

   ⚠️ STOP: Confirm entity selection and layer mapping with user before designing DDL.

3. DESIGN LAYERS
   └── RAW: Map source_systems to landing tables (VARCHAR types, metadata columns)
   │   └── If source schema is unknown/variable, use VARIANT flexible landing pattern
   └── ATOMIC: Use entity references for normalized tables (proper types, SCD, audit)
   └── DATA_MART: Design consumption views/tables for persona queries
   │   └── If Cortex Search needed, include search-prep views (CONCAT → SEARCH_TEXT)
   └── ML: If spec includes ML notebooks, **Load** `references/ml-schema-patterns.md`
       └── Generate explainability tables (SHAP, PDP, calibration, metrics)

4. GENERATE MIGRATIONS
   └── V1.0.0__initial_schemas.sql (database, schemas, roles)
   └── V1.1.0__raw_tables.sql (RAW layer)
   └── V1.2.0__atomic_tables.sql (ATOMIC layer)
   └── V1.3.0__data_mart_views.sql (DATA_MART layer + search-prep views)
   └── V1.4.0__cortex_objects.sql (if Cortex features)
   └── V1.5.0__ml_schema.sql (if ML notebooks — from ml-schema-patterns.md)

   ⚠️ STOP: Present generated migrations for review before writing files.

5. OUTPUT
   └── Migration files in src/database/migrations/
   └── Cortex objects in src/database/cortex/ (if applicable)
```

## Entity Reference System

Entity definitions live in `references/entities/` as YAML files. The skill selectively loads only the files relevant to the spec's industry.

### How It Works

1. `_core.yaml` defines shared entities (CUSTOMER, TRANSACTION, PRODUCT, etc.) used across all industries
2. Industry files (e.g., `manufacturing.yaml`) extend core entities with industry-specific columns and add new industry-specific entities
3. The `extends` pattern eliminates redundancy — industry files only contain what's unique

### Loading Pattern

```
For each table in isf-context.data_model.transformation_layers:
  Load references/entities/_core.yaml
  If industry file exists: Load references/entities/{industry}.yaml
  Match spec entities to reference definitions
  Generate migration DDL using reference columns and types
```

### Available Entity References

| File | Industry | ISF Code | Key Entities |
|------|----------|----------|-------------|
| `_core.yaml` | All | — | CUSTOMER, TRANSACTION, PRODUCT, ADDRESS |
| `aerospace.yaml` | Aerospace | MFG | FLIGHT_SEGMENT, BOOKING, AIRCRAFT |
| `manufacturing.yaml` | Manufacturing | MFG | WORK_ORDER, PRODUCTION_RUN, EQUIPMENT |
| `healthcare.yaml` | Healthcare | HLS | CLAIM, DIAGNOSIS, ENCOUNTER, PROVIDER |
| `retail.yaml` | Retail | RET | ORDER, CART, INVENTORY, STORE |
| `financial.yaml` | Financial Services | FSI | ACCOUNT, POSITION, TRADE, PORTFOLIO |
| `media.yaml` | Media | MED | CONTENT, SESSION, SUBSCRIPTION |
| `telecom.yaml` | Telecom | TEL | SUBSCRIBER, USAGE_RECORD, NETWORK_EVENT |
| `energy.yaml` | Energy | MFG | ASSET_READING, OUTAGE, METER, WELL, DRILLING_PARAMETER, DRILLING_EVENT, DAILY_DRILLING_REPORT |
| `public_sector.yaml` | Public Sector | PUB | CASE, CONSTITUENT, SERVICE_REQUEST |

If a spec needs entities not in the references, the LLM generates them following the same conventions (types, metadata columns, naming).

## Data Layer Patterns

**Load** `references/data-layer-patterns.md` for full DDL patterns and SQL examples for each layer.

Quick summary of required metadata columns:

| Layer | Required Columns |
|-------|-----------------|
| RAW (staged files) | `_SOURCE_FILE_NAME`, `_SOURCE_FILE_ROW_NUMBER`, `_LOADED_TIMESTAMP` |
| RAW (CDC) | `_CDC_OPERATION`, `_CDC_TIMESTAMP`, `_CDC_SEQUENCE`, `_CDC_SOURCE_SYSTEM` |
| ATOMIC (all tables) | `CREATED_BY_USER`, `CREATED_TIMESTAMP`, `UPDATED_BY_USER`, `UPDATED_TIMESTAMP` |
| ATOMIC (SCD2) | `VALID_FROM_TIMESTAMP`, `VALID_TO_TIMESTAMP`, `IS_CURRENT_FLAG` |

The reference file covers:
- RAW patterns: staged files, CDC, API responses, naming conventions
- ATOMIC patterns: standard entity structure, Type 2 SCD MERGE
- DATA_MART patterns: denormalized views, aggregation tables, ML feature stores
- Optional intermediate schemas (DATA_ENGINEERING, DATA_SCIENCE, ML_PROCESSING)

## Cortex Objects

When the spec includes Cortex features, generate objects in `src/database/cortex/`:

| Object | File | When |
|--------|------|------|
| Agent DDL | `cortex/agent.sql` | Spec includes Cortex Agent |
| Semantic Model | `cortex/semantic_model.yaml` | Spec includes Cortex Analyst |
| Search Service | `cortex/search_service.sql` | Spec includes Cortex Search |

These are separate from migration files — they're deployed after the data layer is populated.

## Transformation Approaches

**Load** `references/transformation-patterns.md` for the full decision framework with SQL examples.

Quick decision guide:

| Use When | Approach |
|----------|----------|
| Simple transforms, real-time accuracy | **Views** |
| Expensive aggregations, predictable queries | **Materialized Views** |
| Multi-step pipelines, declarative preferred | **Dynamic Tables** |
| Complex logic, conditional processing | **Stored Procedures** |
| CDC processing, near-real-time | **Streams + Tasks** |

## DATA_MART Naming

| Project Type | Example Schema |
|--------------|----------------|
| Yield Optimization | `YO_ANALYTICS` |
| Supply Chain Risk | `SCR_ANALYTICS` |
| Customer 360 | `CUSTOMER_360` |
| Predictive Maintenance | `PREDICTIVE_MAINT` |
| Fraud Detection | `FRAUD_DETECTION` |

## Anti-Patterns

| Anti-Pattern | Why | Correct Approach |
|--------------|-----|------------------|
| Transforming in RAW | Loses original data fidelity | Transform in ATOMIC or later |
| Strict types in RAW | Causes load failures | Use VARCHAR, cast in ATOMIC |
| Skipping metadata columns | Loses lineage/audit info | Always include `_LOADED_TIMESTAMP` |
| Views in RAW | RAW is for persistence only | Views belong in ATOMIC or DATA_MART |
| Generic DATA_MART name | Not meaningful to consumers | Use project-specific names |
| No audit columns in ATOMIC | Loses change tracking | Always include `CREATED_*`, `UPDATED_*` |
| Skipping RAW layer | Loses source realism | Always create RAW |

## Migration Versioning

Follow schemachange conventions:

| Version | Purpose | Example |
|---------|---------|---------|
| `V1.0.0__` | Initial schemas, roles, grants | `V1.0.0__initial_schemas.sql` |
| `V1.1.0__` | RAW layer tables | `V1.1.0__raw_tables.sql` |
| `V1.2.0__` | ATOMIC layer tables | `V1.2.0__atomic_tables.sql` |
| `V1.3.0__` | DATA_MART views/tables | `V1.3.0__data_mart_views.sql` |
| `V1.4.0__` | Cortex objects | `V1.4.0__cortex_objects.sql` |

Migrations go in `src/database/migrations/` per the ISF project structure.

## Pre-Flight Checklist

- [ ] Entity references consulted for industry (`references/entities/`)
- [ ] RAW schema with realistic source representation
- [ ] RAW tables use VARCHAR for source fields (proper typing in ATOMIC)
- [ ] CDC tables include `_CDC_OPERATION`, `_CDC_TIMESTAMP` columns
- [ ] Audit columns on all ATOMIC tables (`CREATED_*`, `UPDATED_*`)
- [ ] Type 2 SCD implemented where history required
- [ ] DATA_MART schema named meaningfully for the data product
- [ ] Consumer-facing views optimized for persona query patterns
- [ ] Transformation approach matches complexity (simplest that works)
- [ ] Lineage traceable from RAW through DATA_MART
- [ ] Migration files follow schemachange versioning
- [ ] Cortex objects in `src/database/cortex/` if Cortex features used
- [ ] Search-prep views created in DATA_MART if Cortex Search is in spec
- [ ] ML schema generated from `references/ml-schema-patterns.md` if notebooks in spec
- [ ] VARIANT landing tables used for sources with unknown/wide schemas

## Entity Contribution

When a solution creates entities not in the reference library, save them back to the user's local copy.

### After Solution Completion

⚠️ STOP: If new entities were created, present them and ask the user before modifying reference files.

```
New entities created (not in reference library):
- CREW_ASSIGNMENT (6 columns)
- LOYALTY_REDEMPTION (8 columns)

Save to references/entities/{industry}.yaml? [Yes] [New file] [Skip]
```

**Current behavior**: Append new entity definitions to the local `references/entities/{industry}.yaml` file. If the entity extends a core entity with new columns, add them under `additional_columns` in the industry file. If it's a new entity, add it to the `entities` section following the same YAML schema (columns, types, relationships, generation rules).

**Planned (not yet implemented)**: Automated contribution back to the `isf-kit` repo via feature branch and PR. This requires git automation, branch naming conventions, and a review process — will be designed separately.

## Contract

**Inputs:**
- `isf-context.md` architecture.data_model section (from `isf-spec-curation`)
- Entity YAML references from `references/entities/` (built-in)

**Outputs:**
- `src/database/migrations/V1.*.sql` — schemachange migration files (consumed by `isf-deployment`)
- `src/database/cortex/*.sql` — Cortex object DDL stubs (consumed by `isf-cortex-*` skills)
- Entity definitions — Schema for synthetic data (consumed by `isf-data-generation`)

## Next Skill

After migrations are generated and reviewed:

**Continue to** `../isf-data-generation/SKILL.md` to generate synthetic seed data from the entity definitions.

If running the full ISF pipeline via `isf-solution-engine`, return to the engine for Phase 3b.

### Downstream Skill Reference

| Output | Consumed By |
|--------|------------|
| Migration files | `isf-deployment` (runs schemachange) |
| Entity definitions | `isf-data-generation` (creates synthetic data matching schema) |
| Cortex objects | `isf-cortex-agent`, `isf-cortex-analyst`, `isf-cortex-search` |
| DATA_MART views | `isf-solution-react-app` (API queries these for frontend) |

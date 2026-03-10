---
name: isf-data-pipeline
description: >
  Generate data transformation pipelines for Snowflake solutions. Creates
  loading scripts (COPY INTO, Snowpipe), transformation SQL (MERGE, Dynamic
  Tables, stored procedures), and orchestration objects (Tasks, Streams, DAGs)
  that move data through RAW → ATOMIC → DATA_MART layers. Use when:
  (1) building ELT pipelines, (2) generating transformation SQL,
  (3) creating Snowflake Task DAGs, (4) implementing CDC with Streams,
  (5) writing incremental load procedures, or (6) setting up Snowpipe.
  Triggers: data pipeline, transformation, ELT, ETL, tasks, streams,
  snowpipe, MERGE, incremental load, CDC, data loading, orchestration,
  dynamic table, data movement, pipeline orchestration.
parent_skill: isf-solution-engine
---

# ISF Data Pipeline

## When to Use

Load this skill when building the data movement and transformation layer for a Snowflake solution. This includes generating COPY INTO statements, MERGE transformations, Dynamic Table definitions, Snowflake Task DAGs, Stream-based CDC, and stored procedures that move data through RAW → ATOMIC → DATA_MART.

Skip this skill when the DATA_MART layer uses only simple views over ATOMIC tables (the views are already created by `isf-data-architecture`).

## Prerequisites

- Migration files exist in `src/database/migrations/` (from `isf-data-architecture`)
- Entity YAML definitions available in `../isf-data-architecture/references/entities/`
- `isf-context.md` with `architecture.data_model` populated (from `isf-spec-curation`)
- Optional: `specs/{solution}/data-model-decisions.md` (from `isf-data-modeling`, if run)

## Workflow

### Step 1: Read Spec and Entity Definitions

**Goal:** Understand the data model, source systems, and transformation requirements.

**Actions:**

1. **Read** `isf-context.md` `architecture.data_model` section for source systems, layers, and transformation requirements
2. **Read** entity YAMLs from `../isf-data-architecture/references/entities/` for column definitions, types, and relationships
3. **Read** migration files from `src/database/migrations/` for table/view DDL
4. **Read** `specs/{solution}/data-model-decisions.md` if it exists (grain declarations, SCD types, fact table types from `isf-data-modeling`)

**Output:** Inventory of source-to-target mappings per entity

### Step 2: Design Loading Strategy

**Goal:** Determine how data enters the RAW layer from each source system.

**Actions:**

1. For each source system in `isf-context.md`, select a loading pattern:

| Source Type | Pattern | Reference |
|-------------|---------|-----------|
| Staged files (CSV, JSON, Parquet) | COPY INTO with file format | `references/loading-patterns.md` |
| Continuous file delivery | Snowpipe with auto-ingest | `references/loading-patterns.md` |
| External data (S3, GCS, Azure) | External table or external stage | `references/loading-patterns.md` |
| API responses | VARIANT landing table + extraction view | `../isf-data-architecture/references/data-layer-patterns.md` |

2. Generate file format objects, stage definitions, and COPY INTO statements

**Output:** Loading SQL in `src/database/transformations/loading/`

### Step 3: Generate Transformation SQL

**Goal:** Create the SQL that moves data from RAW → ATOMIC → DATA_MART.

**Load** `references/transformation-patterns.md` for MERGE, Dynamic Table, and procedure patterns.

**Actions:**

1. **RAW → ATOMIC** — For each entity, generate transformation SQL:
   - Type casting from VARCHAR RAW columns to proper ATOMIC types
   - Deduplication using `QUALIFY ROW_NUMBER() OVER (...)`
   - SCD Type 2 MERGE for dimensions (if SCD2 selected in modeling decisions)
   - Standard MERGE/INSERT for fact tables
   - CDC processing for stream-sourced entities

2. **ATOMIC → DATA_MART** — For each consumption target, select approach:

```
Is the query pattern simple (direct joins, filters)?
├── YES → VIEW (already created by isf-data-architecture)
└── NO  → Does it need near-real-time freshness?
    ├── YES → DYNAMIC TABLE (with target_lag)
    └── NO  → Is it a heavy aggregation?
        ├── YES → CTAS with scheduled refresh (stored procedure)
        └── NO  → MATERIALIZED VIEW
```

3. Generate stored procedures for complex multi-step transformations

**⚠️ MANDATORY CHECKPOINT**: Present generated transformation SQL for review before writing files.

**Output:** Transformation SQL in `src/database/transformations/`

### Step 4: Generate Orchestration

**Goal:** Create the Task DAGs, Streams, and monitoring that automate pipeline execution.

**Load** `references/orchestration-patterns.md` for Task DAG, Stream, and monitoring patterns.

**Actions:**

1. **Streams** — Create a stream for each RAW table that uses CDC:
   ```sql
   CREATE OR REPLACE STREAM raw_stream_{entity}
     ON TABLE RAW.{entity}
     APPEND_ONLY = {TRUE if insert-only source, FALSE if CDC};
   ```

2. **Task DAG** — Build a parent-child task tree:
   ```
   root_task (warehouse, schedule)
   ├── load_raw_{entity_1} (COPY INTO or stream consume)
   ├── load_raw_{entity_2}
   ├── transform_atomic_{entity_1} (MERGE, depends on load)
   ├── transform_atomic_{entity_2}
   └── refresh_data_mart (aggregation procedures, depends on all atomic)
   ```

3. **Monitoring** — Generate a validation query using `TASK_HISTORY()`:
   ```sql
   SELECT name, state, error_message, scheduled_time
   FROM TABLE(INFORMATION_SCHEMA.TASK_HISTORY(
     SCHEDULED_TIME_RANGE_START => DATEADD(HOUR, -24, CURRENT_TIMESTAMP())
   ))
   WHERE state = 'FAILED'
   ORDER BY scheduled_time DESC;
   ```

**⚠️ MANDATORY CHECKPOINT**: Review Task DAG structure and Stream definitions before writing files.

**Output:** Orchestration DDL in `src/database/orchestration/`

### Step 5: Output

**Goal:** Write all generated artifacts to the project.

**Actions:**

1. Write files to project directories:
   ```
   src/database/
   ├── transformations/
   │   ├── loading/
   │   │   ├── file_formats.sql
   │   │   ├── stages.sql
   │   │   └── copy_into_{entity}.sql
   │   ├── raw_to_atomic/
   │   │   ├── transform_{entity}.sql
   │   │   └── scd2_{dimension}.sql
   │   └── atomic_to_mart/
   │       ├── dynamic_table_{target}.sql
   │       └── refresh_{aggregation}.sql
   └── orchestration/
       ├── streams.sql
       ├── task_dag.sql
       └── monitoring.sql
   ```

2. Verify all referenced objects (tables, views) exist in migration files

**Output:** Complete pipeline artifacts ready for deployment

## Stopping Points

- ✋ After Step 3: Review transformation SQL before writing files
- ✋ After Step 4: Review Task DAG and Stream definitions

**Resume rule:** Upon user approval, proceed directly to next step without re-asking.

## Contract

**Inputs:**
- `isf-context.md` `architecture.data_model` section (from `isf-spec-curation`)
- Entity YAML references from `../isf-data-architecture/references/entities/` (built-in)
- Migration files from `src/database/migrations/` (from `isf-data-architecture`)
- `specs/{solution}/data-model-decisions.md` (from `isf-data-modeling`, if run)

**Outputs:**
- `src/database/transformations/loading/*.sql` — File formats, stages, COPY INTO (consumed by `isf-deployment`)
- `src/database/transformations/raw_to_atomic/*.sql` — MERGE/INSERT transforms (consumed by `isf-deployment`)
- `src/database/transformations/atomic_to_mart/*.sql` — Dynamic Tables, procedures (consumed by `isf-deployment`)
- `src/database/orchestration/*.sql` — Streams, Task DAGs, monitoring (consumed by `isf-deployment`)

## Output

```
src/database/
├── transformations/
│   ├── loading/           # COPY INTO, file formats, stages
│   ├── raw_to_atomic/     # MERGE, SCD2, CDC transforms
│   └── atomic_to_mart/    # Dynamic Tables, CTAS, procedures
└── orchestration/
    ├── streams.sql        # Stream definitions for CDC
    ├── task_dag.sql       # Parent-child Task DAG
    └── monitoring.sql     # TASK_HISTORY validation queries
```

## References

| File | Purpose | When Loaded |
|------|---------|-------------|
| `references/loading-patterns.md` | COPY INTO variants, Snowpipe, external tables, file formats, stages | When designing loading strategy (Step 2) |
| `references/transformation-patterns.md` | MERGE patterns, Dynamic Tables, stored procedures, type casting | When generating transforms (Step 3) |
| `references/orchestration-patterns.md` | Task DAGs, Streams, TASK_HISTORY monitoring, scheduling | When generating orchestration (Step 4) |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| MERGE produces duplicate rows | Check the ON clause matches the grain; add QUALIFY dedup in the USING subquery |
| Dynamic Table lag too high | Reduce `TARGET_LAG` or switch to Stream + Task for tighter control |
| Task DAG not executing | Verify root task is RESUMED (`ALTER TASK root_task RESUME`); child tasks resume automatically |
| Stream returns no rows | Stream is consumed on read; check if another query already consumed it. Use `SYSTEM$STREAM_HAS_DATA()` |
| COPY INTO skips files | Files already loaded are tracked; use `FORCE = TRUE` to reload, or `PURGE = TRUE` to clean up |
| Type casting errors (RAW → ATOMIC) | RAW columns are VARCHAR; use `TRY_CAST()` or `TRY_TO_NUMBER()` to handle malformed data |
| Snowpipe not triggering | Verify event notification is configured on the stage; check `PIPE_STATUS()` |

## Next Skill

After pipeline artifacts are generated and reviewed:

**Continue to** `../isf-data-generation/SKILL.md` to generate synthetic seed data (if not already run in parallel).

If running the full ISF pipeline via `isf-solution-engine`, return to the engine for Phase 3d (or Phase 4 if data generation already completed in parallel).

### Downstream Skill Reference

| Output | Consumed By |
|--------|------------|
| Loading SQL (COPY INTO, stages) | `isf-deployment` (runs during data load phase) |
| Transformation SQL (MERGE, procedures) | `isf-deployment` (runs after seed data load) |
| Orchestration DDL (Tasks, Streams) | `isf-deployment` (created after transforms are verified) |
| Dynamic Table definitions | `isf-cortex-analyst` (may reference as data sources), `isf-solution-react-app` (API queries) |

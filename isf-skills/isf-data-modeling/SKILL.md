---
name: isf-data-modeling
description: >
  Dimensional data modeling skill for designing fact and dimension tables using
  Kimball methodology. Covers star schemas, fact table types (transaction,
  periodic snapshot, accumulating snapshot, factless), dimension types (SCD
  Types 0-7, junk, degenerate, role-playing, conformed), grain declaration,
  and Snowflake SQL implementation patterns. Use when: designing data warehouse
  schemas, creating fact or dimension tables, choosing SCD strategies, writing
  cumulative pipelines, defining grain, building star schemas, or reviewing
  data models. Triggers: data modeling, dimensional modeling, star schema,
  fact table, dimension table, SCD, slowly changing dimension, grain,
  data warehouse, data mart, kimball, cumulative table, snapshot.
parent_skill: isf-solution-engine
---

# ISF Data Modeling

## When to Use

Load this skill when designing, building, or reviewing dimensional data models in Snowflake. This includes schema design, fact/dimension table DDL, SCD strategy selection, cumulative pipeline authoring, and data model reviews.

## Prerequisites

- `isf-context.md` exists with `architecture.data_model` section populated (from `isf-spec-curation`)
- Industry identified in `isf_context.industry`

## Kimball Four-Step Design Process

Every dimensional model starts here. Do not skip steps.

| Step | Action | Output |
|------|--------|--------|
| 1. Select the business process | Identify the operational activity to model (orders, sessions, claims) | Process name |
| 2. Declare the grain | State the single fact each row represents -- the most atomic level | Grain statement (e.g., "one row per order line item per day") |
| 3. Identify the dimensions | List the descriptive context columns: who, what, where, when, why, how | Dimension list |
| 4. Identify the facts | List the numeric measurements at the declared grain | Fact/measure list |

**Grain is the contract.** Every design decision flows from it. If you cannot state the grain in one sentence, the model is not ready.

## Fact Table Decision Tree

Choose the fact table type based on the nature of the business process:

```
Is there a discrete event/transaction?
├── YES → Is the measurement at a point in time?
│   ├── YES → TRANSACTION fact table
│   │         (one row per event: orders, clicks, payments)
│   └── NO  → Does the process have a definite start and end with milestones?
│       ├── YES → ACCUMULATING SNAPSHOT fact table
│       │         (one row per lifecycle: order fulfillment, claims processing)
│       └── NO  → PERIODIC SNAPSHOT fact table
│                 (one row per entity per period: daily balances, monthly inventory)
└── NO  → Is it tracking coverage or eligibility?
    └── YES → FACTLESS fact table
              (one row per relationship/event: student-course enrollment, promotion coverage)
```

### Fact Additivity Quick Reference

| Type | Definition | Example | Can SUM across all dims? |
|------|-----------|---------|--------------------------|
| Additive | Fully summable | revenue, quantity, cost | Yes |
| Semi-additive | Summable across some dims, not time | account_balance, inventory_count | No -- use AVG/snapshot for time |
| Non-additive | Never summable | unit_price, ratio, percentage | No -- use weighted avg or recalculate |

## Dimension Decision Tree

### SCD Type Selection

```
Does this attribute change over time?
├── NO  → TYPE 0 (retain original forever)
└── YES → Do you need the history?
    ├── NO  → TYPE 1 (overwrite in place)
    └── YES → How much history?
        ├── Current + previous only → TYPE 3 (add previous_value column)
        └── Full history → TYPE 2 (new row per change, with effective_from/to)
            └── Also need current-value shortcut? → TYPE 6 (Type 2 + Type 1 column)
```

### Dimension Type Selection

| Pattern | When to Use | Snowflake Notes |
|---------|------------|-----------------|
| **Conformed** | Dimension shared across multiple fact tables (customer, date, product) | Single source table, referenced by all facts |
| **Degenerate** | Dimension key with no separate table (order_number, invoice_id) | Store directly as column in fact table |
| **Junk** | Low-cardinality flags/indicators (is_rush, payment_type, status_code) | Combine into one dim to avoid clutter |
| **Role-playing** | Same dimension used multiple ways (order_date, ship_date, due_date) | Create views: `dim_date_order`, `dim_date_ship` |
| **Outrigger** | Sub-dimension joined to another dimension, not the fact | Use sparingly -- often better to denormalize |
| **Mini-dimension** | Rapidly changing attributes split from a large SCD2 dimension | Separate table with its own surrogate key |

## Core Snowflake SQL Patterns

### Date Spine Generator

```sql
SELECT DATEADD(DAY, SEQ4(), '2020-01-01'::DATE) AS date_day
FROM TABLE(GENERATOR(ROWCOUNT => 3650))
```

### Cumulative Table Load (FULL OUTER JOIN)

```sql
MERGE INTO cumulative_target t
USING (
  WITH yesterday AS (
    SELECT * FROM cumulative_target
    WHERE as_of_date = :current_date - 1
  ),
  today AS (
    SELECT entity_id,
           ARRAY_AGG(OBJECT_CONSTRUCT(*)) AS today_records
    FROM source_events
    WHERE event_date = :current_date
    GROUP BY entity_id
  )
  SELECT
    COALESCE(y.entity_id, t.entity_id)        AS entity_id,
    ARRAY_CAT(
      COALESCE(y.history_array, ARRAY_CONSTRUCT()),
      COALESCE(t.today_records, ARRAY_CONSTRUCT())
    )                                           AS history_array,
    :current_date                               AS as_of_date
  FROM yesterday y
  FULL OUTER JOIN today t ON y.entity_id = t.entity_id
) s
ON t.entity_id = s.entity_id AND t.as_of_date = s.as_of_date
WHEN MATCHED THEN UPDATE SET history_array = s.history_array
WHEN NOT MATCHED THEN INSERT (entity_id, history_array, as_of_date)
  VALUES (s.entity_id, s.history_array, s.as_of_date);
```

### SCD Type 2 Incremental Load

```sql
MERGE INTO dim_target t
USING (
  SELECT
    source_key,
    attr_1,
    attr_2,
    :load_ts AS effective_from
  FROM staging_source
  QUALIFY ROW_NUMBER() OVER (PARTITION BY source_key ORDER BY updated_at DESC) = 1
) s
ON t.source_key = s.source_key AND t.is_current = TRUE
WHEN MATCHED AND (t.attr_1 != s.attr_1 OR t.attr_2 != s.attr_2) THEN
  UPDATE SET is_current = FALSE, effective_to = s.effective_from
WHEN NOT MATCHED THEN
  INSERT (surrogate_key, source_key, attr_1, attr_2, effective_from, effective_to, is_current)
  VALUES (dim_target_seq.NEXTVAL, s.source_key, s.attr_1, s.attr_2, s.effective_from, '9999-12-31', TRUE);

-- Insert new current rows for changed records
INSERT INTO dim_target (surrogate_key, source_key, attr_1, attr_2, effective_from, effective_to, is_current)
SELECT dim_target_seq.NEXTVAL, s.source_key, s.attr_1, s.attr_2, :load_ts, '9999-12-31', TRUE
FROM staging_source s
JOIN dim_target t ON s.source_key = t.source_key
WHERE t.is_current = FALSE
  AND t.effective_to = :load_ts
QUALIFY ROW_NUMBER() OVER (PARTITION BY s.source_key ORDER BY s.updated_at DESC) = 1;
```

### Fact Table MERGE Load

```sql
MERGE INTO fct_orders t
USING (
  SELECT
    order_id,
    d_customer.surrogate_key AS customer_key,
    d_date.date_key,
    quantity,
    unit_price,
    quantity * unit_price AS total_amount
  FROM staging_orders s
  JOIN dim_customer d_customer
    ON s.customer_id = d_customer.source_key AND d_customer.is_current = TRUE
  JOIN dim_date d_date
    ON s.order_date = d_date.date_day
) s
ON t.order_id = s.order_id
WHEN NOT MATCHED THEN
  INSERT (order_id, customer_key, date_key, quantity, unit_price, total_amount)
  VALUES (s.order_id, s.customer_key, s.date_key, s.quantity, s.unit_price, s.total_amount);
```

### Deduplication (QUALIFY)

```sql
SELECT *
FROM raw_events
QUALIFY ROW_NUMBER() OVER (
  PARTITION BY event_id
  ORDER BY loaded_at DESC
) = 1
```

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| **Centipede fact table** | Too many foreign keys (>20 dims) dilute the grain | Verify grain; split into separate fact tables |
| **Snowflaked dimensions** | Normalizing dims into sub-tables kills query performance | Denormalize into flat dimension tables |
| **Fact-to-fact joins** | Direct joins between fact tables produce wrong results | Join through conformed dimensions, or use multi-pass SQL |
| **Missing grain statement** | Ambiguous rows lead to double-counting | Always declare and document grain before DDL |
| **Overloading SCD Type 2** | Tracking every attribute change creates row explosion | Move volatile attributes to a mini-dimension |
| **Surrogate key skipped** | Using natural keys couples your model to source systems | Always add a surrogate key to dimensions |
| **NULL dimension keys** | NULLs break joins and GROUP BY | Use a default "Unknown" dimension row (surrogate_key = -1) |

## Naming Conventions

| Prefix | Object Type | Example |
|--------|------------|---------|
| `fct_` | Fact table | `fct_orders`, `fct_page_views` |
| `dim_` | Dimension table | `dim_customer`, `dim_date`, `dim_product` |
| `stg_` | Staging table (raw source copy) | `stg_orders`, `stg_events` |
| `int_` | Intermediate transformation | `int_orders_deduped`, `int_events_sessionized` |
| `bridge_` | Bridge table (multi-valued dims) | `bridge_patient_diagnosis` |
| `_scd` | SCD-tracked dimension | `dim_customer_scd` |
| `_snapshot` | Periodic snapshot fact | `fct_inventory_snapshot` |
| `_accumulated` | Accumulating snapshot fact | `fct_claim_accumulated` |

Column conventions:
- Surrogate keys: `<table>_key` (e.g., `customer_key`)
- Natural/source keys: `<entity>_id` (e.g., `customer_id`)
- SCD columns: `effective_from`, `effective_to`, `is_current`
- Audit columns: `loaded_at`, `updated_at`, `source_system`

## Stopping Points

- **After grain declaration**: confirm grain statement with user before writing DDL
- **After SCD type selection**: confirm strategy before implementing dimension load

## Contract

**Inputs:**
- `isf-context.md` `architecture.data_model` section (from `isf-spec-curation`)
- Entity YAML references from `../isf-data-architecture/references/entities/` (if available)

**Outputs:**
- Grain declarations per business process
- Fact table type selections (transaction, periodic snapshot, accumulating snapshot, factless)
- SCD type selections per dimension
- Naming convention assignments (`fct_`, `dim_`, `stg_`, `int_` prefixes)
- Design documented in `specs/{solution}/data-model-decisions.md`

## References

| File | Purpose | When Loaded |
|------|---------|-------------|
| `references/fact-table-patterns.md` | All fact table types with full Snowflake SQL examples | When designing fact tables |
| `references/dimension-patterns.md` | SCD Types 0-7, dimension varieties with Snowflake SQL | When designing dimensions |
| `references/implementation-recipes.md` | End-to-end patterns: cumulative tables, date bitmaps, array metrics | When building pipelines |
| `references/kimball-technique-index.md` | Full ~80 Kimball technique taxonomy | When researching patterns or reviewing models |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Cannot determine grain | The business process is too broad; narrow to a single event type and restart Step 2 |
| Too many dimensions (>20) | Likely a centipede fact table; split into multiple fact tables with different grains |
| SCD type unclear | Default to Type 1 (overwrite) if stakeholders don't need history; escalate to Type 2 only when history is required |
| Fact additivity confusion | Check the Fact Additivity Quick Reference; semi-additive facts (balances) need snapshot-based aggregation, not SUM |

## Next Skill

After modeling decisions are confirmed:

**Continue to** `../isf-data-architecture/SKILL.md` to generate the DDL migrations from the dimensional model design.

If running the full ISF pipeline via `isf-solution-engine`, return to the engine for Phase 3b.

### Downstream Skill Reference

| Output | Consumed By |
|--------|------------|
| Grain declarations | `isf-data-architecture` (table design), `isf-data-pipeline` (MERGE join keys) |
| Fact table types | `isf-data-pipeline` (load pattern selection: insert vs MERGE vs snapshot rebuild) |
| SCD type selections | `isf-data-architecture` (SCD columns in DDL), `isf-data-pipeline` (SCD2 MERGE patterns) |
| Naming conventions | `isf-data-architecture` (table/view names), `isf-data-pipeline` (procedure names) |

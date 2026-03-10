# Transformation Patterns

Loaded from SKILL.md when generating transformation SQL (Step 3).

This file contains **runnable SQL patterns** for transforming data between layers. For the decision framework on *when* to use each approach (views vs Dynamic Tables vs procedures), see `../isf-data-architecture/references/transformation-patterns.md`.

## RAW → ATOMIC: Type Casting + Deduplication

Every RAW table stores columns as VARCHAR. The first transformation step casts to proper types and deduplicates.

```sql
CREATE OR REPLACE VIEW ATOMIC.v_staged_{entity} AS
SELECT
  TRY_CAST(col_id AS NUMBER)         AS entity_id,
  TRY_CAST(col_name AS VARCHAR)      AS entity_name,
  TRY_TO_NUMBER(col_amount)          AS amount,
  TRY_TO_DATE(col_date, 'YYYY-MM-DD') AS event_date,
  TRY_TO_TIMESTAMP_NTZ(col_ts)       AS event_timestamp,
  _loaded_timestamp
FROM RAW.{entity}
QUALIFY ROW_NUMBER() OVER (
  PARTITION BY col_id
  ORDER BY _loaded_timestamp DESC
) = 1;
```

## RAW → ATOMIC: Full Load MERGE

For entities where the full dataset is replaced on each load:

```sql
MERGE INTO ATOMIC.{entity} t
USING ATOMIC.v_staged_{entity} s
ON t.entity_id = s.entity_id
WHEN MATCHED THEN UPDATE SET
  entity_name     = s.entity_name,
  amount          = s.amount,
  event_date      = s.event_date,
  updated_at      = CURRENT_TIMESTAMP()
WHEN NOT MATCHED THEN INSERT (
  entity_id, entity_name, amount, event_date, created_at, updated_at
) VALUES (
  s.entity_id, s.entity_name, s.amount, s.event_date,
  CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()
);
```

## RAW → ATOMIC: Incremental MERGE

For append-only sources where only new rows need processing:

```sql
MERGE INTO ATOMIC.{entity} t
USING (
  SELECT *
  FROM ATOMIC.v_staged_{entity}
  WHERE _loaded_timestamp > (
    SELECT COALESCE(MAX(updated_at), '1900-01-01') FROM ATOMIC.{entity}
  )
) s
ON t.entity_id = s.entity_id
WHEN MATCHED THEN UPDATE SET
  entity_name = s.entity_name,
  amount      = s.amount,
  updated_at  = CURRENT_TIMESTAMP()
WHEN NOT MATCHED THEN INSERT (
  entity_id, entity_name, amount, event_date, created_at, updated_at
) VALUES (
  s.entity_id, s.entity_name, s.amount, s.event_date,
  CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()
);
```

## RAW → ATOMIC: SCD Type 2 MERGE

For dimensions that require full change history:

```sql
-- Step 1: Expire changed records
MERGE INTO ATOMIC.dim_{entity} t
USING (
  SELECT
    entity_id   AS source_key,
    entity_name AS attr_1,
    category    AS attr_2,
    CURRENT_TIMESTAMP() AS effective_from
  FROM ATOMIC.v_staged_{entity}
) s
ON t.source_key = s.source_key AND t.is_current = TRUE
WHEN MATCHED AND (
  t.attr_1 != s.attr_1 OR t.attr_2 != s.attr_2
) THEN UPDATE SET
  is_current    = FALSE,
  effective_to  = s.effective_from,
  updated_at    = CURRENT_TIMESTAMP();

-- Step 2: Insert new current rows for changed + new records
INSERT INTO ATOMIC.dim_{entity} (
  surrogate_key, source_key, attr_1, attr_2,
  effective_from, effective_to, is_current, created_at, updated_at
)
SELECT
  dim_{entity}_seq.NEXTVAL,
  s.source_key,
  s.attr_1,
  s.attr_2,
  CURRENT_TIMESTAMP(),
  '9999-12-31'::TIMESTAMP_NTZ,
  TRUE,
  CURRENT_TIMESTAMP(),
  CURRENT_TIMESTAMP()
FROM ATOMIC.v_staged_{entity} s
LEFT JOIN ATOMIC.dim_{entity} t
  ON s.source_key = t.source_key AND t.is_current = TRUE
WHERE t.source_key IS NULL;
```

## RAW → ATOMIC: CDC via Stream

For stream-based change data capture:

```sql
-- Consume stream and MERGE into ATOMIC
MERGE INTO ATOMIC.{entity} t
USING (
  SELECT
    TRY_CAST(col_id AS NUMBER)    AS entity_id,
    TRY_CAST(col_name AS VARCHAR) AS entity_name,
    METADATA$ACTION                AS cdc_action,
    METADATA$ISUPDATE              AS is_update
  FROM RAW.stream_{entity}
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY col_id
    ORDER BY _loaded_timestamp DESC
  ) = 1
) s
ON t.entity_id = s.entity_id
WHEN MATCHED AND s.cdc_action = 'DELETE' AND s.is_update = FALSE THEN DELETE
WHEN MATCHED THEN UPDATE SET
  entity_name = s.entity_name,
  updated_at  = CURRENT_TIMESTAMP()
WHEN NOT MATCHED AND s.cdc_action = 'INSERT' THEN INSERT (
  entity_id, entity_name, created_at, updated_at
) VALUES (
  s.entity_id, s.entity_name, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()
);
```

## ATOMIC → DATA_MART: Dynamic Table

For near-real-time materialized aggregations:

```sql
CREATE OR REPLACE DYNAMIC TABLE DATA_MART.{target_name}
  TARGET_LAG = '10 minutes'
  WAREHOUSE = TRANSFORM_WH
AS
SELECT
  d.dimension_name,
  DATE_TRUNC('DAY', f.event_timestamp)  AS event_date,
  COUNT(*)                               AS event_count,
  SUM(f.amount)                          AS total_amount,
  AVG(f.amount)                          AS avg_amount
FROM ATOMIC.fct_{entity} f
JOIN ATOMIC.dim_{dimension} d
  ON f.dimension_key = d.surrogate_key AND d.is_current = TRUE
GROUP BY 1, 2;
```

## ATOMIC → DATA_MART: Stored Procedure (Heavy Aggregation)

For complex multi-step transformations scheduled via Task:

```sql
CREATE OR REPLACE PROCEDURE DATA_MART.sp_refresh_{target}()
RETURNS VARCHAR
LANGUAGE SQL
AS
$$
BEGIN
  -- Truncate and reload
  TRUNCATE TABLE DATA_MART.{target_name};

  INSERT INTO DATA_MART.{target_name}
  SELECT
    d.dimension_name,
    DATE_TRUNC('MONTH', f.event_date)   AS period,
    COUNT(DISTINCT f.entity_id)         AS unique_entities,
    SUM(f.amount)                       AS total_amount,
    SUM(f.amount) / NULLIF(COUNT(DISTINCT f.entity_id), 0) AS amount_per_entity
  FROM ATOMIC.fct_{entity} f
  JOIN ATOMIC.dim_{dimension} d
    ON f.dimension_key = d.surrogate_key AND d.is_current = TRUE
  GROUP BY 1, 2;

  RETURN 'Refreshed ' || (SELECT COUNT(*) FROM DATA_MART.{target_name}) || ' rows';
END;
$$;
```

## ATOMIC → DATA_MART: Feature Store Population

For ML feature tables consumed by `isf-ml-models`:

```sql
CREATE OR REPLACE PROCEDURE DATA_MART.sp_refresh_features_{entity}()
RETURNS VARCHAR
LANGUAGE SQL
AS
$$
BEGIN
  TRUNCATE TABLE DATA_MART.feature_{entity};

  INSERT INTO DATA_MART.feature_{entity}
  SELECT
    f.entity_id,
    -- Recency
    DATEDIFF(DAY, MAX(f.event_date), CURRENT_DATE()) AS days_since_last_event,
    -- Frequency
    COUNT(*)                                          AS total_events_90d,
    COUNT(DISTINCT DATE_TRUNC('WEEK', f.event_date))  AS active_weeks_90d,
    -- Monetary
    SUM(f.amount)                                     AS total_amount_90d,
    AVG(f.amount)                                     AS avg_amount_90d,
    -- Trend
    SUM(CASE WHEN f.event_date >= DATEADD(DAY, -30, CURRENT_DATE()) THEN f.amount ELSE 0 END)
      / NULLIF(SUM(CASE WHEN f.event_date < DATEADD(DAY, -30, CURRENT_DATE())
                         AND f.event_date >= DATEADD(DAY, -90, CURRENT_DATE()) THEN f.amount ELSE 0 END), 0)
                                                      AS amount_trend_ratio
  FROM ATOMIC.fct_{entity} f
  WHERE f.event_date >= DATEADD(DAY, -90, CURRENT_DATE())
  GROUP BY f.entity_id;

  RETURN 'Refreshed ' || (SELECT COUNT(*) FROM DATA_MART.feature_{entity}) || ' rows';
END;
$$;
```

## Idempotent Load Pattern

Wrap transformation procedures to be safe for reruns:

```sql
CREATE OR REPLACE PROCEDURE DATA_MART.sp_idempotent_load_{entity}(load_date DATE)
RETURNS VARCHAR
LANGUAGE SQL
AS
$$
BEGIN
  -- Delete any existing data for this load date
  DELETE FROM ATOMIC.fct_{entity}
  WHERE event_date = :load_date;

  -- Insert fresh data
  INSERT INTO ATOMIC.fct_{entity}
  SELECT *
  FROM ATOMIC.v_staged_{entity}
  WHERE event_date = :load_date;

  RETURN 'Loaded ' || (SELECT COUNT(*) FROM ATOMIC.fct_{entity} WHERE event_date = :load_date) || ' rows for ' || :load_date;
END;
$$;
```

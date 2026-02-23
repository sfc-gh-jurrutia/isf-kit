# Transformation Approaches

> Load during Step 2 (Generate Specification) and Step 7 (Implement) when selecting and implementing data transformation strategies.

## Decision Tree

```
                    Transformation Need
                           │
                    Real-time required?
                     ╱            ╲
                   Yes              No
                    │                │
             Streams + Tasks    Complex multi-step?
                                 ╱            ╲
                               Yes              No
                                │                │
                        Declarative OK?   Materialization needed?
                         ╱         ╲         ╱            ╲
                       Yes          No     Yes              No
                        │            │      │                │
                  Dynamic Tables  Stored  Materialized    Standard
                                Procedures   Views         Views
```

## Comparison Table

| Approach | Use When | Pros | Cons |
|----------|----------|------|------|
| **Standard Views** | Simple transforms, always need latest data | Zero storage cost, always current, easy to maintain | Re-computes every query, slow for complex logic |
| **Materialized Views** | Expensive aggregations, predictable query patterns | Auto-maintained by Snowflake, fast reads | Limited SQL subset, storage cost, refresh lag |
| **Dynamic Tables** | Multi-step pipelines, declarative preferred | Declarative DAG, auto-refresh, incremental | TARGET_LAG latency, limited to SELECT-based logic |
| **Stored Procedures** | Complex business logic, conditional processing, CDC merges | Full SQL/JS/Python power, conditional branching | Imperative maintenance, manual scheduling |
| **Streams + Tasks** | CDC processing, near-real-time event reactions | True CDC capture, event-driven, efficient | Complex setup, ordering concerns, monitoring overhead |

## SQL Examples

### 1. Standard Views

```sql
CREATE OR REPLACE VIEW DATA_MART.CURRENT_CUSTOMERS AS
SELECT
    C.CUSTOMER_ID,
    C.CUSTOMER_NAME,
    C.EMAIL,
    C.STATUS,
    C.CREATED_TIMESTAMP
FROM ATOMIC.CUSTOMER C
WHERE C.IS_CURRENT_FLAG = TRUE;
```

### 2. Materialized Views

```sql
CREATE OR REPLACE MATERIALIZED VIEW DATA_MART.DAILY_PRODUCTION_SUMMARY AS
SELECT
    DATE_TRUNC('DAY', PR.PRODUCTION_DATE) AS PRODUCTION_DAY,
    PR.PRODUCT_CATEGORY,
    COUNT(*) AS BATCH_COUNT,
    AVG(PR.YIELD_PERCENTAGE) AS AVG_YIELD,
    COUNT_IF(PR.YIELD_PERCENTAGE >= 95) AS GOLDEN_BATCH_COUNT
FROM ATOMIC.PRODUCTION_RUN PR
WHERE PR.IS_CURRENT_FLAG = TRUE
GROUP BY 1, 2;
```

### 3. Dynamic Tables (2-Step Pipeline)

**Step 1 — Clean RAW data:**

```sql
CREATE OR REPLACE DYNAMIC TABLE ATOMIC.EQUIPMENT_READINGS_CLEAN
  TARGET_LAG = '1 hour'
  WAREHOUSE = TRANSFORM_WH
AS
SELECT
    EQUIPMENT_ID,
    TRY_TO_TIMESTAMP(READING_TIMESTAMP) AS READING_TIMESTAMP,
    TRY_TO_NUMBER(TEMPERATURE_VALUE, 10, 2) AS TEMPERATURE_VALUE,
    TRY_TO_NUMBER(PRESSURE_VALUE, 10, 2) AS PRESSURE_VALUE,
    _LOADED_TIMESTAMP
FROM RAW.EQUIPMENT_READINGS_STAGE
WHERE TRY_TO_TIMESTAMP(READING_TIMESTAMP) IS NOT NULL;
```

**Step 2 — Aggregate into DATA_MART:**

```sql
CREATE OR REPLACE DYNAMIC TABLE DATA_MART.HOURLY_EQUIPMENT_METRICS
  TARGET_LAG = '1 hour'
  WAREHOUSE = TRANSFORM_WH
AS
SELECT
    EQUIPMENT_ID,
    DATE_TRUNC('HOUR', READING_TIMESTAMP) AS READING_HOUR,
    AVG(TEMPERATURE_VALUE) AS AVG_TEMPERATURE,
    MAX(TEMPERATURE_VALUE) AS MAX_TEMPERATURE,
    AVG(PRESSURE_VALUE) AS AVG_PRESSURE,
    COUNT(*) AS READING_COUNT
FROM ATOMIC.EQUIPMENT_READINGS_CLEAN
GROUP BY EQUIPMENT_ID, DATE_TRUNC('HOUR', READING_TIMESTAMP);
```

> **TARGET_LAG options**: `'1 minute'` to `'7 days'` (time-based) or `DOWNSTREAM` (refresh when a downstream object refreshes).

### 4. Stored Procedures (CDC MERGE with SCD2)

```sql
CREATE OR REPLACE PROCEDURE ATOMIC.MERGE_CUSTOMER_CDC()
  RETURNS VARCHAR
  LANGUAGE SQL
AS
BEGIN
  -- Step 1: Expire existing records that have updates
  UPDATE ATOMIC.CUSTOMER T
  SET
    T.VALID_TO_TIMESTAMP = S._CDC_TIMESTAMP,
    T.IS_CURRENT_FLAG = FALSE,
    T.UPDATED_BY_USER = 'CDC_MERGE',
    T.UPDATED_TIMESTAMP = CURRENT_TIMESTAMP()
  FROM RAW.CUSTOMER_CDC S
  WHERE T.CUSTOMER_ID = S.CUSTOMER_ID
    AND T.IS_CURRENT_FLAG = TRUE
    AND S._CDC_OPERATION IN ('UPDATE', 'DELETE');

  -- Step 2: Insert new/updated records (dedup by latest sequence)
  INSERT INTO ATOMIC.CUSTOMER (
    CUSTOMER_ID, CUSTOMER_NAME, EMAIL, STATUS,
    VALID_FROM_TIMESTAMP, IS_CURRENT_FLAG,
    CREATED_BY_USER, CREATED_TIMESTAMP
  )
  SELECT
    CUSTOMER_ID, CUSTOMER_NAME, EMAIL, STATUS,
    _CDC_TIMESTAMP AS VALID_FROM_TIMESTAMP,
    TRUE AS IS_CURRENT_FLAG,
    'CDC_MERGE' AS CREATED_BY_USER,
    CURRENT_TIMESTAMP() AS CREATED_TIMESTAMP
  FROM RAW.CUSTOMER_CDC
  WHERE _CDC_OPERATION IN ('INSERT', 'UPDATE')
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY CUSTOMER_ID ORDER BY _CDC_SEQUENCE DESC
  ) = 1;

  -- Step 3: Archive processed CDC records and truncate staging
  INSERT INTO RAW.CUSTOMER_CDC_ARCHIVE SELECT * FROM RAW.CUSTOMER_CDC;
  TRUNCATE TABLE RAW.CUSTOMER_CDC;

  RETURN 'CDC merge complete';
END;
```

### 5. Streams + Tasks

```sql
-- Create a stream on the CDC table (captures all DML changes)
CREATE OR REPLACE STREAM RAW.EQUIPMENT_READINGS_STREAM
  ON TABLE RAW.EQUIPMENT_READINGS_STAGE
  APPEND_ONLY = FALSE;

-- Create a task that fires when the stream has data
CREATE OR REPLACE TASK ATOMIC.PROCESS_EQUIPMENT_READINGS
  WAREHOUSE = TRANSFORM_WH
  SCHEDULE = '5 MINUTE'
  WHEN SYSTEM$STREAM_HAS_DATA('RAW.EQUIPMENT_READINGS_STREAM')
AS
MERGE INTO ATOMIC.EQUIPMENT_READING T
USING (
  SELECT
    EQUIPMENT_ID,
    TRY_TO_TIMESTAMP(READING_TIMESTAMP) AS READING_TIMESTAMP,
    TRY_TO_NUMBER(TEMPERATURE_VALUE, 10, 2) AS TEMPERATURE_VALUE,
    TRY_TO_NUMBER(PRESSURE_VALUE, 10, 2) AS PRESSURE_VALUE
  FROM RAW.EQUIPMENT_READINGS_STREAM
  WHERE METADATA$ACTION = 'INSERT'
) S
ON T.EQUIPMENT_ID = S.EQUIPMENT_ID
  AND T.READING_TIMESTAMP = S.READING_TIMESTAMP
WHEN NOT MATCHED THEN INSERT (
  EQUIPMENT_ID, READING_TIMESTAMP, TEMPERATURE_VALUE, PRESSURE_VALUE,
  CREATED_BY_USER, CREATED_TIMESTAMP
) VALUES (
  S.EQUIPMENT_ID, S.READING_TIMESTAMP, S.TEMPERATURE_VALUE, S.PRESSURE_VALUE,
  'STREAM_TASK', CURRENT_TIMESTAMP()
);

-- Enable the task
ALTER TASK ATOMIC.PROCESS_EQUIPMENT_READINGS RESUME;
```

> **APPEND_ONLY**: `TRUE` captures inserts only (cheaper). `FALSE` captures all DML (INSERT, UPDATE, DELETE).

## Quick Decision Guide

| Scenario | Recommended Approach |
|----------|---------------------|
| Simple dimension view | Standard View |
| Dashboard aggregations | Materialized View |
| ETL pipeline with multiple steps | Dynamic Tables |
| Complex business logic with conditionals | Stored Procedure |
| Real-time CDC from source system | Streams + Tasks |
| One-time data transformation | CTAS (CREATE TABLE AS SELECT) |
| Ad-hoc analysis | Standard View or CTAS |

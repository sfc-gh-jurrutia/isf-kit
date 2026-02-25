# Transformation Approaches Reference

Guide for choosing the right transformation approach in Snowflake projects.

## Decision Framework

Choose the simplest approach that meets requirements:

```
Transformation Need
    │
    ├── Real-time required? ──Yes──> Streams + Tasks
    │
    └── No
        │
        ├── Complex multi-step? ──Yes──> Declarative OK? ──Yes──> Dynamic Tables
        │                                      │
        │                                      └── No ──> Stored Procedures
        └── No
            │
            ├── Materialization needed? ──Yes──> Materialized Views
            │
            └── No ──> Standard Views (Simplest)
```

## Approach Comparison

| Approach | Use When | Pros | Cons |
|----------|----------|------|------|
| **Views** | Simple transformations, real-time accuracy | Zero maintenance, always current | Query-time compute cost |
| **Materialized Views** | Expensive aggregations, predictable queries | Auto-refresh, simple syntax | Limited transformation support |
| **Dynamic Tables** | Multi-step pipelines, declarative preferred | Auto-refresh, dependency tracking | Snowflake-specific, compute cost |
| **Stored Procedures** | Complex logic, conditional processing | Full control, procedural logic | Manual orchestration needed |
| **Streams + Tasks** | CDC processing, near-real-time | Incremental processing | Complex setup and monitoring |

---

## Standard Views

**Use For:** Simple transformations where real-time accuracy is important.

```sql
CREATE OR REPLACE VIEW ATOMIC.CUSTOMER_CURRENT AS
SELECT 
    CUSTOMER_ID,
    CUSTOMER_NAME,
    EMAIL,
    STATUS
FROM ATOMIC.CUSTOMER
WHERE IS_CURRENT_FLAG = TRUE;
```

**Pros:**
- Zero maintenance
- Always returns current data
- No storage cost

**Cons:**
- Query-time compute cost
- Can be slow for complex joins/aggregations

---

## Materialized Views

**Use For:** Expensive aggregations with predictable query patterns.

```sql
CREATE MATERIALIZED VIEW YO_SWEET_SPOT.DAILY_SUMMARY
AS
SELECT
    DATE_TRUNC('DAY', PRODUCTION_DATE) AS DAY,
    PRODUCT_CATEGORY,
    COUNT(*) AS BATCH_COUNT,
    AVG(YIELD_PERCENTAGE) AS AVG_YIELD
FROM ATOMIC.PRODUCTION_RUN
WHERE PRODUCTION_STATUS = 'COMPLETED'
GROUP BY 1, 2;
```

**Pros:**
- Auto-refresh (incremental when possible)
- Simple syntax
- Query optimizer aware

**Cons:**
- Limited transformation support
- Cannot use some window functions
- Cannot join with external tables

---

## Dynamic Tables

**Use For:** Multi-step transformation pipelines with declarative refresh.

```sql
-- Step 1: Clean and validate RAW data
CREATE OR REPLACE DYNAMIC TABLE ATOMIC.EQUIPMENT_READINGS_CLEAN
    TARGET_LAG = '1 hour'
    WAREHOUSE = TRANSFORM_WH
AS
SELECT
    EQUIPMENT_ID,
    TRY_TO_TIMESTAMP(READING_TIMESTAMP) AS READING_TIMESTAMP,
    TRY_TO_NUMBER(TEMPERATURE_VALUE) AS TEMPERATURE_VALUE,
    TRY_TO_NUMBER(PRESSURE_VALUE) AS PRESSURE_VALUE,
    OPERATOR_NOTES,
    _SOURCE_FILE_NAME,
    _LOADED_TIMESTAMP
FROM RAW.EQUIPMENT_READINGS_STAGE
WHERE TRY_TO_TIMESTAMP(READING_TIMESTAMP) IS NOT NULL;

-- Step 2: Aggregate for DATA_MART
CREATE OR REPLACE DYNAMIC TABLE YO_SWEET_SPOT.HOURLY_EQUIPMENT_METRICS
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

**Pros:**
- Auto-refresh with dependency tracking
- Declarative pipeline definition
- Full SQL support

**Cons:**
- Snowflake-specific
- Compute cost for refresh
- TARGET_LAG requires warehouse

**TARGET_LAG Options:**
- `'1 minute'` to `'7 days'` - Time-based lag
- `DOWNSTREAM` - Refresh when downstream tables refresh

---

## Stored Procedures

**Use For:** Complex conditional logic or multi-statement transactions.

```sql
CREATE OR REPLACE PROCEDURE ATOMIC.PROCESS_CDC_BATCH()
RETURNS STRING
LANGUAGE SQL
AS
$$
DECLARE
    rows_processed INT;
BEGIN
    -- Step 1: Expire old records
    UPDATE ATOMIC.CUSTOMER target
    SET 
        VALID_TO_TIMESTAMP = source._CDC_TIMESTAMP,
        IS_CURRENT_FLAG = FALSE,
        UPDATED_TIMESTAMP = CURRENT_TIMESTAMP()
    FROM RAW.CUSTOMER_CDC source
    WHERE target.CUSTOMER_ID = source.CUSTOMER_ID
      AND target.IS_CURRENT_FLAG = TRUE
      AND source._CDC_OPERATION IN ('UPDATE', 'DELETE');
    
    -- Step 2: Insert new/updated records
    INSERT INTO ATOMIC.CUSTOMER (
        CUSTOMER_ID, CUSTOMER_NAME, EMAIL, STATUS,
        VALID_FROM_TIMESTAMP, IS_CURRENT_FLAG,
        CREATED_BY_USER, CREATED_TIMESTAMP
    )
    SELECT 
        CUSTOMER_ID, CUSTOMER_NAME, EMAIL, STATUS,
        _CDC_TIMESTAMP, TRUE,
        'CDC_PROCEDURE', CURRENT_TIMESTAMP()
    FROM RAW.CUSTOMER_CDC
    WHERE _CDC_OPERATION IN ('INSERT', 'UPDATE')
    QUALIFY ROW_NUMBER() OVER (PARTITION BY CUSTOMER_ID ORDER BY _CDC_SEQUENCE DESC) = 1;
    
    rows_processed := SQLROWCOUNT;
    
    -- Step 3: Archive processed CDC records
    INSERT INTO RAW.CUSTOMER_CDC_ARCHIVE
    SELECT *, CURRENT_TIMESTAMP() AS _ARCHIVED_TIMESTAMP
    FROM RAW.CUSTOMER_CDC;
    
    TRUNCATE TABLE RAW.CUSTOMER_CDC;
    
    RETURN 'Processed ' || rows_processed || ' records';
END;
$$;
```

**Pros:**
- Full procedural control
- Transaction management
- Complex conditional logic

**Cons:**
- Manual orchestration needed
- More complex to maintain
- Must schedule with Tasks or external scheduler

---

## Streams + Tasks

**Use For:** CDC processing with near-real-time requirements.

```sql
-- Create stream to track changes
CREATE OR REPLACE STREAM RAW.CUSTOMER_CHANGES
ON TABLE RAW.CUSTOMER_CDC
APPEND_ONLY = FALSE;

-- Create task to process changes
CREATE OR REPLACE TASK ATOMIC.PROCESS_CUSTOMER_CHANGES
    WAREHOUSE = TRANSFORM_WH
    SCHEDULE = '5 MINUTE'
    WHEN SYSTEM$STREAM_HAS_DATA('RAW.CUSTOMER_CHANGES')
AS
    MERGE INTO ATOMIC.CUSTOMER target
    USING (
        SELECT * FROM RAW.CUSTOMER_CHANGES
        WHERE METADATA$ACTION = 'INSERT'
        QUALIFY ROW_NUMBER() OVER (PARTITION BY CUSTOMER_ID ORDER BY _CDC_SEQUENCE DESC) = 1
    ) source
    ON target.CUSTOMER_ID = source.CUSTOMER_ID AND target.IS_CURRENT_FLAG = TRUE
    WHEN MATCHED THEN UPDATE SET
        VALID_TO_TIMESTAMP = source._CDC_TIMESTAMP,
        IS_CURRENT_FLAG = FALSE
    WHEN NOT MATCHED THEN INSERT (
        CUSTOMER_ID, CUSTOMER_NAME, EMAIL, STATUS,
        VALID_FROM_TIMESTAMP, IS_CURRENT_FLAG, CREATED_TIMESTAMP
    ) VALUES (
        source.CUSTOMER_ID, source.CUSTOMER_NAME, source.EMAIL, source.STATUS,
        source._CDC_TIMESTAMP, TRUE, CURRENT_TIMESTAMP()
    );

-- Enable the task
ALTER TASK ATOMIC.PROCESS_CUSTOMER_CHANGES RESUME;
```

**Pros:**
- Incremental processing (only changed data)
- Near-real-time updates
- Built-in change tracking

**Cons:**
- Complex setup and monitoring
- Stream consumption semantics
- Task scheduling overhead

**Stream Types:**
- `APPEND_ONLY = TRUE` - Only track inserts
- `APPEND_ONLY = FALSE` - Track inserts, updates, deletes

---

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

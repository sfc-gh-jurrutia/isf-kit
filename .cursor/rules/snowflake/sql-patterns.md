# Common Snowflake SQL Patterns

Reference these patterns when generating Snowflake SQL code.

## Data Loading

### Stage and Load from S3
```sql
-- Create external stage
CREATE OR REPLACE STAGE my_stage
  URL = 's3://bucket/path/'
  STORAGE_INTEGRATION = my_integration
  FILE_FORMAT = (TYPE = 'PARQUET');

-- Load data
COPY INTO my_database.my_schema.my_table
FROM @my_stage
PATTERN = '.*[.]parquet'
ON_ERROR = 'CONTINUE';
```

### Load from Internal Stage
```sql
-- Create internal stage
CREATE OR REPLACE STAGE my_internal_stage
  FILE_FORMAT = (TYPE = 'CSV' FIELD_OPTIONALLY_ENCLOSED_BY = '"');

-- Put files (from SnowSQL)
-- PUT file://path/to/file.csv @my_internal_stage;

-- Load
COPY INTO my_table FROM @my_internal_stage;
```

## Access Control

### Grant Patterns
```sql
-- Database access
GRANT USAGE ON DATABASE my_db TO ROLE my_role;
GRANT USAGE ON SCHEMA my_db.my_schema TO ROLE my_role;

-- Table access
GRANT SELECT ON ALL TABLES IN SCHEMA my_db.my_schema TO ROLE my_role;
GRANT SELECT ON FUTURE TABLES IN SCHEMA my_db.my_schema TO ROLE my_role;

-- Warehouse access
GRANT USAGE ON WAREHOUSE my_wh TO ROLE my_role;
```

## Dynamic Tables

```sql
CREATE OR REPLACE DYNAMIC TABLE my_dynamic_table
  TARGET_LAG = '1 hour'
  WAREHOUSE = my_warehouse
AS
SELECT
    id,
    name,
    CURRENT_TIMESTAMP() AS refreshed_at
FROM source_table;
```

## Tasks and Streams

### Stream for CDC
```sql
-- Create stream on source table
CREATE OR REPLACE STREAM my_stream ON TABLE source_table;

-- Task to process stream
CREATE OR REPLACE TASK process_stream_task
  WAREHOUSE = my_warehouse
  SCHEDULE = '5 MINUTE'
WHEN
  SYSTEM$STREAM_HAS_DATA('my_stream')
AS
  INSERT INTO target_table
  SELECT * FROM my_stream WHERE METADATA$ACTION = 'INSERT';
```

## Stored Procedures (JavaScript)

```sql
CREATE OR REPLACE PROCEDURE my_procedure(param1 STRING)
RETURNS STRING
LANGUAGE JAVASCRIPT
EXECUTE AS CALLER
AS
$$
try {
    var stmt = snowflake.createStatement({
        sqlText: `SELECT * FROM my_table WHERE col = ?`,
        binds: [PARAM1]
    });
    var result = stmt.execute();
    return "Success";
} catch (err) {
    return "Error: " + err.message;
}
$$;
```

## Stored Procedures (Python/Snowpark)

```sql
CREATE OR REPLACE PROCEDURE my_python_procedure(param1 STRING)
RETURNS STRING
LANGUAGE PYTHON
RUNTIME_VERSION = '3.11'
PACKAGES = ('snowflake-snowpark-python')
HANDLER = 'main'
AS
$$
def main(session, param1):
    df = session.table("my_table").filter(col("column") == param1)
    return f"Processed {df.count()} rows"
$$;
```

## UDFs

### SQL UDF
```sql
CREATE OR REPLACE FUNCTION format_name(first_name STRING, last_name STRING)
RETURNS STRING
AS
$$
    TRIM(first_name) || ' ' || TRIM(last_name)
$$;
```

### Python UDF
```sql
CREATE OR REPLACE FUNCTION parse_json_field(json_str STRING, field STRING)
RETURNS STRING
LANGUAGE PYTHON
RUNTIME_VERSION = '3.11'
HANDLER = 'extract_field'
AS
$$
import json
def extract_field(json_str, field):
    try:
        data = json.loads(json_str)
        return str(data.get(field, ''))
    except:
        return None
$$;
```

## MERGE (Upsert)

```sql
MERGE INTO target_table AS t
USING source_table AS s
ON t.id = s.id
WHEN MATCHED THEN
    UPDATE SET
        t.name = s.name,
        t.updated_at = CURRENT_TIMESTAMP()
WHEN NOT MATCHED THEN
    INSERT (id, name, created_at, updated_at)
    VALUES (s.id, s.name, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP());
```

## JSON/VARIANT Handling

### Parse and Query JSON
```sql
-- Parse JSON string to VARIANT
SELECT PARSE_JSON('{"name": "John", "age": 30}') AS json_data;

-- Access nested fields
SELECT
    raw_json:name::STRING AS name,
    raw_json:address.city::STRING AS city,
    raw_json:tags[0]::STRING AS first_tag
FROM my_table;
```

### Flatten Nested Arrays
```sql
-- Flatten array to rows
SELECT
    t.id,
    f.value:item_name::STRING AS item_name,
    f.value:quantity::NUMBER AS quantity
FROM my_table t,
LATERAL FLATTEN(input => t.order_items) f;

-- Flatten with path for deeply nested
SELECT
    f.path,
    f.key,
    f.value
FROM my_table,
LATERAL FLATTEN(input => raw_json, recursive => TRUE) f;
```

## Time Travel

```sql
-- Query data as of specific time
SELECT * FROM my_table AT(TIMESTAMP => '2024-01-15 10:00:00'::TIMESTAMP);

-- Query data as of X seconds ago
SELECT * FROM my_table AT(OFFSET => -3600);

-- Query before specific statement
SELECT * FROM my_table BEFORE(STATEMENT => '01a1b2c3-0000-0000-0000-000000000000');

-- Restore dropped table
UNDROP TABLE my_table;

-- Clone table from point in time
CREATE TABLE my_table_restored CLONE my_table AT(TIMESTAMP => '2024-01-15 10:00:00'::TIMESTAMP);
```

## Cloning

```sql
-- Clone database (zero-copy)
CREATE DATABASE dev_db CLONE prod_db;

-- Clone schema
CREATE SCHEMA dev_schema CLONE prod_db.prod_schema;

-- Clone table
CREATE TABLE test_table CLONE prod_table;

-- Clone with time travel
CREATE TABLE backup_table CLONE my_table AT(OFFSET => -3600);
```

## Window Functions

```sql
-- Row numbering and ranking
SELECT
    id,
    category,
    amount,
    ROW_NUMBER() OVER (PARTITION BY category ORDER BY amount DESC) AS row_num,
    RANK() OVER (PARTITION BY category ORDER BY amount DESC) AS rank,
    DENSE_RANK() OVER (PARTITION BY category ORDER BY amount DESC) AS dense_rank
FROM sales;

-- Running totals and moving averages
SELECT
    date,
    amount,
    SUM(amount) OVER (ORDER BY date ROWS UNBOUNDED PRECEDING) AS running_total,
    AVG(amount) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS moving_avg_7d
FROM daily_sales;

-- Lead/Lag for comparisons
SELECT
    date,
    amount,
    LAG(amount, 1) OVER (ORDER BY date) AS prev_amount,
    amount - LAG(amount, 1) OVER (ORDER BY date) AS change
FROM daily_sales;
```

## CTEs (Common Table Expressions)

```sql
WITH filtered_orders AS (
    SELECT * FROM orders WHERE status = 'completed'
),
customer_totals AS (
    SELECT
        customer_id,
        SUM(amount) AS total_amount,
        COUNT(*) AS order_count
    FROM filtered_orders
    GROUP BY customer_id
)
SELECT
    c.name,
    ct.total_amount,
    ct.order_count
FROM customer_totals ct
JOIN customers c ON ct.customer_id = c.id
ORDER BY ct.total_amount DESC;
```

## Transient & Temporary Tables

```sql
-- Transient table (no Fail-safe, reduced storage costs)
CREATE TRANSIENT TABLE staging_data (
    id NUMBER,
    data VARIANT,
    loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- Temporary table (session-scoped, auto-dropped)
CREATE TEMPORARY TABLE session_results AS
SELECT * FROM large_table WHERE condition = true;
```

## Table Sampling

```sql
-- Sample by percentage (Bernoulli - row-level)
SELECT * FROM large_table SAMPLE (10);

-- Sample by percentage (System - block-level, faster)
SELECT * FROM large_table SAMPLE SYSTEM (10);

-- Sample fixed number of rows
SELECT * FROM large_table SAMPLE (1000 ROWS);

-- Repeatable sampling with seed
SELECT * FROM large_table SAMPLE (10) SEED (42);
```


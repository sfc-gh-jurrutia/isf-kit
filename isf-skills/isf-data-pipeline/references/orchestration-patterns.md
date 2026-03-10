# Orchestration Patterns

Loaded from SKILL.md when generating orchestration objects (Step 4).

## Streams

### Append-Only Stream (insert-only sources)

```sql
CREATE OR REPLACE STREAM RAW.stream_{entity}
  ON TABLE RAW.{entity}
  APPEND_ONLY = TRUE
  COMMENT = 'Tracks new rows inserted into RAW.{entity}';
```

### Standard Stream (full CDC -- insert, update, delete)

```sql
CREATE OR REPLACE STREAM RAW.stream_{entity}
  ON TABLE RAW.{entity}
  APPEND_ONLY = FALSE
  COMMENT = 'Tracks all DML on RAW.{entity} for CDC processing';
```

### Check Stream Data Availability

```sql
SELECT SYSTEM$STREAM_HAS_DATA('RAW.stream_{entity}');
```

## Task DAG Pattern

### Root Task (scheduler)

```sql
CREATE OR REPLACE TASK DATA_ENGINEERING.root_pipeline_task
  WAREHOUSE = TRANSFORM_WH
  SCHEDULE = 'USING CRON 0 */4 * * * America/Los_Angeles'
  COMMENT = 'Root task for {solution} data pipeline'
AS
  SELECT 1;
```

### Child Tasks: Loading

```sql
CREATE OR REPLACE TASK DATA_ENGINEERING.load_raw_{entity}
  WAREHOUSE = TRANSFORM_WH
  AFTER DATA_ENGINEERING.root_pipeline_task
AS
  COPY INTO RAW.{entity}
  FROM @raw_stage_{source}/{entity}/
  FILE_FORMAT = raw_{type}_format
  MATCH_BY_COLUMN_NAME = CASE_INSENSITIVE
  ON_ERROR = 'CONTINUE';
```

### Child Tasks: RAW → ATOMIC Transforms

```sql
CREATE OR REPLACE TASK DATA_ENGINEERING.transform_atomic_{entity}
  WAREHOUSE = TRANSFORM_WH
  AFTER DATA_ENGINEERING.load_raw_{entity}
AS
  CALL ATOMIC.sp_merge_{entity}();
```

### Child Tasks: Stream-Triggered Transform

```sql
CREATE OR REPLACE TASK DATA_ENGINEERING.cdc_transform_{entity}
  WAREHOUSE = TRANSFORM_WH
  AFTER DATA_ENGINEERING.root_pipeline_task
  WHEN SYSTEM$STREAM_HAS_DATA('RAW.stream_{entity}')
AS
  CALL ATOMIC.sp_merge_from_stream_{entity}();
```

### Child Tasks: DATA_MART Refresh

```sql
CREATE OR REPLACE TASK DATA_ENGINEERING.refresh_mart_{target}
  WAREHOUSE = TRANSFORM_WH
  AFTER DATA_ENGINEERING.transform_atomic_{entity_1},
       DATA_ENGINEERING.transform_atomic_{entity_2}
AS
  CALL DATA_MART.sp_refresh_{target}();
```

### Finalize Task (end of DAG)

```sql
CREATE OR REPLACE TASK DATA_ENGINEERING.pipeline_complete
  WAREHOUSE = TRANSFORM_WH
  AFTER DATA_ENGINEERING.refresh_mart_{target_1},
       DATA_ENGINEERING.refresh_mart_{target_2}
AS
  INSERT INTO DATA_ENGINEERING.pipeline_log (run_id, completed_at, status)
  VALUES (UUID_STRING(), CURRENT_TIMESTAMP(), 'SUCCESS');
```

### Resume Task DAG

Tasks are created in SUSPENDED state. Resume from root to activate the entire DAG:

```sql
ALTER TASK DATA_ENGINEERING.root_pipeline_task RESUME;
-- Child tasks are automatically resumed when the root is resumed
```

### Suspend Task DAG

```sql
-- Suspend root first (prevents new runs)
ALTER TASK DATA_ENGINEERING.root_pipeline_task SUSPEND;
```

## Complete DAG Example

```
root_pipeline_task (CRON: every 4 hours)
├── load_raw_customer
│   └── transform_atomic_customer (SCD2 MERGE)
├── load_raw_order
│   └── transform_atomic_order (fact MERGE)
├── load_raw_product
│   └── transform_atomic_product (full MERGE)
├── cdc_transform_event (WHEN stream has data)
└── [all atomic transforms complete]
    ├── refresh_mart_sales_summary
    ├── refresh_mart_customer_360
    ├── refresh_features_customer
    └── pipeline_complete (log entry)
```

## Scheduling Patterns

| Pattern | CRON Expression | Use Case |
|---------|----------------|----------|
| Every 4 hours | `0 */4 * * *` | Standard batch pipeline |
| Hourly | `0 * * * *` | Near-real-time requirements |
| Daily at 2 AM | `0 2 * * *` | Overnight batch processing |
| Every 15 minutes | `*/15 * * * *` | High-frequency updates |
| Weekdays only at 6 AM | `0 6 * * 1-5` | Business-hours data |

## Monitoring

### Failed Task Detection

```sql
SELECT
  name,
  state,
  error_message,
  scheduled_time,
  completed_time,
  DATEDIFF(SECOND, scheduled_time, completed_time) AS duration_seconds
FROM TABLE(INFORMATION_SCHEMA.TASK_HISTORY(
  SCHEDULED_TIME_RANGE_START => DATEADD(HOUR, -24, CURRENT_TIMESTAMP()),
  RESULT_LIMIT => 100
))
WHERE state = 'FAILED'
ORDER BY scheduled_time DESC;
```

### Task Run History Summary

```sql
SELECT
  name,
  COUNT(*) AS total_runs,
  SUM(CASE WHEN state = 'SUCCEEDED' THEN 1 ELSE 0 END) AS successes,
  SUM(CASE WHEN state = 'FAILED' THEN 1 ELSE 0 END)    AS failures,
  AVG(DATEDIFF(SECOND, scheduled_time, completed_time))  AS avg_duration_seconds
FROM TABLE(INFORMATION_SCHEMA.TASK_HISTORY(
  SCHEDULED_TIME_RANGE_START => DATEADD(DAY, -7, CURRENT_TIMESTAMP()),
  RESULT_LIMIT => 1000
))
GROUP BY name
ORDER BY failures DESC;
```

### Pipeline Row Count Validation

```sql
CREATE OR REPLACE PROCEDURE DATA_ENGINEERING.sp_validate_pipeline()
RETURNS TABLE (layer VARCHAR, entity VARCHAR, row_count NUMBER, status VARCHAR)
LANGUAGE SQL
AS
$$
DECLARE
  results RESULTSET;
BEGIN
  results := (
    SELECT 'RAW' AS layer, '{entity}' AS entity,
           (SELECT COUNT(*) FROM RAW.{entity}) AS row_count,
           CASE WHEN (SELECT COUNT(*) FROM RAW.{entity}) > 0 THEN 'OK' ELSE 'EMPTY' END AS status
    UNION ALL
    SELECT 'ATOMIC', '{entity}',
           (SELECT COUNT(*) FROM ATOMIC.{entity}),
           CASE WHEN (SELECT COUNT(*) FROM ATOMIC.{entity}) > 0 THEN 'OK' ELSE 'EMPTY' END
    UNION ALL
    SELECT 'DATA_MART', '{target}',
           (SELECT COUNT(*) FROM DATA_MART.{target}),
           CASE WHEN (SELECT COUNT(*) FROM DATA_MART.{target}) > 0 THEN 'OK' ELSE 'EMPTY' END
  );
  RETURN TABLE(results);
END;
$$;
```

### Alert on Pipeline Failure

```sql
CREATE OR REPLACE ALERT DATA_ENGINEERING.pipeline_failure_alert
  WAREHOUSE = TRANSFORM_WH
  SCHEDULE = 'USING CRON 0 * * * * America/Los_Angeles'
  IF (EXISTS (
    SELECT 1
    FROM TABLE(INFORMATION_SCHEMA.TASK_HISTORY(
      SCHEDULED_TIME_RANGE_START => DATEADD(HOUR, -1, CURRENT_TIMESTAMP())
    ))
    WHERE state = 'FAILED'
      AND name LIKE '%pipeline%'
  ))
  THEN
    CALL SYSTEM$SEND_EMAIL(
      'pipeline_alerts',
      '{alert_email}',
      'Pipeline Task Failed',
      'One or more pipeline tasks failed in the last hour. Check TASK_HISTORY for details.'
    );

ALTER ALERT DATA_ENGINEERING.pipeline_failure_alert RESUME;
```

## Error Handling in Procedures

```sql
CREATE OR REPLACE PROCEDURE DATA_ENGINEERING.sp_safe_transform_{entity}()
RETURNS VARCHAR
LANGUAGE SQL
AS
$$
DECLARE
  row_count NUMBER;
BEGIN
  BEGIN
    CALL ATOMIC.sp_merge_{entity}();
    SELECT COUNT(*) INTO row_count FROM ATOMIC.{entity};

    INSERT INTO DATA_ENGINEERING.pipeline_log (run_id, task_name, entity, row_count, status, completed_at)
    VALUES (UUID_STRING(), 'transform_{entity}', '{entity}', :row_count, 'SUCCESS', CURRENT_TIMESTAMP());

    RETURN 'SUCCESS: ' || :row_count || ' rows';
  EXCEPTION
    WHEN OTHER THEN
      INSERT INTO DATA_ENGINEERING.pipeline_log (run_id, task_name, entity, status, error_message, completed_at)
      VALUES (UUID_STRING(), 'transform_{entity}', '{entity}', 'FAILED', SQLERRM, CURRENT_TIMESTAMP());

      RETURN 'FAILED: ' || SQLERRM;
  END;
END;
$$;
```

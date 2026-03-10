# Loading Patterns

Loaded from SKILL.md when designing the loading strategy (Step 2).

## File Formats

Define reusable file format objects for each source type:

```sql
-- CSV with header row
CREATE OR REPLACE FILE FORMAT raw_csv_format
  TYPE = 'CSV'
  FIELD_OPTIONALLY_ENCLOSED_BY = '"'
  SKIP_HEADER = 1
  NULL_IF = ('', 'NULL', 'null')
  EMPTY_FIELD_AS_NULL = TRUE
  ERROR_ON_COLUMN_COUNT_MISMATCH = FALSE;

-- JSON (one object per line)
CREATE OR REPLACE FILE FORMAT raw_json_format
  TYPE = 'JSON'
  STRIP_OUTER_ARRAY = TRUE
  ALLOW_DUPLICATE = FALSE;

-- Parquet (typed, columnar)
CREATE OR REPLACE FILE FORMAT raw_parquet_format
  TYPE = 'PARQUET'
  SNAPPY_COMPRESSION = TRUE;
```

## Internal Stages

```sql
-- Named internal stage per source system
CREATE OR REPLACE STAGE raw_stage_{source}
  FILE_FORMAT = raw_{type}_format
  DIRECTORY = (ENABLE = TRUE)
  COMMENT = 'Landing stage for {source} data files';
```

## External Stages

```sql
-- S3
CREATE OR REPLACE STAGE raw_stage_s3_{source}
  URL = 's3://{bucket}/{prefix}/'
  STORAGE_INTEGRATION = {integration_name}
  FILE_FORMAT = raw_{type}_format;

-- GCS
CREATE OR REPLACE STAGE raw_stage_gcs_{source}
  URL = 'gcs://{bucket}/{prefix}/'
  STORAGE_INTEGRATION = {integration_name}
  FILE_FORMAT = raw_{type}_format;

-- Azure
CREATE OR REPLACE STAGE raw_stage_azure_{source}
  URL = 'azure://{account}.blob.core.windows.net/{container}/{prefix}/'
  STORAGE_INTEGRATION = {integration_name}
  FILE_FORMAT = raw_{type}_format;
```

## COPY INTO Patterns

### Batch Load (staged files)

```sql
COPY INTO RAW.{entity}
FROM @raw_stage_{source}/{path}/
FILE_FORMAT = raw_{type}_format
MATCH_BY_COLUMN_NAME = CASE_INSENSITIVE
ON_ERROR = 'CONTINUE'
PURGE = TRUE;
```

### Parquet Load (type-safe)

```sql
COPY INTO RAW.{entity} (col_1, col_2, col_3, _loaded_timestamp)
FROM (
  SELECT
    $1:col_1::VARCHAR,
    $1:col_2::VARCHAR,
    $1:col_3::VARCHAR,
    CURRENT_TIMESTAMP()
  FROM @raw_stage_{source}/{path}/
)
FILE_FORMAT = raw_parquet_format;
```

### JSON / VARIANT Load

```sql
COPY INTO RAW.{entity}_raw (raw_data, _source_file_name, _loaded_timestamp)
FROM (
  SELECT
    $1,
    METADATA$FILENAME,
    CURRENT_TIMESTAMP()
  FROM @raw_stage_{source}/{path}/
)
FILE_FORMAT = raw_json_format;
```

### COPY INTO with Transformation

```sql
COPY INTO RAW.{entity} (entity_id, name, amount, event_date, _loaded_timestamp)
FROM (
  SELECT
    $1:id::VARCHAR,
    $1:name::VARCHAR,
    $1:amount::VARCHAR,
    $1:event_date::VARCHAR,
    CURRENT_TIMESTAMP()
  FROM @raw_stage_{source}/{path}/
)
FILE_FORMAT = raw_json_format
ON_ERROR = 'CONTINUE';
```

## Snowpipe (Continuous Loading)

### Basic Snowpipe

```sql
CREATE OR REPLACE PIPE raw_pipe_{entity}
  AUTO_INGEST = TRUE
  COMMENT = 'Continuous ingestion for {entity} from {source}'
AS
COPY INTO RAW.{entity}
FROM @raw_stage_{source}/{entity}/
FILE_FORMAT = raw_{type}_format
MATCH_BY_COLUMN_NAME = CASE_INSENSITIVE;
```

### Snowpipe with Notification Integration

```sql
-- S3 event notification
CREATE OR REPLACE NOTIFICATION INTEGRATION pipe_notification_{source}
  ENABLED = TRUE
  TYPE = QUEUE
  NOTIFICATION_PROVIDER = AWS_SNS
  DIRECTION = INBOUND
  AWS_SNS_TOPIC_ARN = 'arn:aws:sns:{region}:{account}:{topic}'
  AWS_SNS_ROLE_ARN = 'arn:aws:iam::{account}:role/{role}';
```

### Pipe Management

```sql
-- Check pipe status
SELECT SYSTEM$PIPE_STATUS('raw_pipe_{entity}');

-- Refresh pipe (reprocess files)
ALTER PIPE raw_pipe_{entity} REFRESH;

-- Pause/resume
ALTER PIPE raw_pipe_{entity} SET PIPE_EXECUTION_PAUSED = TRUE;
ALTER PIPE raw_pipe_{entity} SET PIPE_EXECUTION_PAUSED = FALSE;
```

## External Tables

For query-in-place patterns without loading into Snowflake:

```sql
CREATE OR REPLACE EXTERNAL TABLE RAW.{entity}_external (
  col_1 VARCHAR AS (VALUE:col_1::VARCHAR),
  col_2 NUMBER  AS (VALUE:col_2::NUMBER),
  col_3 DATE    AS (VALUE:col_3::DATE)
)
WITH LOCATION = @raw_stage_{source}/{entity}/
FILE_FORMAT = raw_parquet_format
AUTO_REFRESH = TRUE;
```

## Loading Decision Tree

```
Is the source delivering files continuously?
├── YES → Snowpipe (auto-ingest)
└── NO  → Is this a one-time or scheduled batch?
    ├── ONE-TIME → COPY INTO (manual or from seed data)
    └── SCHEDULED → COPY INTO inside a Task (see orchestration-patterns.md)

Do you need to query the data without loading it?
├── YES → External Table (query-in-place)
└── NO  → COPY INTO a managed table

Is the file format Parquet?
├── YES → Use MATCH_BY_COLUMN_NAME for schema flexibility
└── NO  → Define explicit column mapping in the SELECT
```

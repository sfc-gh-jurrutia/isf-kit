# Layer Patterns Reference

Detailed patterns for each layer of the Snowflake data architecture.

## RAW Layer Patterns

### Pattern 1: Staged File Data

For data loaded from files (CSV, JSON, Parquet):

```sql
CREATE TABLE RAW.EQUIPMENT_READINGS_STAGE (
    -- Original file columns (preserve as strings)
    EQUIPMENT_ID VARCHAR(50),
    READING_TIMESTAMP VARCHAR(50),
    TEMPERATURE_VALUE VARCHAR(20),
    PRESSURE_VALUE VARCHAR(20),
    OPERATOR_NOTES VARCHAR(1000),
    
    -- Metadata columns
    _SOURCE_FILE_NAME VARCHAR(500),
    _SOURCE_FILE_ROW_NUMBER NUMBER,
    _LOADED_TIMESTAMP TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
```

**Key Points:**
- Keep original data types as VARCHAR to avoid load failures
- Always include `_LOADED_TIMESTAMP` for lineage
- `_SOURCE_FILE_NAME` enables replay and debugging

### Pattern 2: CDC Data

For Change Data Capture from source systems:

```sql
CREATE TABLE RAW.CUSTOMER_CDC (
    -- Original source columns (preserve source data types)
    CUSTOMER_ID NUMBER,
    CUSTOMER_NAME VARCHAR(200),
    EMAIL VARCHAR(200),
    STATUS VARCHAR(20),
    
    -- CDC metadata columns (required)
    _CDC_OPERATION VARCHAR(10),      -- INSERT, UPDATE, DELETE
    _CDC_TIMESTAMP TIMESTAMP_NTZ,    -- When change occurred in source
    _CDC_SEQUENCE NUMBER,            -- Ordering of changes
    _CDC_SOURCE_SYSTEM VARCHAR(50),  -- Origin system identifier
    _LOADED_TIMESTAMP TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
```

**Key Points:**
- `_CDC_OPERATION` tracks the type of change
- `_CDC_SEQUENCE` enables proper ordering of changes
- `_CDC_SOURCE_SYSTEM` supports multi-source environments

### Pattern 3: API Response Data

For data ingested from APIs:

```sql
CREATE TABLE RAW.API_WEATHER_RESPONSES (
    REQUEST_ID VARCHAR(100),
    REQUEST_TIMESTAMP TIMESTAMP_NTZ,
    RESPONSE_PAYLOAD VARIANT,        -- Store full JSON response
    HTTP_STATUS_CODE NUMBER,
    _LOADED_TIMESTAMP TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
```

**Key Points:**
- Use VARIANT for flexible JSON schemas
- Preserve full response for debugging and reprocessing
- Track HTTP status for error handling

### Pattern 4: Flexible Schema Landing (VARIANT)

For source data with unknown, variable, or very wide schemas (hundreds of columns, evolving formats). Store the entire row as VARIANT and extract columns downstream.

```sql
CREATE TABLE RAW.SOURCE_READINGS_FLEX (
    LOAD_TIMESTAMP TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    SOURCE_FILE VARCHAR(500),
    SOURCE_NAME VARCHAR(200),
    ROW_NUMBER NUMBER,
    RAW_DATA VARIANT,                       -- Entire row as JSON/VARIANT
    READING_TIMESTAMP TIMESTAMP_NTZ         -- Extract one key timestamp for partitioning
);
```

Extract typed columns in the ATOMIC layer:

```sql
CREATE OR REPLACE VIEW ATOMIC.SOURCE_READINGS AS
SELECT
    RAW_DATA:entity_id::VARCHAR AS ENTITY_ID,
    RAW_DATA:metric_a::FLOAT AS METRIC_A,
    RAW_DATA:metric_b::FLOAT AS METRIC_B,
    RAW_DATA:status::VARCHAR AS STATUS,
    READING_TIMESTAMP,
    SOURCE_NAME,
    LOAD_TIMESTAMP
FROM RAW.SOURCE_READINGS_FLEX
WHERE RAW_DATA:entity_id IS NOT NULL;
```

**When to use:**
- Source has 100+ columns and you only need a subset
- Schema evolves frequently (new columns added by source)
- Multiple source formats land in the same table
- Initial discovery phase — extract columns as you learn the data

**When NOT to use:**
- Schema is stable and well-known (use explicit columns instead)
- Performance-critical queries (VARIANT extraction is slower than typed columns)

### RAW Naming Conventions

| Object Type | Convention | Example |
|-------------|------------|---------|
| Schema | `RAW` or `RAW_<SOURCE>` | `RAW`, `RAW_SAP`, `RAW_SALESFORCE` |
| Staging Tables | `<ENTITY>_STAGE` | `ORDERS_STAGE`, `CUSTOMERS_STAGE` |
| CDC Tables | `<ENTITY>_CDC` | `ORDERS_CDC`, `INVENTORY_CDC` |
| API Tables | `API_<SOURCE>_RESPONSES` | `API_WEATHER_RESPONSES` |

---

## ATOMIC Layer Patterns

### Standard Entity Structure

```sql
CREATE TABLE ATOMIC.ASSET (
    -- Primary Key
    ASSET_ID NUMBER(38,0) NOT NULL,
    
    -- Business Keys
    ASSET_CODE VARCHAR(100) NOT NULL,
    ASSET_NAME VARCHAR(200),
    ASSET_DESCRIPTION VARCHAR(1000),
    
    -- Classification
    ASSET_TYPE VARCHAR(50),
    ASSET_CLASS VARCHAR(50),
    ASSET_STATUS VARCHAR(50),
    
    -- Attributes
    SERIAL_NUMBER VARCHAR(100),
    MODEL_NUMBER VARCHAR(100),
    MANUFACTURER VARCHAR(200),
    ACQUISITION_DATE DATE,
    ACQUISITION_COST NUMBER(18,2),
    
    -- Foreign Keys (metadata only - not enforced by Snowflake)
    OWNING_ORGANIZATION_ID NUMBER(38,0),
    RESPONSIBLE_ORGANIZATION_ID NUMBER(38,0),
    PARENT_ASSET_ID NUMBER(38,0),
    
    -- Type 2 SCD
    VALID_FROM_TIMESTAMP TIMESTAMP_NTZ NOT NULL,
    VALID_TO_TIMESTAMP TIMESTAMP_NTZ,
    IS_CURRENT_FLAG BOOLEAN DEFAULT TRUE,
    
    -- Audit
    CREATED_BY_USER VARCHAR(100),
    CREATED_TIMESTAMP TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    UPDATED_BY_USER VARCHAR(100),
    UPDATED_TIMESTAMP TIMESTAMP_NTZ,
    
    -- Constraints (metadata only)
    PRIMARY KEY (ASSET_ID),
    UNIQUE (ASSET_CODE, VALID_FROM_TIMESTAMP),
    FOREIGN KEY (OWNING_ORGANIZATION_ID) REFERENCES ATOMIC.ORGANIZATION(ORGANIZATION_ID),
    FOREIGN KEY (PARENT_ASSET_ID) REFERENCES ATOMIC.ASSET(ASSET_ID)
);

COMMENT ON TABLE ATOMIC.ASSET IS 'Physical or logical assets owned or managed by the organization';
COMMENT ON COLUMN ATOMIC.ASSET.ASSET_STATUS IS 'Valid values: ACTIVE, INACTIVE, RETIRED, DISPOSED (enforced at application level)';
```

### Type 2 SCD MERGE Pattern

```sql
MERGE INTO ATOMIC.CUSTOMER AS target
USING (
    SELECT 
        CUSTOMER_ID,
        CUSTOMER_NAME,
        TRIM(UPPER(EMAIL)) AS EMAIL,
        STATUS,
        _CDC_TIMESTAMP AS VALID_FROM_TIMESTAMP,
        'CDC_LOADER' AS CREATED_BY_USER
    FROM RAW.CUSTOMER_CDC
    WHERE _CDC_OPERATION IN ('INSERT', 'UPDATE')
    QUALIFY ROW_NUMBER() OVER (
        PARTITION BY CUSTOMER_ID 
        ORDER BY _CDC_SEQUENCE DESC
    ) = 1
) AS source
ON target.CUSTOMER_ID = source.CUSTOMER_ID 
   AND target.IS_CURRENT_FLAG = TRUE
WHEN MATCHED AND (
    target.CUSTOMER_NAME != source.CUSTOMER_NAME OR
    target.EMAIL != source.EMAIL OR
    target.STATUS != source.STATUS
) THEN UPDATE SET
    VALID_TO_TIMESTAMP = source.VALID_FROM_TIMESTAMP,
    IS_CURRENT_FLAG = FALSE,
    UPDATED_TIMESTAMP = CURRENT_TIMESTAMP()
WHEN NOT MATCHED THEN INSERT (
    CUSTOMER_ID, CUSTOMER_NAME, EMAIL, STATUS,
    VALID_FROM_TIMESTAMP, IS_CURRENT_FLAG,
    CREATED_BY_USER, CREATED_TIMESTAMP
) VALUES (
    source.CUSTOMER_ID, source.CUSTOMER_NAME, source.EMAIL, source.STATUS,
    source.VALID_FROM_TIMESTAMP, TRUE,
    source.CREATED_BY_USER, CURRENT_TIMESTAMP()
);
```

---

## DATA_MART Layer Patterns

### Pattern 1: Denormalized Fact Views

```sql
CREATE OR REPLACE VIEW YO_SWEET_SPOT.PRODUCTION_BATCH_SUMMARY AS
SELECT
    -- Batch identifiers
    pr.PRODUCTION_RUN_ID,
    pr.BATCH_NUMBER,
    pr.PRODUCTION_DATE,
    
    -- Denormalized dimensions
    p.PRODUCT_CODE,
    p.PRODUCT_NAME,
    p.PRODUCT_CATEGORY,
    wc.WORK_CENTER_CODE,
    wc.WORK_CENTER_NAME,
    
    -- Measures
    pr.PLANNED_QUANTITY,
    pr.ACTUAL_QUANTITY,
    pr.YIELD_PERCENTAGE,
    pr.SCRAP_QUANTITY,
    pr.CYCLE_TIME_MINUTES,
    
    -- Calculated metrics
    ROUND(pr.ACTUAL_QUANTITY / NULLIF(pr.PLANNED_QUANTITY, 0) * 100, 2) AS EFFICIENCY_PCT,
    CASE WHEN pr.YIELD_PERCENTAGE >= 95 THEN 'GOLDEN' ELSE 'STANDARD' END AS BATCH_CLASSIFICATION
    
FROM ATOMIC.PRODUCTION_RUN pr
JOIN ATOMIC.PRODUCT p ON pr.PRODUCT_ID = p.PRODUCT_ID AND p.IS_CURRENT_FLAG = TRUE
JOIN ATOMIC.WORK_CENTER wc ON pr.WORK_CENTER_ID = wc.WORK_CENTER_ID
WHERE pr.PRODUCTION_STATUS = 'COMPLETED';
```

### Pattern 2: Aggregation Tables

```sql
CREATE OR REPLACE TABLE YO_SWEET_SPOT.DAILY_YIELD_METRICS AS
SELECT
    PRODUCTION_DATE,
    PRODUCT_CATEGORY,
    WORK_CENTER_CODE,
    
    -- Aggregated measures
    COUNT(*) AS BATCH_COUNT,
    SUM(ACTUAL_QUANTITY) AS TOTAL_QUANTITY,
    AVG(YIELD_PERCENTAGE) AS AVG_YIELD,
    MIN(YIELD_PERCENTAGE) AS MIN_YIELD,
    MAX(YIELD_PERCENTAGE) AS MAX_YIELD,
    STDDEV(YIELD_PERCENTAGE) AS YIELD_STDDEV,
    
    -- Golden batch counts
    COUNT_IF(YIELD_PERCENTAGE >= 95) AS GOLDEN_BATCH_COUNT,
    
    -- Refresh metadata
    CURRENT_TIMESTAMP() AS _REFRESHED_TIMESTAMP
    
FROM YO_SWEET_SPOT.PRODUCTION_BATCH_SUMMARY
GROUP BY PRODUCTION_DATE, PRODUCT_CATEGORY, WORK_CENTER_CODE;
```

### Pattern 3: ML Feature Store

```sql
CREATE OR REPLACE TABLE YO_SWEET_SPOT.BATCH_FEATURES AS
SELECT
    PRODUCTION_RUN_ID,
    BATCH_NUMBER,
    
    -- Target variable
    YIELD_PERCENTAGE AS TARGET_YIELD,
    
    -- Input features
    AMBIENT_TEMPERATURE,
    HUMIDITY_PERCENT,
    RAW_MATERIAL_LOT_AGE_DAYS,
    OPERATOR_EXPERIENCE_YEARS,
    EQUIPMENT_HOURS_SINCE_MAINTENANCE,
    
    -- Lag features
    LAG(YIELD_PERCENTAGE, 1) OVER (
        PARTITION BY PRODUCT_ID, WORK_CENTER_ID 
        ORDER BY PRODUCTION_DATE
    ) AS PREV_BATCH_YIELD,
    
    -- Rolling features
    AVG(YIELD_PERCENTAGE) OVER (
        PARTITION BY PRODUCT_ID, WORK_CENTER_ID 
        ORDER BY PRODUCTION_DATE
        ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING
    ) AS ROLLING_7_DAY_AVG_YIELD
    
FROM ATOMIC.PRODUCTION_RUN pr
JOIN ATOMIC.PRODUCTION_RUN_PARAMETER prp ON pr.PRODUCTION_RUN_ID = prp.PRODUCTION_RUN_ID
WHERE pr.PRODUCTION_STATUS = 'COMPLETED';
```

### Pattern 4: Search-Prep Views for Cortex Search

When the solution includes Cortex Search, create views that concatenate structured data into text chunks suitable for search indexing. These views live in the DATA_MART schema and are consumed by `isf-cortex-search` to create CORTEX SEARCH SERVICE objects.

```sql
CREATE OR REPLACE VIEW {DATA_MART}.{ENTITY}_SEARCH_VIEW AS
SELECT
    ENTITY_ID,
    ENTITY_NAME,
    ENTITY_DATE,
    CONCAT(
        'Entity: ', ENTITY_NAME,
        '\nDate: ', TO_CHAR(ENTITY_DATE, 'YYYY-MM-DD'),
        '\nCategory: ', COALESCE(CATEGORY, 'N/A'),
        '\nSummary: ', COALESCE(DESCRIPTION, ''),
        '\nDetails: ', COALESCE(DETAIL_TEXT, '')
    ) AS SEARCH_TEXT,
    CATEGORY AS DOCUMENT_TYPE
FROM ATOMIC.{ENTITY}
WHERE DESCRIPTION IS NOT NULL;
```

**Key Points:**
- The `SEARCH_TEXT` column is what Cortex Search indexes — design it for retrieval quality
- Include enough context in each chunk for the LLM to answer questions without needing the original row
- Add filterable columns (`DOCUMENT_TYPE`, `ENTITY_DATE`) that map to Cortex Search ATTRIBUTES
- Filter out NULL/empty rows that would produce low-quality search results

**Synthetic Document Generation:**

For richer search results, generate narrative text from structured data:

```sql
CREATE OR REPLACE VIEW {DATA_MART}.{ENTITY}_NARRATIVES AS
SELECT
    ENTITY_ID,
    ENTITY_DATE,
    CONCAT(
        'Report for ', ENTITY_NAME, ' on ', TO_CHAR(ENTITY_DATE, 'YYYY-MM-DD'), '.\n\n',
        'Performance: ', METRIC_A_NAME, ' was ', ROUND(METRIC_A, 2), ' ',
        CASE WHEN METRIC_A > THRESHOLD THEN '(above target)' ELSE '(below target)' END, '. ',
        METRIC_B_NAME, ' was ', ROUND(METRIC_B, 2), '.\n\n',
        CASE WHEN HAS_ANOMALY THEN
            'ALERT: Anomaly detected — ' || ANOMALY_DESCRIPTION || '.'
        ELSE 'No anomalies detected.' END
    ) AS SEARCH_TEXT,
    'performance_report' AS DOCUMENT_TYPE,
    ENTITY_NAME
FROM {DATA_MART}.{ENTITY}_SUMMARY;
```

This pattern converts structured metrics into natural-language documents that Cortex Search can index, enabling questions like "What happened with {entity} last week?" to return meaningful narrative answers rather than raw data.

---

## Optional Intermediate Schemas

### When to Use

| Schema | Purpose | Example Contents |
|--------|---------|------------------|
| `DATA_ENGINEERING` | Complex ETL staging | Intermediate staging tables, deduplication |
| `DATA_SCIENCE` | Experimentation | Exploration tables, sample datasets |
| `ML_PROCESSING` | ML pipeline artifacts | Training datasets, model outputs |
| `ML` | ML explainability artifacts | SHAP importance, PDP curves, calibration, metrics |

For the `ML` schema with full DDL, see `references/ml-schema-patterns.md`.

### ML Processing Example

```sql
CREATE SCHEMA ML_PROCESSING;

-- Training dataset preparation
CREATE TABLE ML_PROCESSING.YIELD_TRAINING_DATASET AS
SELECT * FROM YO_SWEET_SPOT.BATCH_FEATURES
WHERE PRODUCTION_DATE BETWEEN '2023-01-01' AND '2023-12-31'
  AND TARGET_YIELD IS NOT NULL;

-- Model predictions staging
CREATE TABLE ML_PROCESSING.YIELD_PREDICTIONS_STAGING (
    PREDICTION_ID NUMBER AUTOINCREMENT,
    PRODUCTION_RUN_ID NUMBER,
    PREDICTED_YIELD NUMBER(5,2),
    PREDICTION_CONFIDENCE NUMBER(5,4),
    MODEL_VERSION VARCHAR(50),
    PREDICTION_TIMESTAMP TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- After validation, promote to DATA_MART
INSERT INTO YO_SWEET_SPOT.YIELD_PREDICTIONS
SELECT 
    PRODUCTION_RUN_ID,
    PREDICTED_YIELD,
    PREDICTION_CONFIDENCE,
    MODEL_VERSION,
    PREDICTION_TIMESTAMP
FROM ML_PROCESSING.YIELD_PREDICTIONS_STAGING
WHERE PREDICTION_CONFIDENCE >= 0.8;
```

**Important Notes:**
- **Default is NOT to use** — Only add when requirements demand
- **Ephemeral Nature** — Contents may be transient and regenerated
- **Not for Consumers** — End users should only access DATA_MART

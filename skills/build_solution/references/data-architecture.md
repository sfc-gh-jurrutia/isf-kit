# Data Architecture Standard

> Load this reference during Step 2 (Generate Specification) and Step 3 (Plan) to ensure data architecture follows the RAW → ATOMIC → DATA_MART pattern.

## Architecture Overview

All Snowflake solution projects follow a layered architecture:

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

## Layer Summary

| Layer | Schema | Purpose | Required |
|-------|--------|---------|----------|
| Landing | `RAW` | External data in original format | **Yes** |
| Canonical | `ATOMIC` | Enterprise Relational Model, normalized | **Yes** |
| Processing | `DATA_ENGINEERING`, `DATA_SCIENCE`, `ML_PROCESSING` | Complex intermediate processing | No |
| Consumption | `{DATA_MART}` (project-named) | Consumer-facing data products | **Yes** |

### Why Always Include RAW

Even for simple projects, always create RAW because it:
1. **Demonstrates Source Realism** — Shows what actual source systems look like
2. **Provides Lineage Visibility** — Documents path from source to consumption
3. **Enables Replay** — Allows reprocessing if transformation logic changes
4. **Supports Auditing** — Maintains original data for compliance

## Standard Metadata Columns

### RAW Layer Metadata

```sql
-- File staging metadata (required on all staged file tables)
_SOURCE_FILE_NAME VARCHAR(500),
_SOURCE_FILE_ROW_NUMBER NUMBER,
_LOADED_TIMESTAMP TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()

-- CDC metadata (required on all CDC tables)
_CDC_OPERATION VARCHAR(10),      -- INSERT, UPDATE, DELETE
_CDC_TIMESTAMP TIMESTAMP_NTZ,    -- When change occurred
_CDC_SEQUENCE NUMBER,            -- Ordering of changes
_CDC_SOURCE_SYSTEM VARCHAR(50),  -- Origin system
_LOADED_TIMESTAMP TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
```

### ATOMIC Layer Metadata

```sql
-- Audit columns (required on ALL tables)
CREATED_BY_USER VARCHAR(100),
CREATED_TIMESTAMP TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
UPDATED_BY_USER VARCHAR(100),
UPDATED_TIMESTAMP TIMESTAMP_NTZ

-- Type 2 SCD columns (when history required)
VALID_FROM_TIMESTAMP TIMESTAMP_NTZ NOT NULL,
VALID_TO_TIMESTAMP TIMESTAMP_NTZ,      -- NULL = current record
IS_CURRENT_FLAG BOOLEAN DEFAULT TRUE
```

## RAW Layer Patterns

### Staged File Data

```sql
CREATE TABLE RAW.EQUIPMENT_READINGS_STAGE (
    EQUIPMENT_ID VARCHAR(50),
    READING_TIMESTAMP VARCHAR(50),    -- Keep as STRING in RAW
    TEMPERATURE_VALUE VARCHAR(20),    -- Cast in ATOMIC

    _SOURCE_FILE_NAME VARCHAR(500),
    _SOURCE_FILE_ROW_NUMBER NUMBER,
    _LOADED_TIMESTAMP TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
```

### CDC Data

```sql
CREATE TABLE RAW.CUSTOMER_CDC (
    CUSTOMER_ID NUMBER,
    CUSTOMER_NAME VARCHAR(200),
    EMAIL VARCHAR(200),
    STATUS VARCHAR(20),

    _CDC_OPERATION VARCHAR(10),
    _CDC_TIMESTAMP TIMESTAMP_NTZ,
    _CDC_SEQUENCE NUMBER,
    _CDC_SOURCE_SYSTEM VARCHAR(50),
    _LOADED_TIMESTAMP TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
```

### API Response Data

```sql
CREATE TABLE RAW.API_WEATHER_RESPONSES (
    REQUEST_ID VARCHAR(100),
    REQUEST_TIMESTAMP TIMESTAMP_NTZ,
    RESPONSE_PAYLOAD VARIANT,        -- Store full JSON response
    HTTP_STATUS_CODE NUMBER,
    _LOADED_TIMESTAMP TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
```

## ATOMIC Layer Patterns

```sql
CREATE TABLE ATOMIC.ASSET (
    ASSET_ID NUMBER(38,0) NOT NULL,
    ASSET_CODE VARCHAR(100) NOT NULL,
    ASSET_NAME VARCHAR(200),
    PARENT_ASSET_ID NUMBER(38,0),

    -- Type 2 SCD columns
    VALID_FROM_TIMESTAMP TIMESTAMP_NTZ NOT NULL,
    VALID_TO_TIMESTAMP TIMESTAMP_NTZ,
    IS_CURRENT_FLAG BOOLEAN DEFAULT TRUE,

    -- Audit columns
    CREATED_BY_USER VARCHAR(100),
    CREATED_TIMESTAMP TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    UPDATED_BY_USER VARCHAR(100),
    UPDATED_TIMESTAMP TIMESTAMP_NTZ,

    PRIMARY KEY (ASSET_ID)
);

COMMENT ON TABLE ATOMIC.ASSET IS 'Physical or logical assets owned by the organization';
```

## DATA_MART Layer Patterns

### Denormalized View

```sql
CREATE OR REPLACE VIEW {DATA_MART}.PRODUCTION_BATCH_SUMMARY AS
SELECT
    pr.PRODUCTION_RUN_ID,
    pr.BATCH_NUMBER,
    p.PRODUCT_NAME,
    wc.WORK_CENTER_CODE,
    pr.YIELD_PERCENTAGE,
    pr.CYCLE_TIME_MINUTES,
    CASE WHEN pr.YIELD_PERCENTAGE >= 95 THEN 'GOLDEN' ELSE 'STANDARD' END AS BATCH_CLASSIFICATION
FROM ATOMIC.PRODUCTION_RUN pr
JOIN ATOMIC.PRODUCT p ON pr.PRODUCT_ID = p.PRODUCT_ID AND p.IS_CURRENT_FLAG = TRUE
JOIN ATOMIC.WORK_CENTER wc ON pr.WORK_CENTER_ID = wc.WORK_CENTER_ID
WHERE pr.PRODUCTION_STATUS = 'COMPLETED';
```

### Aggregation Table

```sql
CREATE OR REPLACE TABLE {DATA_MART}.DAILY_YIELD_METRICS AS
SELECT
    PRODUCTION_DATE,
    PRODUCT_CATEGORY,
    COUNT(*) AS BATCH_COUNT,
    AVG(YIELD_PERCENTAGE) AS AVG_YIELD,
    COUNT_IF(YIELD_PERCENTAGE >= 95) AS GOLDEN_BATCH_COUNT,
    CURRENT_TIMESTAMP() AS _REFRESHED_TIMESTAMP
FROM {DATA_MART}.PRODUCTION_BATCH_SUMMARY
GROUP BY PRODUCTION_DATE, PRODUCT_CATEGORY;
```

## Transformation Approaches

See `references/transformation-approaches.md` for the full decision framework
with SQL examples for each approach (Views, Materialized Views, Dynamic Tables,
Stored Procedures, Streams+Tasks).

### Quick Reference

| Use When | Approach |
|----------|----------|
| Simple transforms, real-time accuracy | **Views** |
| Expensive aggregations, predictable queries | **Materialized Views** |
| Multi-step pipelines, declarative preferred | **Dynamic Tables** |
| Complex logic, conditional processing | **Stored Procedures** |
| CDC processing, near-real-time | **Streams + Tasks** |

## DATA_MART Naming

| Project Type | Example Schema | Description |
|--------------|----------------|-------------|
| Yield Optimization | `YO_SWEET_SPOT` | Manufacturing yield data |
| Supply Chain Risk | `SCR_ANALYTICS` | Supply chain risk assessment |
| Customer 360 | `CUSTOMER_360` | Unified customer view |
| Predictive Maintenance | `PREDICTIVE_MAINT` | Equipment failure prediction |
| Fraud Detection | `FRAUD_DETECTION` | Financial fraud analytics |

## Data Dictionary Reference

Before designing ATOMIC entities, consult the industry data dictionaries in
`references/dictionaries/` for standard entity definitions and column naming.

### Available Dictionaries

| File | Industry | Key Entities |
|------|----------|-------------|
| `core.data_dictionary.csv` | Core | Base enterprise entities (start here) |
| `data_dictionary_ATOMIC.csv` | ATOMIC layer | Standard ATOMIC entities |
| `data_dictionary_AEROSPACE.csv` | Aerospace | Aircraft, defense manufacturing |
| `data_dictionary_AGRICULTURE.csv` | Agriculture | Farming, crop management |
| `data_dictionary_AUTOMOTIVE.csv` | Automotive | Vehicle manufacturing |
| `data_dictionary_CLM.csv` | Contract Lifecycle | Contract management |
| `data_dictionary_CONNECTED_PRODUCTS.csv` | Connected Products | IoT products, telemetry |
| `data_dictionary_CONSTRUCTION.csv` | Construction | Building, infrastructure |
| `data_dictionary_DIGITAL_TWIN.csv` | Digital Twin | IoT, simulation, asset models |
| `data_dictionary_ENERGY_TRADING.csv` | Energy Trading | Power markets, trading |
| `data_dictionary_FACILITY_SITE_MANAGEMENT.csv` | Facility Mgmt | Sites, buildings, maintenance |
| `data_dictionary_GENERAL_REFERENCE.csv` | General | Cross-industry reference data |
| `data_dictionary_MINING.csv` | Mining | Extraction, minerals processing |
| `data_dictionary_OG.csv` | Oil & Gas | Upstream, midstream, downstream |
| `data_dictionary_PROCESS_MANUFACTURING.csv` | Process Mfg | Chemical, pharma, food & bev |
| `data_dictionary_REGULATORY.csv` | Regulatory | Compliance, certifications |
| `data_dictionary_SHIPMENT_FULFILLMENT.csv` | Logistics | Shipping, delivery |
| `data_dictionary_SUSTAINABILITY_ESG.csv` | ESG | Environmental, social, governance |
| `data_dictionary_TECHNOLOGY_MANUFACTURING.csv` | Tech Mfg | Electronics, semiconductors |
| `data_dictionary_UTILITIES.csv` | Utilities | Power, water, gas distribution |

**Usage**: Open the relevant CSV during spec generation. Use entity names, column
names, and data types from the dictionary as the starting point for ATOMIC tables.

## Anti-Patterns

| Anti-Pattern | Why It's Wrong | Correct Approach |
|--------------|----------------|------------------|
| Transforming in RAW | Loses original data fidelity | Transform in ATOMIC or later |
| Using strict types in RAW | Causes load failures | Use VARCHAR, parse in ATOMIC |
| Skipping metadata columns | Loses lineage/audit info | Always include `_LOADED_TIMESTAMP` |
| Creating views in RAW | RAW is for persistence only | Views belong in ATOMIC or DATA_MART |
| Generic DATA_MART name | Not meaningful to consumers | Use project-specific names |
| No audit columns in ATOMIC | Loses change tracking | Always include `CREATED_*`, `UPDATED_*` |
| Skipping RAW layer | Loses source realism | Always create RAW even for simple solutions |

## Pre-Flight Checklist

Before finalizing data architecture in spec:

- [ ] RAW schema created with realistic source representation
- [ ] RAW tables use VARCHAR for source fields (proper typing in ATOMIC)
- [ ] CDC tables include `_CDC_OPERATION`, `_CDC_TIMESTAMP` columns
- [ ] Audit columns on all ATOMIC tables (`CREATED_*`, `UPDATED_*`)
- [ ] Type 2 SCD implemented where history required
- [ ] DATA_MART schema named meaningfully for the data product
- [ ] Consumer-facing views optimized for query patterns
- [ ] Transformation approach matches complexity (simplest that works)
- [ ] Lineage traceable from RAW through DATA_MART
- [ ] Industry data dictionary consulted for entity naming

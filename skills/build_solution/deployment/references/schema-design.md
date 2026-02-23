# Snowflake Schema Design Reference

Guidelines for organizing databases, schemas, and tables in Snowflake.

## Database Organization

### Single Database Pattern (Recommended for Demos)

```sql
-- One database, one schema for simplicity
CREATE DATABASE my_project;
DROP SCHEMA my_project.PUBLIC;  -- Remove auto-created PUBLIC schema
CREATE SCHEMA my_project.main;

USE DATABASE my_project;
USE SCHEMA main;
```

### Multi-Schema Pattern

```sql
-- Separate schemas by purpose
CREATE DATABASE analytics;
CREATE SCHEMA analytics.raw;        -- Landing zone
CREATE SCHEMA analytics.staging;    -- Transformation
CREATE SCHEMA analytics.curated;    -- Final models
CREATE SCHEMA analytics.reporting;  -- Views for BI tools
```

### Environment Pattern

```sql
-- Separate by environment
CREATE DATABASE dev_analytics;
CREATE DATABASE test_analytics;
CREATE DATABASE prod_analytics;

-- Or use prefixes in one account
-- DEV_ANALYTICS, TEST_ANALYTICS, PROD_ANALYTICS
```

## Schema Naming Conventions

### Prefixes by Purpose

| Prefix | Purpose | Example |
|--------|---------|---------|
| `RAW_` | Ingested data, no transformation | `RAW_SALESFORCE` |
| `STG_` | Staging/transformation | `STG_ORDERS` |
| `DIM_` | Dimension tables | `DIM_CUSTOMER` |
| `FACT_` | Fact tables | `FACT_SALES` |
| `AGG_` | Aggregated tables | `AGG_MONTHLY_SALES` |
| `RPT_` | Reporting views | `RPT_SALES_DASHBOARD` |

### Layer Organization

```
database/
├── raw/              # Ingested data (EL)
│   ├── salesforce/   # Source-specific schemas
│   ├── stripe/
│   └── segment/
├── staging/          # Transformation (T)
│   ├── stg_orders
│   └── stg_customers
├── marts/            # Business models
│   ├── dim_customer
│   ├── dim_product
│   └── fact_sales
└── reporting/        # BI-ready views
    ├── rpt_revenue
    └── rpt_customers
```

## Table Design Patterns

### Dimension Table

```sql
CREATE TABLE dim_customer (
    -- Surrogate key
    customer_key INT NOT NULL,
    
    -- Natural key
    customer_id VARCHAR(50) NOT NULL,  -- Source system ID
    
    -- Attributes
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    
    -- Hierarchy
    region VARCHAR(50),
    country VARCHAR(50),
    state VARCHAR(50),
    city VARCHAR(100),
    
    -- Type 1: Current value only
    phone VARCHAR(20),
    
    -- Flags
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit
    source_system VARCHAR(50),
    loaded_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    
    PRIMARY KEY (customer_key)
);
```

### Fact Table

```sql
CREATE TABLE fact_sales (
    -- Date key (partition/cluster)
    sale_date DATE NOT NULL,
    
    -- Dimension keys
    customer_key INT NOT NULL,
    product_key INT NOT NULL,
    store_key INT NOT NULL,
    
    -- Degenerate dimensions (no separate dim table)
    order_number VARCHAR(50) NOT NULL,
    line_number INT NOT NULL,
    
    -- Measures
    quantity INT NOT NULL,
    unit_price NUMBER(10,2) NOT NULL,
    discount_amount NUMBER(10,2) DEFAULT 0,
    tax_amount NUMBER(10,2) DEFAULT 0,
    total_amount NUMBER(12,2) NOT NULL,
    
    -- Audit
    source_system VARCHAR(50),
    batch_id VARCHAR(100),
    loaded_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    
    PRIMARY KEY (order_number, line_number)
)
CLUSTER BY (sale_date, customer_key);
```

### Staging Table

```sql
CREATE TABLE stg_orders (
    -- All VARCHAR for flexibility during load
    order_id VARCHAR(100),
    customer_id VARCHAR(100),
    order_date VARCHAR(100),
    amount VARCHAR(100),
    status VARCHAR(100),
    
    -- Or VARIANT for complete flexibility
    raw_record VARIANT,
    
    -- Load metadata
    _source_file VARCHAR(500),
    _file_row_number INT,
    _loaded_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    _batch_id VARCHAR(100)
);
```

## Naming Conventions

### Tables

| Element | Convention | Example |
|---------|------------|---------|
| Dimension table | `dim_<entity>` | `dim_customer`, `dim_product` |
| Fact table | `fact_<process>` | `fact_sales`, `fact_inventory` |
| Staging table | `stg_<source>_<entity>` | `stg_salesforce_accounts` |
| Aggregate table | `agg_<period>_<metric>` | `agg_daily_sales` |

### Columns

| Element | Convention | Example |
|---------|------------|---------|
| Surrogate key | `<table>_key` | `customer_key` |
| Natural key | `<entity>_id` | `customer_id` |
| Foreign key | `<referenced_table>_key` | `customer_key` |
| Date column | `<action>_date` | `order_date`, `ship_date` |
| Timestamp column | `<action>_at` | `created_at`, `updated_at` |
| Boolean column | `is_<state>` or `has_<property>` | `is_active`, `has_verified` |
| Count column | `<entity>_count` | `order_count` |
| Amount column | `<type>_amount` | `discount_amount` |

### Case Style

```sql
-- Snowflake default: UPPERCASE
-- Recommended: Use quotes to preserve case or stick with uppercase

-- UPPERCASE (Snowflake default, no quotes needed)
CREATE TABLE CUSTOMER (
    CUSTOMER_ID INT,
    FIRST_NAME VARCHAR(100)
);

-- lowercase with quotes (if preferred)
CREATE TABLE "customer" (
    "customer_id" INT,
    "first_name" VARCHAR(100)
);

-- Recommendation: Use UPPERCASE, avoid quotes
```

## Clustering

Optimize for common query patterns:

```sql
-- Single column cluster (date-based)
CREATE TABLE events (
    event_date DATE,
    event_type VARCHAR(50),
    user_id INT,
    payload VARIANT
)
CLUSTER BY (event_date);

-- Multi-column cluster (common filter + join)
CREATE TABLE fact_sales (
    sale_date DATE,
    customer_key INT,
    amount NUMBER(12,2)
)
CLUSTER BY (sale_date, customer_key);

-- Automatic reclustering
ALTER TABLE fact_sales RESUME RECLUSTER;
```

### When to Cluster

| Scenario | Cluster By |
|----------|-----------|
| Time-series queries | Date/timestamp column |
| Dimension lookups | Foreign key columns |
| Multi-tenant | Tenant ID |
| Frequent filters | Filtered column(s) |

## Views

### Standard View

```sql
CREATE OR REPLACE VIEW rpt_customer_orders AS
SELECT 
    c.customer_key,
    c.first_name,
    c.last_name,
    COUNT(f.order_number) AS order_count,
    SUM(f.total_amount) AS total_revenue
FROM dim_customer c
LEFT JOIN fact_sales f ON c.customer_key = f.customer_key
GROUP BY 1, 2, 3;
```

### Secure View (Hide Definition)

```sql
CREATE OR REPLACE SECURE VIEW sensitive_data AS
SELECT 
    customer_id,
    first_name,
    -- Hide implementation details
    CASE WHEN role_has_privilege('ADMIN') 
         THEN email 
         ELSE '***@***' 
    END AS email
FROM customers;
```

### Materialized View

```sql
-- Pre-computed, auto-refreshed
CREATE OR REPLACE MATERIALIZED VIEW mv_daily_sales AS
SELECT 
    sale_date,
    SUM(total_amount) AS daily_revenue,
    COUNT(*) AS order_count
FROM fact_sales
GROUP BY sale_date;
```

## Transient vs Permanent Tables

| Type | Time Travel | Fail-safe | Use Case |
|------|-------------|-----------|----------|
| Permanent | Yes (default 1 day) | 7 days | Production data |
| Transient | Yes (max 1 day) | None | Staging, temp work |
| Temporary | Session only | None | Session scratch |

```sql
-- Transient (no fail-safe, lower storage cost)
CREATE TRANSIENT TABLE stg_temp_data (
    id INT,
    data VARCHAR
);

-- Temporary (exists only in session)
CREATE TEMPORARY TABLE session_scratch (
    id INT,
    data VARCHAR
);
```

## Best Practices Summary

1. **One database per project** for demos (simplicity)
2. **Separate schemas by layer** (raw, staging, marts)
3. **Use naming conventions consistently** (dim_, fact_, stg_)
4. **Cluster fact tables** on date + common foreign keys
5. **Use transient tables** for staging/temporary data
6. **Document in comments** since CHECK constraints don't work
7. **Create views** for reporting to hide complexity
8. **Use TIMESTAMP_NTZ** for all timestamps (UTC-normalized)


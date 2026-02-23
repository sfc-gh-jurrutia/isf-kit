-- ============================================================================
-- Snowflake DDL Table Templates
-- Common patterns for creating tables with proper constraint handling
-- ============================================================================

-- ============================================================================
-- TEMPLATE 1: Basic Transactional Table
-- Use for: Orders, transactions, events with fixed schema
-- ============================================================================
CREATE OR REPLACE TABLE template_transactional (
    -- Primary key (NOT enforced - validate uniqueness in application)
    id INT NOT NULL,
    
    -- Foreign key reference (NOT enforced - validate in application)
    parent_id INT,
    
    -- Required fields (NOT NULL IS enforced)
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- Valid: PENDING, ACTIVE, COMPLETED, CANCELLED
    
    -- Optional fields
    description TEXT,
    amount NUMBER(12,2),  -- Precision for currency
    
    -- Audit columns
    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    created_by VARCHAR(100),
    
    -- Metadata-only constraints (help query optimizer)
    PRIMARY KEY (id),
    FOREIGN KEY (parent_id) REFERENCES template_transactional(id)
);


-- ============================================================================
-- TEMPLATE 2: Dimension Table (Master Data)
-- Use for: Customers, products, locations - reference data
-- ============================================================================
CREATE OR REPLACE TABLE template_dimension (
    -- Surrogate key
    dim_key INT NOT NULL,
    
    -- Natural/business key (document uniqueness requirement)
    business_code VARCHAR(50) NOT NULL,  -- Must be unique (enforce in app/ETL)
    
    -- Descriptive attributes
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    
    -- Hierarchical attributes
    parent_code VARCHAR(50),  -- Self-referencing hierarchy
    level_1 VARCHAR(100),
    level_2 VARCHAR(100),
    level_3 VARCHAR(100),
    
    -- Status and validity
    is_active BOOLEAN DEFAULT TRUE,
    valid_from DATE DEFAULT CURRENT_DATE(),
    valid_to DATE DEFAULT '9999-12-31',
    
    -- Audit
    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    
    PRIMARY KEY (dim_key)
);


-- ============================================================================
-- TEMPLATE 3: Fact Table (Analytics)
-- Use for: Metrics, aggregates, time-series data
-- ============================================================================
CREATE OR REPLACE TABLE template_fact (
    -- Date dimension (partition/cluster key)
    fact_date DATE NOT NULL,
    
    -- Dimension keys (foreign keys - NOT enforced)
    customer_key INT NOT NULL,
    product_key INT NOT NULL,
    location_key INT,
    
    -- Measures (additive facts)
    quantity INT DEFAULT 0,
    unit_price NUMBER(10,2),
    discount_amount NUMBER(10,2) DEFAULT 0,
    total_amount NUMBER(12,2) NOT NULL,
    
    -- Semi-additive measures
    balance NUMBER(14,2),
    
    -- Non-additive measures  
    unit_cost NUMBER(10,2),
    margin_pct NUMBER(5,4),  -- Store as decimal: 0.2500 = 25%
    
    -- Load tracking
    batch_id INT,
    loaded_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
) 
CLUSTER BY (fact_date, customer_key);  -- Optimize for common query patterns


-- ============================================================================
-- TEMPLATE 4: Semi-Structured Data (JSON/Flexible Schema)
-- Use for: Events, logs, API responses, dynamic attributes
-- ============================================================================
CREATE OR REPLACE TABLE template_semi_structured (
    -- Fixed columns for common queries
    id INT NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_time TIMESTAMP_NTZ NOT NULL,
    
    -- Semi-structured payload (flexible schema)
    payload VARIANT,          -- Full JSON document
    
    -- Extracted common fields for performance
    user_id VARCHAR(100),     -- Extracted from payload for indexing
    session_id VARCHAR(100),  -- Extracted from payload for indexing
    
    -- Additional semi-structured types
    tags ARRAY,               -- Array of strings: ['tag1', 'tag2']
    properties OBJECT,        -- Key-value pairs: {'key': 'value'}
    
    -- Metadata
    source VARCHAR(50),
    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    
    PRIMARY KEY (id)
)
CLUSTER BY (event_time, event_type);


-- ============================================================================
-- TEMPLATE 5: Staging Table (ETL Landing)
-- Use for: Raw data ingestion, initial landing zone
-- ============================================================================
CREATE OR REPLACE TABLE template_staging (
    -- All columns as VARCHAR for flexibility
    col_1 VARCHAR(16777216),
    col_2 VARCHAR(16777216),
    col_3 VARCHAR(16777216),
    col_4 VARCHAR(16777216),
    col_5 VARCHAR(16777216),
    
    -- Or use VARIANT for complete flexibility
    raw_data VARIANT,
    
    -- Load metadata
    filename VARCHAR(500),
    file_row_number INT,
    load_timestamp TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    batch_id VARCHAR(100)
);


-- ============================================================================
-- TEMPLATE 6: Slowly Changing Dimension (Type 2)
-- Use for: Historical tracking of dimension changes
-- ============================================================================
CREATE OR REPLACE TABLE template_scd2 (
    -- Surrogate key (unique per version)
    scd_key INT NOT NULL,
    
    -- Natural key (same across versions)
    natural_key VARCHAR(100) NOT NULL,
    
    -- Tracked attributes (changes create new version)
    attribute_1 VARCHAR(255),
    attribute_2 VARCHAR(255),
    attribute_3 NUMBER(10,2),
    
    -- SCD2 metadata
    effective_from TIMESTAMP_NTZ NOT NULL,
    effective_to TIMESTAMP_NTZ DEFAULT '9999-12-31 23:59:59',
    is_current BOOLEAN DEFAULT TRUE,
    version_number INT DEFAULT 1,
    
    -- Hash for change detection
    row_hash VARCHAR(64),  -- SHA256 of tracked attributes
    
    -- Audit
    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    
    PRIMARY KEY (scd_key)
);


-- ============================================================================
-- TEMPLATE 7: Audit/History Table
-- Use for: Tracking all changes to a table
-- ============================================================================
CREATE OR REPLACE TABLE template_audit (
    audit_id INT NOT NULL,
    
    -- What changed
    table_name VARCHAR(255) NOT NULL,
    record_id VARCHAR(255) NOT NULL,  -- PK of audited record
    operation VARCHAR(10) NOT NULL,   -- INSERT, UPDATE, DELETE
    
    -- Change details
    old_values VARIANT,               -- JSON of previous values
    new_values VARIANT,               -- JSON of new values
    changed_columns ARRAY,            -- List of columns that changed
    
    -- Who/when
    changed_by VARCHAR(100),
    changed_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    
    -- Context
    session_id VARCHAR(100),
    query_id VARCHAR(100),
    
    PRIMARY KEY (audit_id)
)
CLUSTER BY (table_name, changed_at);


-- ============================================================================
-- EXAMPLE: Insert with Semi-Structured Data
-- ============================================================================
/*
INSERT INTO template_semi_structured (id, event_type, event_time, payload, tags, properties, user_id, source)
SELECT
    1,
    'page_view',
    CURRENT_TIMESTAMP(),
    PARSE_JSON('{
        "page": "/products",
        "referrer": "https://google.com",
        "duration_ms": 1500,
        "device": {"type": "mobile", "os": "iOS"}
    }'),
    ARRAY_CONSTRUCT('web', 'mobile', 'organic'),
    OBJECT_CONSTRUCT('campaign', 'summer_sale', 'variant', 'A'),
    'user_12345',
    'web_tracker';
*/


-- ============================================================================
-- EXAMPLE: Query Semi-Structured Data
-- ============================================================================
/*
SELECT 
    id,
    event_type,
    payload:page::STRING AS page,
    payload:duration_ms::INT AS duration_ms,
    payload:device:type::STRING AS device_type,
    tags[0]::STRING AS first_tag,
    properties:campaign::STRING AS campaign
FROM template_semi_structured
WHERE event_type = 'page_view'
  AND payload:duration_ms > 1000;
*/


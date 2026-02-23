# Snowflake Data Types Reference

Complete guide to Snowflake data types for DDL.

## Numeric Types

### Integer Types

| Type | Aliases | Range | Storage |
|------|---------|-------|---------|
| NUMBER(38,0) | INT, INTEGER, BIGINT, SMALLINT, TINYINT, BYTEINT | ±99,999,999,999,999,999,999,999,999,999,999,999,999 | Variable |

**Note**: All integer types are aliases for `NUMBER(38,0)`. There's no storage difference.

```sql
CREATE TABLE numeric_examples (
    id INT,                    -- Same as NUMBER(38,0)
    big_id BIGINT,            -- Same as NUMBER(38,0)
    small_id SMALLINT         -- Same as NUMBER(38,0)
);
```

### Decimal/Fixed-Point

| Type | Description | Example |
|------|-------------|---------|
| NUMBER(p,s) | Precision p (1-38), scale s (0-p) | NUMBER(10,2) for currency |
| DECIMAL(p,s) | Alias for NUMBER | Same as NUMBER |
| NUMERIC(p,s) | Alias for NUMBER | Same as NUMBER |

```sql
CREATE TABLE financial (
    amount NUMBER(12,2),       -- Up to 9,999,999,999.99
    rate NUMBER(5,4),          -- Up to 9.9999 (e.g., 0.0525 for 5.25%)
    quantity NUMBER(10,0)      -- Integer up to 9,999,999,999
);
```

### Floating-Point

| Type | Aliases | Precision | Use Case |
|------|---------|-----------|----------|
| FLOAT | FLOAT4, FLOAT8, DOUBLE, DOUBLE PRECISION, REAL | ~15 significant digits | Scientific calculations |

```sql
CREATE TABLE measurements (
    temperature FLOAT,
    latitude DOUBLE PRECISION,
    coefficient REAL
);
```

**Warning**: FLOAT has precision limitations. Use NUMBER for financial calculations.

```sql
-- FLOAT precision issue:
SELECT 0.1 + 0.2;  -- May not equal exactly 0.3

-- Use NUMBER for exact decimals:
SELECT 0.1::NUMBER(10,2) + 0.2::NUMBER(10,2);  -- Exactly 0.30
```

## String Types

| Type | Max Length | Notes |
|------|------------|-------|
| VARCHAR(n) | 16,777,216 bytes | Variable length, recommended |
| STRING | 16,777,216 bytes | Alias for VARCHAR |
| TEXT | 16,777,216 bytes | Alias for VARCHAR |
| CHAR(n) | 16,777,216 bytes | Fixed length, space-padded |

```sql
CREATE TABLE text_examples (
    name VARCHAR(255),          -- Variable length up to 255
    description TEXT,           -- Variable length, no limit specified
    code CHAR(10),             -- Fixed 10 chars, space-padded
    notes STRING               -- Alias for VARCHAR
);
```

### String Best Practices

```sql
-- Specify length for clarity and documentation
email VARCHAR(255),            -- Standard email max
phone VARCHAR(20),             -- International format
country_code CHAR(2),          -- ISO 3166-1 alpha-2
uuid VARCHAR(36)               -- Standard UUID format

-- No length = max length (16MB)
description VARCHAR            -- Same as VARCHAR(16777216)
```

## Boolean Type

```sql
CREATE TABLE flags (
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    has_verified BOOLEAN           -- NULL = unknown
);

-- Valid values:
-- TRUE, FALSE, NULL
-- 'true', 'false', 't', 'f', 'yes', 'no', 'on', 'off', '1', '0'
```

## Date and Time Types

### Date

```sql
CREATE TABLE dates (
    birth_date DATE,                    -- YYYY-MM-DD
    valid_from DATE DEFAULT CURRENT_DATE(),
    valid_to DATE DEFAULT '9999-12-31'  -- Far future for "no end"
);
```

### Time

```sql
CREATE TABLE times (
    start_time TIME,                    -- HH:MI:SS.FFFFFFFFF
    end_time TIME(0)                    -- HH:MI:SS (no fractional seconds)
);
```

### Timestamp Types

| Type | Stores | Use Case |
|------|--------|----------|
| TIMESTAMP_NTZ | No timezone | UTC-normalized data, most common |
| TIMESTAMP_LTZ | Session timezone | Display in user's local time |
| TIMESTAMP_TZ | With offset | Preserve original timezone |
| TIMESTAMP | Alias for TIMESTAMP_NTZ | Default |

```sql
CREATE TABLE timestamps (
    -- TIMESTAMP_NTZ (No Time Zone) - Recommended default
    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    
    -- TIMESTAMP_LTZ (Local Time Zone) - Session-dependent
    local_time TIMESTAMP_LTZ,
    
    -- TIMESTAMP_TZ (With Time Zone) - Preserves offset
    event_time TIMESTAMP_TZ
);

-- Example values:
-- TIMESTAMP_NTZ: 2024-01-15 14:30:00.000
-- TIMESTAMP_LTZ: 2024-01-15 14:30:00.000 -0800 (depends on session)
-- TIMESTAMP_TZ:  2024-01-15 14:30:00.000 -0500 (preserves original)
```

### Choosing Timestamp Type

| Scenario | Recommended Type |
|----------|------------------|
| Audit/created/updated timestamps | TIMESTAMP_NTZ |
| Event times from multiple sources | TIMESTAMP_TZ |
| Display to users in their timezone | TIMESTAMP_LTZ |
| Data warehouse fact tables | TIMESTAMP_NTZ |

## Semi-Structured Types

### VARIANT

Stores any JSON-compatible value (object, array, string, number, boolean, null).

```sql
CREATE TABLE events (
    event_id INT,
    payload VARIANT          -- Flexible JSON structure
);

-- Insert JSON
INSERT INTO events VALUES (1, PARSE_JSON('{"action": "click", "target": "button"}'));

-- Query nested values
SELECT 
    payload:action::STRING AS action,
    payload:target::STRING AS target
FROM events;
```

### OBJECT

Stores key-value pairs (JSON object).

```sql
CREATE TABLE configs (
    config_id INT,
    settings OBJECT          -- Key-value pairs only
);

-- Insert
INSERT INTO configs VALUES (1, OBJECT_CONSTRUCT('theme', 'dark', 'language', 'en'));

-- Query
SELECT settings:theme::STRING FROM configs;
```

### ARRAY

Stores ordered list of values.

```sql
CREATE TABLE lists (
    list_id INT,
    tags ARRAY               -- Ordered list
);

-- Insert
INSERT INTO lists VALUES (1, ARRAY_CONSTRUCT('tag1', 'tag2', 'tag3'));

-- Query
SELECT 
    tags[0]::STRING AS first_tag,
    ARRAY_SIZE(tags) AS tag_count
FROM lists;
```

### Semi-Structured Best Practices

```sql
-- Extract frequently-queried fields for performance
CREATE TABLE events (
    event_id INT NOT NULL,
    event_type VARCHAR(100),         -- Extracted for filtering
    user_id VARCHAR(100),            -- Extracted for joining
    payload VARIANT,                 -- Full flexible data
    created_at TIMESTAMP_NTZ
)
CLUSTER BY (event_type, created_at); -- Cluster on extracted fields
```

## Binary Types

| Type | Max Size | Use Case |
|------|----------|----------|
| BINARY(n) | 8 MB | Fixed-length binary |
| VARBINARY(n) | 8 MB | Variable-length binary |

```sql
CREATE TABLE files (
    file_id INT,
    content BINARY,
    hash BINARY(32)          -- SHA-256 hash (32 bytes)
);
```

## Geospatial Types

| Type | Description |
|------|-------------|
| GEOGRAPHY | Spherical Earth coordinates (lat/long) |
| GEOMETRY | Planar coordinates |

```sql
CREATE TABLE locations (
    location_id INT,
    point GEOGRAPHY,                              -- Point on Earth
    area GEOGRAPHY                                -- Polygon/area
);

-- Insert point
INSERT INTO locations VALUES (
    1,
    ST_MAKEPOINT(-122.4194, 37.7749),            -- San Francisco
    NULL
);

-- Query distance
SELECT ST_DISTANCE(point, ST_MAKEPOINT(-118.2437, 34.0522)) / 1000 AS km_to_la
FROM locations;
```

## Type Conversion

### Implicit Conversion

Snowflake automatically converts between compatible types:

```sql
-- String to number (if valid)
SELECT '123' + 1;  -- Returns 124

-- Number to string in concatenation
SELECT 'ID: ' || 123;  -- Returns 'ID: 123'
```

### Explicit Conversion (CAST)

```sql
-- CAST syntax
SELECT CAST(amount AS VARCHAR);
SELECT CAST('2024-01-15' AS DATE);

-- :: shorthand
SELECT amount::VARCHAR;
SELECT '2024-01-15'::DATE;
```

### Safe Conversion (TRY_CAST)

```sql
-- Returns NULL instead of error for invalid conversions
SELECT TRY_CAST('not a number' AS INT);  -- Returns NULL
SELECT TRY_CAST('2024-13-45' AS DATE);   -- Returns NULL (invalid date)
```

### Common Conversions

| From | To | Example |
|------|-----|---------|
| STRING | DATE | `'2024-01-15'::DATE` |
| STRING | TIMESTAMP | `'2024-01-15 10:30:00'::TIMESTAMP_NTZ` |
| NUMBER | VARCHAR | `123::VARCHAR` |
| VARCHAR | NUMBER | `'123.45'::NUMBER(10,2)` |
| VARIANT | STRING | `payload:field::STRING` |
| VARIANT | INT | `payload:count::INT` |

## Type Selection Guidelines

| Data | Recommended Type | Reasoning |
|------|------------------|-----------|
| Primary key | INT or VARCHAR(36) | INT for sequences, VARCHAR for UUIDs |
| Currency | NUMBER(12,2) | Exact decimal precision |
| Percentages | NUMBER(5,4) | Store 0.0525 for 5.25% |
| Timestamps | TIMESTAMP_NTZ | UTC-normalized, consistent |
| Status codes | VARCHAR(20) | With NOT NULL and comment |
| Flexible JSON | VARIANT | Schema evolution |
| Flags | BOOLEAN | Clear semantics |
| Large text | TEXT | No length needed |


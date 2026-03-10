# Dimension Table Patterns

Detailed Snowflake SQL patterns for dimension types and SCD strategies. Loaded from SKILL.md when designing dimensions.

---

## Dimension Table Structure

Every dimension table follows this base pattern:

```sql
CREATE TABLE dim_customer (
  customer_key    INTEGER AUTOINCREMENT PRIMARY KEY,  -- surrogate key
  customer_id     VARCHAR NOT NULL,                   -- natural/source key
  customer_name   VARCHAR,
  email           VARCHAR,
  segment         VARCHAR,
  region          VARCHAR,
  country         VARCHAR,
  effective_from  DATE NOT NULL DEFAULT CURRENT_DATE(),
  effective_to    DATE NOT NULL DEFAULT '9999-12-31',
  is_current      BOOLEAN NOT NULL DEFAULT TRUE,
  loaded_at       TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  source_system   VARCHAR
);
```

**Key principles**:
- **Surrogate key**: Always use a synthetic key (`AUTOINCREMENT` or `SEQUENCE`). Natural keys couple your model to source systems.
- **Denormalized**: Flatten hierarchies into the dimension. Do not snowflake unless there is a compelling reason (mini-dimension, extremely large shared hierarchy).
- **Descriptive**: Prefer full text values over codes. Store `region = 'North America'` not `region_code = 'NA'`.
- **Unknown row**: Always insert a default unknown row (surrogate_key = -1) for referential integrity when source data has NULLs.

```sql
INSERT INTO dim_customer (customer_key, customer_id, customer_name, segment, region, country)
VALUES (-1, 'UNKNOWN', 'Unknown Customer', 'Unknown', 'Unknown', 'Unknown');
```

---

## SCD Type 0 -- Retain Original

**Never update the attribute.** The value assigned when the row was first loaded is permanent.

**Use when**: The original value has business meaning that should never change (original credit score at loan origination, date of first purchase).

```sql
-- No UPDATE logic needed. Simply INSERT on first load, ignore subsequent changes.
INSERT INTO dim_customer (customer_id, original_credit_score, effective_from)
SELECT s.customer_id, s.credit_score, CURRENT_DATE()
FROM stg_customers s
LEFT JOIN dim_customer d ON s.customer_id = d.customer_id
WHERE d.customer_id IS NULL;
```

---

## SCD Type 1 -- Overwrite

**Replace the old value with the new value.** No history preserved.

**Use when**: Corrections to data errors, or attributes where history has no business value (spelling corrections, updated phone numbers).

```sql
MERGE INTO dim_customer t
USING (
  SELECT customer_id, customer_name, email, phone
  FROM stg_customers
  QUALIFY ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY updated_at DESC) = 1
) s
ON t.customer_id = s.customer_id AND t.is_current = TRUE
WHEN MATCHED AND (
  t.customer_name != s.customer_name OR
  t.email != s.email OR
  t.phone != s.phone
) THEN UPDATE SET
  customer_name = s.customer_name,
  email = s.email,
  phone = s.phone,
  loaded_at = CURRENT_TIMESTAMP()
WHEN NOT MATCHED THEN INSERT (customer_id, customer_name, email, phone)
  VALUES (s.customer_id, s.customer_name, s.email, s.phone);
```

---

## SCD Type 2 -- Add New Row

**Insert a new row for each change, preserving full history.** The most important SCD type.

**Use when**: Business requires historical analysis with the attribute values as they were at the time of each transaction (customer segment changes, employee department transfers, product category reclassification).

### DDL

```sql
CREATE TABLE dim_customer_scd (
  customer_key    INTEGER AUTOINCREMENT PRIMARY KEY,
  customer_id     VARCHAR NOT NULL,
  customer_name   VARCHAR,
  segment         VARCHAR,
  region          VARCHAR,
  effective_from  DATE NOT NULL,
  effective_to    DATE NOT NULL DEFAULT '9999-12-31',
  is_current      BOOLEAN NOT NULL DEFAULT TRUE,
  loaded_at       TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
```

### Backfill -- Full History in One Query

Adapted from the DataExpert.io SCD generation pattern. Uses streak detection to identify change boundaries.

```sql
INSERT INTO dim_customer_scd (customer_id, customer_name, segment, region, effective_from, effective_to, is_current)
WITH streak_started AS (
  SELECT
    customer_id,
    customer_name,
    segment,
    region,
    snapshot_date,
    LAG(segment) OVER (PARTITION BY customer_id ORDER BY snapshot_date) != segment
      OR LAG(segment) OVER (PARTITION BY customer_id ORDER BY snapshot_date) IS NULL
      AS did_change
  FROM stg_customer_history
),
streak_identified AS (
  SELECT *,
    SUM(CASE WHEN did_change THEN 1 ELSE 0 END)
      OVER (PARTITION BY customer_id ORDER BY snapshot_date) AS streak_id
  FROM streak_started
),
aggregated AS (
  SELECT
    customer_id,
    ANY_VALUE(customer_name) AS customer_name,
    segment,
    ANY_VALUE(region) AS region,
    MIN(snapshot_date) AS effective_from,
    MAX(snapshot_date) AS effective_to
  FROM streak_identified
  GROUP BY customer_id, segment, streak_id
)
SELECT
  customer_id,
  customer_name,
  segment,
  region,
  effective_from,
  CASE WHEN effective_to = (SELECT MAX(snapshot_date) FROM stg_customer_history)
       THEN '9999-12-31'::DATE
       ELSE effective_to
  END AS effective_to,
  effective_to = (SELECT MAX(snapshot_date) FROM stg_customer_history) AS is_current
FROM aggregated;
```

### Incremental -- Day-Over-Day

Adapted from the DataExpert.io incremental SCD pattern.

```sql
-- Step 1: Close changed records
UPDATE dim_customer_scd
SET effective_to = :load_date - 1,
    is_current = FALSE
WHERE customer_id IN (
  SELECT s.customer_id
  FROM stg_customers s
  JOIN dim_customer_scd d
    ON s.customer_id = d.customer_id AND d.is_current = TRUE
  WHERE s.segment != d.segment OR s.region != d.region
)
AND is_current = TRUE;

-- Step 2: Insert new current rows for changed + new records
INSERT INTO dim_customer_scd (customer_id, customer_name, segment, region, effective_from, is_current)
SELECT s.customer_id, s.customer_name, s.segment, s.region, :load_date, TRUE
FROM stg_customers s
LEFT JOIN dim_customer_scd d
  ON s.customer_id = d.customer_id AND d.is_current = TRUE
WHERE d.customer_id IS NULL  -- new customer, or existing whose current row was just closed
QUALIFY ROW_NUMBER() OVER (PARTITION BY s.customer_id ORDER BY s.updated_at DESC) = 1;
```

---

## SCD Type 3 -- Add Previous-Value Column

**Store the current and one prior value as separate columns.** Limited history.

**Use when**: Only the current and immediately previous value matter (current_region, previous_region for migration analysis).

```sql
CREATE TABLE dim_customer_type3 (
  customer_key      INTEGER AUTOINCREMENT PRIMARY KEY,
  customer_id       VARCHAR NOT NULL UNIQUE,
  segment           VARCHAR,
  previous_segment  VARCHAR,
  segment_change_date DATE,
  region            VARCHAR
);

-- Update: shift current to previous
MERGE INTO dim_customer_type3 t
USING stg_customers s ON t.customer_id = s.customer_id
WHEN MATCHED AND t.segment != s.segment THEN UPDATE SET
  previous_segment = t.segment,
  segment = s.segment,
  segment_change_date = CURRENT_DATE()
WHEN NOT MATCHED THEN INSERT (customer_id, segment, region)
  VALUES (s.customer_id, s.segment, s.region);
```

---

## SCD Type 6 -- Hybrid (Type 1 + Type 2 + Type 3)

**Type 2 rows plus a Type 1 "current value" column on every row.** Gives both history and fast current-value access.

**Use when**: Analysts frequently need to group historical facts by both the "as-was" and "as-is" values of a dimension attribute.

```sql
CREATE TABLE dim_customer_type6 (
  customer_key       INTEGER AUTOINCREMENT PRIMARY KEY,
  customer_id        VARCHAR NOT NULL,
  segment            VARCHAR NOT NULL,           -- historical value (Type 2)
  current_segment    VARCHAR NOT NULL,           -- current value (Type 1, overwritten on all rows)
  effective_from     DATE NOT NULL,
  effective_to       DATE NOT NULL DEFAULT '9999-12-31',
  is_current         BOOLEAN NOT NULL DEFAULT TRUE
);

-- When a change occurs:
-- 1. Close the current row (Type 2)
-- 2. Insert new current row (Type 2)
-- 3. Update current_segment on ALL rows for this customer_id (Type 1)
UPDATE dim_customer_type6
SET current_segment = :new_segment
WHERE customer_id = :customer_id;
```

---

## Conformed Dimensions

A dimension shared identically across multiple fact tables in the data warehouse. The gold standard for dimensional integration.

**Key rules**:
- Identical structure, keys, and attribute values across all fact tables that reference it
- Managed from a single source process
- Enables "drill across" -- combining metrics from different fact tables

**Common conformed dimensions**: `dim_date`, `dim_customer`, `dim_product`, `dim_geography`

### Enterprise Bus Matrix

Map business processes (rows) to conformed dimensions (columns) to plan your warehouse:

```
                    | dim_date | dim_customer | dim_product | dim_store | dim_promotion |
Orders              |    X     |      X       |      X      |     X     |       X       |
Inventory           |    X     |              |      X      |     X     |               |
Customer Service    |    X     |      X       |      X      |           |               |
Marketing Campaign  |    X     |      X       |             |           |       X       |
```

---

## Calendar/Date Dimension

Every data warehouse needs one. Pre-generate once; load into every environment.

```sql
CREATE TABLE dim_date (
  date_key          INTEGER PRIMARY KEY,          -- YYYYMMDD format
  date_day          DATE NOT NULL UNIQUE,
  day_of_week       SMALLINT NOT NULL,            -- 1=Mon, 7=Sun (ISO)
  day_name          VARCHAR(9) NOT NULL,
  day_of_month      SMALLINT NOT NULL,
  day_of_year       SMALLINT NOT NULL,
  week_of_year      SMALLINT NOT NULL,
  month_number      SMALLINT NOT NULL,
  month_name        VARCHAR(9) NOT NULL,
  quarter_number    SMALLINT NOT NULL,
  year_number       SMALLINT NOT NULL,
  fiscal_quarter    SMALLINT,
  fiscal_year       SMALLINT,
  is_weekend        BOOLEAN NOT NULL,
  is_holiday        BOOLEAN DEFAULT FALSE
);

-- Generate 20 years of dates
INSERT INTO dim_date
SELECT
  TO_NUMBER(TO_CHAR(d.date_day, 'YYYYMMDD'))      AS date_key,
  d.date_day,
  DAYOFWEEKISO(d.date_day)                         AS day_of_week,
  DAYNAME(d.date_day)                              AS day_name,
  DAY(d.date_day)                                  AS day_of_month,
  DAYOFYEAR(d.date_day)                            AS day_of_year,
  WEEKOFYEAR(d.date_day)                           AS week_of_year,
  MONTH(d.date_day)                                AS month_number,
  MONTHNAME(d.date_day)                            AS month_name,
  QUARTER(d.date_day)                              AS quarter_number,
  YEAR(d.date_day)                                 AS year_number,
  NULL                                             AS fiscal_quarter,
  NULL                                             AS fiscal_year,
  DAYOFWEEKISO(d.date_day) IN (6, 7)              AS is_weekend,
  FALSE                                            AS is_holiday
FROM (
  SELECT DATEADD(DAY, SEQ4(), '2015-01-01'::DATE) AS date_day
  FROM TABLE(GENERATOR(ROWCOUNT => 7305))          -- ~20 years
) d;
```

---

## Degenerate Dimensions

A dimension key stored directly in the fact table with no corresponding dimension table. Typically transaction identifiers.

**Examples**: order_number, invoice_id, confirmation_code

```sql
CREATE TABLE fct_order_lines (
  order_line_key  INTEGER AUTOINCREMENT PRIMARY KEY,
  order_number    VARCHAR NOT NULL,              -- degenerate dimension (no dim_order table)
  customer_key    INTEGER NOT NULL,
  product_key     INTEGER NOT NULL,
  date_key        INTEGER NOT NULL,
  quantity        NUMBER(10,2),
  net_amount      NUMBER(12,2)
);
```

---

## Junk Dimensions

Combine miscellaneous low-cardinality flags and indicators into a single dimension to avoid polluting the fact table with many small FK columns.

```sql
CREATE TABLE dim_order_flags (
  order_flag_key    INTEGER AUTOINCREMENT PRIMARY KEY,
  is_rush           BOOLEAN,
  is_gift_wrapped   BOOLEAN,
  payment_type      VARCHAR(20),      -- 'CREDIT', 'DEBIT', 'CASH', 'WIRE'
  shipping_method   VARCHAR(20),      -- 'STANDARD', 'EXPRESS', 'OVERNIGHT'
  order_channel     VARCHAR(20)       -- 'WEB', 'MOBILE', 'IN_STORE', 'PHONE'
);

-- Pre-populate all valid combinations
INSERT INTO dim_order_flags (is_rush, is_gift_wrapped, payment_type, shipping_method, order_channel)
SELECT DISTINCT
  r.val AS is_rush,
  g.val AS is_gift_wrapped,
  p.val AS payment_type,
  s.val AS shipping_method,
  c.val AS order_channel
FROM (SELECT FALSE AS val UNION ALL SELECT TRUE) r
CROSS JOIN (SELECT FALSE AS val UNION ALL SELECT TRUE) g
CROSS JOIN (SELECT column1 AS val FROM VALUES ('CREDIT'), ('DEBIT'), ('CASH'), ('WIRE')) p
CROSS JOIN (SELECT column1 AS val FROM VALUES ('STANDARD'), ('EXPRESS'), ('OVERNIGHT')) s
CROSS JOIN (SELECT column1 AS val FROM VALUES ('WEB'), ('MOBILE'), ('IN_STORE'), ('PHONE')) c;
```

---

## Role-Playing Dimensions

The same physical dimension referenced multiple times in a fact table under different roles. Most common with `dim_date`.

**Implementation**: Create views for each role pointing at the same base table.

```sql
-- Base table
-- dim_date (already exists)

-- Role-playing views
CREATE VIEW dim_date_order    AS SELECT * FROM dim_date;
CREATE VIEW dim_date_ship     AS SELECT * FROM dim_date;
CREATE VIEW dim_date_delivery AS SELECT * FROM dim_date;

-- Fact table references all three
SELECT
  f.order_amount,
  d_order.date_day    AS order_date,
  d_ship.date_day     AS ship_date,
  d_deliver.date_day  AS delivery_date
FROM fct_order_fulfillment f
JOIN dim_date_order    d_order   ON f.order_date_key    = d_order.date_key
JOIN dim_date_ship     d_ship    ON f.ship_date_key     = d_ship.date_key
JOIN dim_date_delivery d_deliver ON f.delivery_date_key = d_deliver.date_key;
```

---

## Mini-Dimensions

Split rapidly changing attributes out of a large Type 2 dimension to avoid row explosion.

**Use when**: A dimension has a few volatile attributes (age band, income band, credit tier) that change frequently and would cause an unsustainable number of Type 2 rows.

```sql
-- Main dimension (slow-changing attributes)
CREATE TABLE dim_customer (
  customer_key    INTEGER AUTOINCREMENT PRIMARY KEY,
  customer_id     VARCHAR NOT NULL,
  customer_name   VARCHAR,
  address         VARCHAR,
  effective_from  DATE,
  effective_to    DATE DEFAULT '9999-12-31',
  is_current      BOOLEAN DEFAULT TRUE
);

-- Mini-dimension (fast-changing demographics)
CREATE TABLE dim_customer_demo (
  demo_key        INTEGER AUTOINCREMENT PRIMARY KEY,
  age_band        VARCHAR(20),     -- '18-24', '25-34', '35-44', ...
  income_band     VARCHAR(20),     -- 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'
  credit_tier     VARCHAR(10)      -- 'A', 'B', 'C', 'D'
);

-- Fact table references both
CREATE TABLE fct_transactions (
  transaction_key INTEGER AUTOINCREMENT PRIMARY KEY,
  customer_key    INTEGER NOT NULL,     -- FK to dim_customer
  demo_key        INTEGER NOT NULL,     -- FK to dim_customer_demo
  date_key        INTEGER NOT NULL,
  amount          NUMBER(12,2)
);
```

---

## Bridge Tables (Multi-Valued Dimensions)

Resolve many-to-many relationships between a fact and a dimension. A patient can have multiple diagnoses; an account can have multiple holders.

```sql
CREATE TABLE bridge_patient_diagnosis (
  patient_key      INTEGER NOT NULL,
  diagnosis_key    INTEGER NOT NULL,
  diagnosis_rank   SMALLINT,              -- primary=1, secondary=2, etc.
  weighting_factor NUMBER(5,4) DEFAULT 1, -- for allocating facts across diagnoses
  PRIMARY KEY (patient_key, diagnosis_key)
);

-- Query: total charges allocated by diagnosis
SELECT
  dd.diagnosis_name,
  SUM(f.charge_amount * b.weighting_factor) AS allocated_charges
FROM fct_patient_charges f
JOIN bridge_patient_diagnosis b ON f.patient_key = b.patient_key
JOIN dim_diagnosis dd            ON b.diagnosis_key = dd.diagnosis_key
GROUP BY dd.diagnosis_name;
```

---

## Outrigger Dimensions

A dimension joined to another dimension (not to the fact table). Use sparingly.

**Use when**: A dimension has a foreign key to a shared reference dimension (e.g., `dim_product` has a `brand_key` pointing to `dim_brand`).

```sql
-- dim_product has a brand_key column referencing dim_brand
SELECT
  p.product_name,
  b.brand_name,
  b.brand_country
FROM dim_product p
JOIN dim_brand b ON p.brand_key = b.brand_key;
```

**Prefer denormalization**: In most cases, flatten the outrigger attributes into the parent dimension to avoid the extra join.

# Fact Table Patterns

Detailed Snowflake SQL patterns for every major fact table type. Loaded from SKILL.md when designing fact tables.

---

## Transaction Fact Table

**Grain**: One row per discrete business event (one order line, one click, one payment).

**Characteristics**:
- Most common fact table type
- Grows continuously as events occur
- All facts are additive (can SUM across any dimension)
- Sparsest of the three core types -- only rows for events that happened

**DDL**:

```sql
CREATE TABLE fct_order_lines (
  order_line_key    INTEGER AUTOINCREMENT PRIMARY KEY,
  order_id          VARCHAR NOT NULL,          -- degenerate dimension
  customer_key      INTEGER NOT NULL,          -- FK to dim_customer
  product_key       INTEGER NOT NULL,          -- FK to dim_product
  date_key          INTEGER NOT NULL,          -- FK to dim_date
  quantity          NUMBER(10,2) NOT NULL,     -- additive fact
  unit_price        NUMBER(12,4) NOT NULL,     -- non-additive fact
  discount_amount   NUMBER(12,2) DEFAULT 0,    -- additive fact
  net_amount        NUMBER(12,2) NOT NULL,     -- additive fact (derived: quantity * unit_price - discount)
  loaded_at         TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
```

**Load pattern (MERGE from staging)**:

```sql
MERGE INTO fct_order_lines t
USING (
  SELECT
    s.order_id,
    dc.customer_key,
    dp.product_key,
    dd.date_key,
    s.quantity,
    s.unit_price,
    s.discount_amount,
    s.quantity * s.unit_price - s.discount_amount AS net_amount
  FROM stg_order_lines s
  JOIN dim_customer dc ON s.customer_id = dc.customer_id AND dc.is_current = TRUE
  JOIN dim_product dp  ON s.product_id = dp.product_id   AND dp.is_current = TRUE
  JOIN dim_date dd     ON s.order_date = dd.date_day
  QUALIFY ROW_NUMBER() OVER (PARTITION BY s.order_id, s.line_number ORDER BY s.updated_at DESC) = 1
) src
ON t.order_id = src.order_id
WHEN NOT MATCHED THEN INSERT (order_id, customer_key, product_key, date_key,
                              quantity, unit_price, discount_amount, net_amount)
VALUES (src.order_id, src.customer_key, src.product_key, src.date_key,
        src.quantity, src.unit_price, src.discount_amount, src.net_amount);
```

---

## Periodic Snapshot Fact Table

**Grain**: One row per entity per time period (daily balance, weekly inventory, monthly headcount).

**Characteristics**:
- Dense -- every entity gets a row every period, even with no activity
- Contains semi-additive facts (balances cannot be summed across time)
- Requires a date-spine to ensure completeness
- Ideal for measuring status or levels over time

**DDL**:

```sql
CREATE TABLE fct_account_balance_daily (
  snapshot_key      INTEGER AUTOINCREMENT PRIMARY KEY,
  account_key       INTEGER NOT NULL,
  date_key          INTEGER NOT NULL,
  balance           NUMBER(18,2) NOT NULL,       -- semi-additive
  available_credit  NUMBER(18,2) NOT NULL,       -- semi-additive
  transaction_count NUMBER(10,0) DEFAULT 0,      -- additive (for the day)
  loaded_at         TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  UNIQUE (account_key, date_key)
);
```

**Load pattern (date-spine + LEFT JOIN for density)**:

```sql
INSERT INTO fct_account_balance_daily (account_key, date_key, balance, available_credit, transaction_count)
WITH date_spine AS (
  SELECT date_key, date_day
  FROM dim_date
  WHERE date_day = :snapshot_date
),
active_accounts AS (
  SELECT account_key, account_id
  FROM dim_account
  WHERE is_current = TRUE
),
daily_activity AS (
  SELECT
    account_id,
    COUNT(*) AS transaction_count
  FROM stg_transactions
  WHERE transaction_date = :snapshot_date
  GROUP BY account_id
),
latest_balance AS (
  SELECT
    account_id,
    balance,
    credit_limit - balance AS available_credit
  FROM stg_account_balances
  WHERE as_of_date = :snapshot_date
)
SELECT
  a.account_key,
  d.date_key,
  COALESCE(b.balance, prev.balance, 0)            AS balance,
  COALESCE(b.available_credit, prev.available_credit, 0) AS available_credit,
  COALESCE(da.transaction_count, 0)                AS transaction_count
FROM active_accounts a
CROSS JOIN date_spine d
LEFT JOIN latest_balance b    ON a.account_id = b.account_id
LEFT JOIN daily_activity da   ON a.account_id = da.account_id
LEFT JOIN fct_account_balance_daily prev
  ON a.account_key = prev.account_key
  AND prev.date_key = (SELECT date_key FROM dim_date WHERE date_day = :snapshot_date - 1)
;
```

---

## Accumulating Snapshot Fact Table

**Grain**: One row per process instance, updated as milestones are reached (one order lifecycle, one claim, one enrollment).

**Characteristics**:
- Rows are **updated** as the process progresses (unlike transaction facts)
- Multiple date keys represent milestones (order_date, ship_date, delivery_date)
- Contains lag/duration facts between milestones
- Finite lifecycle -- the row reaches a terminal state

**DDL**:

```sql
CREATE TABLE fct_order_fulfillment (
  order_key           INTEGER AUTOINCREMENT PRIMARY KEY,
  order_id            VARCHAR NOT NULL UNIQUE,
  customer_key        INTEGER NOT NULL,
  order_date_key      INTEGER NOT NULL,
  ship_date_key       INTEGER,                    -- NULL until shipped
  delivery_date_key   INTEGER,                    -- NULL until delivered
  return_date_key     INTEGER,                    -- NULL unless returned
  order_to_ship_days  INTEGER,                    -- lag fact
  ship_to_deliver_days INTEGER,                   -- lag fact
  order_amount        NUMBER(12,2) NOT NULL,
  status              VARCHAR(20) NOT NULL,        -- PLACED, SHIPPED, DELIVERED, RETURNED
  loaded_at           TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  updated_at          TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
```

**Load pattern (MERGE with milestone updates)**:

```sql
MERGE INTO fct_order_fulfillment t
USING (
  SELECT
    s.order_id,
    dc.customer_key,
    dd_order.date_key   AS order_date_key,
    dd_ship.date_key    AS ship_date_key,
    dd_deliver.date_key AS delivery_date_key,
    DATEDIFF(DAY, s.order_date, s.ship_date)    AS order_to_ship_days,
    DATEDIFF(DAY, s.ship_date, s.delivery_date) AS ship_to_deliver_days,
    s.order_amount,
    s.status
  FROM stg_order_events s
  JOIN dim_customer dc      ON s.customer_id = dc.customer_id AND dc.is_current = TRUE
  JOIN dim_date dd_order    ON s.order_date = dd_order.date_day
  LEFT JOIN dim_date dd_ship    ON s.ship_date = dd_ship.date_day
  LEFT JOIN dim_date dd_deliver ON s.delivery_date = dd_deliver.date_day
  QUALIFY ROW_NUMBER() OVER (PARTITION BY s.order_id ORDER BY s.event_ts DESC) = 1
) src
ON t.order_id = src.order_id
WHEN MATCHED THEN UPDATE SET
  ship_date_key       = COALESCE(src.ship_date_key, t.ship_date_key),
  delivery_date_key   = COALESCE(src.delivery_date_key, t.delivery_date_key),
  order_to_ship_days  = COALESCE(src.order_to_ship_days, t.order_to_ship_days),
  ship_to_deliver_days = COALESCE(src.ship_to_deliver_days, t.ship_to_deliver_days),
  status              = src.status,
  updated_at          = CURRENT_TIMESTAMP()
WHEN NOT MATCHED THEN INSERT
  (order_id, customer_key, order_date_key, ship_date_key, delivery_date_key,
   order_to_ship_days, ship_to_deliver_days, order_amount, status)
VALUES
  (src.order_id, src.customer_key, src.order_date_key, src.ship_date_key, src.delivery_date_key,
   src.order_to_ship_days, src.ship_to_deliver_days, src.order_amount, src.status);
```

---

## Factless Fact Table

**Grain**: One row per relationship or event occurrence with no numeric measurements.

**Characteristics**:
- Contains only dimension keys -- no facts
- Two flavors:
  - **Event tracking**: records that something happened (student attended class)
  - **Coverage**: records eligibility or assignment (product on promotion, employee in department)
- Queried to find what DID or DIDN'T happen (via anti-join)

**DDL (coverage example)**:

```sql
CREATE TABLE fct_promotion_coverage (
  promotion_key   INTEGER NOT NULL,
  product_key     INTEGER NOT NULL,
  store_key       INTEGER NOT NULL,
  start_date_key  INTEGER NOT NULL,
  end_date_key    INTEGER NOT NULL,
  PRIMARY KEY (promotion_key, product_key, store_key)
);
```

**Query -- "which products were on promotion but had zero sales?"**:

```sql
SELECT
  dp.product_name,
  ds.store_name,
  pr.promotion_name
FROM fct_promotion_coverage fc
JOIN dim_product dp    ON fc.product_key = dp.product_key
JOIN dim_store ds      ON fc.store_key = ds.store_key
JOIN dim_promotion pr  ON fc.promotion_key = pr.promotion_key
LEFT JOIN fct_sales fs
  ON fc.product_key = fs.product_key
  AND fc.store_key = fs.store_key
  AND fs.date_key BETWEEN fc.start_date_key AND fc.end_date_key
WHERE fs.order_line_key IS NULL;
```

---

## Consolidated Fact Table

**Grain**: Combines metrics from multiple processes at a common grain (e.g., daily product-store with both sales and inventory).

**When to use**: When users frequently need to compare metrics from different processes side by side and the grain aligns naturally.

```sql
CREATE TABLE fct_product_store_daily (
  product_key       INTEGER NOT NULL,
  store_key         INTEGER NOT NULL,
  date_key          INTEGER NOT NULL,
  units_sold        NUMBER(10,0),     -- from sales process
  revenue           NUMBER(12,2),     -- from sales process
  units_on_hand     NUMBER(10,0),     -- from inventory process (semi-additive)
  units_received    NUMBER(10,0),     -- from receiving process
  PRIMARY KEY (product_key, store_key, date_key)
);
```

---

## Aggregated Fact Table

**Grain**: Pre-aggregated version of a base fact table at a higher grain for query performance.

```sql
CREATE TABLE fct_sales_monthly_agg (
  product_category_key INTEGER NOT NULL,
  region_key           INTEGER NOT NULL,
  month_key            INTEGER NOT NULL,
  total_revenue        NUMBER(18,2),
  total_quantity       NUMBER(18,0),
  order_count          NUMBER(18,0),
  avg_unit_price       NUMBER(12,4),     -- non-additive: store numerator/denominator separately too
  PRIMARY KEY (product_category_key, region_key, month_key)
);

-- Populate from base fact
INSERT INTO fct_sales_monthly_agg
SELECT
  dp.category_key      AS product_category_key,
  ds.region_key,
  dd.month_key,
  SUM(f.net_amount)    AS total_revenue,
  SUM(f.quantity)      AS total_quantity,
  COUNT(*)             AS order_count,
  SUM(f.net_amount) / NULLIF(SUM(f.quantity), 0) AS avg_unit_price
FROM fct_order_lines f
JOIN dim_product dp ON f.product_key = dp.product_key
JOIN dim_store ds   ON f.store_key = ds.store_key
JOIN dim_date dd    ON f.date_key = dd.date_key
GROUP BY dp.category_key, ds.region_key, dd.month_key;
```

---

## Array-Based Metric Table (Snowflake-Specific)

Stores a rolling window of daily metrics in an array column, enabling efficient time-series queries without date-spine joins. Adapted from the DataExpert.io cumulative pattern.

**DDL**:

```sql
CREATE TABLE fct_user_activity_monthly (
  user_id         BIGINT NOT NULL,
  month_start     DATE NOT NULL,
  metric_name     VARCHAR(50) NOT NULL,
  metric_array    ARRAY NOT NULL,              -- element [0] = day 1, [1] = day 2, etc.
  PRIMARY KEY (user_id, month_start, metric_name)
);
```

**Incremental daily load**:

```sql
MERGE INTO fct_user_activity_monthly t
USING (
  WITH daily_agg AS (
    SELECT
      user_id,
      DATE_TRUNC('DAY', event_time)::DATE AS event_date,
      COUNT(*) AS hit_count
    FROM events
    WHERE DATE_TRUNC('DAY', event_time) = :current_date
      AND user_id IS NOT NULL
    GROUP BY user_id, DATE_TRUNC('DAY', event_time)
  ),
  existing AS (
    SELECT * FROM fct_user_activity_monthly
    WHERE month_start = DATE_TRUNC('MONTH', :current_date)::DATE
      AND metric_name = 'site_hits'
  )
  SELECT
    COALESCE(d.user_id, e.user_id)                   AS user_id,
    DATE_TRUNC('MONTH', :current_date)::DATE          AS month_start,
    'site_hits'                                        AS metric_name,
    CASE
      WHEN e.metric_array IS NOT NULL
        THEN ARRAY_APPEND(e.metric_array, COALESCE(d.hit_count, 0)::VARIANT)
      ELSE ARRAY_CAT(
        ARRAY_CONSTRUCT_COMPACT(),
        -- backfill zeros for missed days, then append today
        (SELECT ARRAY_AGG(0::VARIANT)
         FROM TABLE(GENERATOR(ROWCOUNT =>
           DATEDIFF(DAY, DATE_TRUNC('MONTH', :current_date), :current_date)))
        ),
        ARRAY_CONSTRUCT(COALESCE(d.hit_count, 0)::VARIANT)
      )
    END                                                AS metric_array
  FROM daily_agg d
  FULL OUTER JOIN existing e ON d.user_id = e.user_id
) src
ON t.user_id = src.user_id
  AND t.month_start = src.month_start
  AND t.metric_name = src.metric_name
WHEN MATCHED THEN UPDATE SET metric_array = src.metric_array
WHEN NOT MATCHED THEN INSERT (user_id, month_start, metric_name, metric_array)
  VALUES (src.user_id, src.month_start, src.metric_name, src.metric_array);
```

**Query -- sum hits for specific days**:

```sql
SELECT
  month_start,
  SUM(metric_array[0]::NUMBER) AS day_1_hits,
  SUM(metric_array[1]::NUMBER) AS day_2_hits,
  SUM(metric_array[2]::NUMBER) AS day_3_hits
FROM fct_user_activity_monthly
WHERE metric_name = 'site_hits'
GROUP BY month_start;
```

---

## Fact Additivity Reference

| Fact Type | SUM across dims | SUM across time | Correct time aggregation |
|-----------|----------------|-----------------|--------------------------|
| Additive (revenue, qty) | Yes | Yes | SUM |
| Semi-additive (balance, headcount) | Yes (non-time dims) | No | Use latest snapshot or AVG |
| Non-additive (unit_price, ratio) | No | No | Weighted average or recalculate from components |

### Handling NULLs in Fact Tables

- **Numeric facts**: Use 0, not NULL, for missing additive facts (NULL breaks SUM aggregation expectations)
- **FK to dimensions**: Use a dedicated "Unknown" row in the dimension (surrogate_key = -1) instead of NULL
- **Dates**: Use a special "Not Yet" date row in dim_date for milestones not yet reached (accumulating snapshots)

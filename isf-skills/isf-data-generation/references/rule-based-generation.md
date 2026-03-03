# Rule-Based Data Generation Reference

## SQL Distribution Functions

| Distribution | Snowflake SQL | Use For |
|-------------|---------------|---------|
| Normal | `ROUND(NORMAL(mean, stddev, RANDOM()))` | Age, scores, measurements |
| Uniform int | `UNIFORM(min, max, RANDOM())` | IDs, counts |
| Uniform date | `DATEADD('day', UNIFORM(0, range, RANDOM()), start)` | Random dates |
| Log-normal | `EXP(NORMAL(ln_mean, ln_sigma, RANDOM()))` | Prices, salaries, durations |
| Weighted choice | CASE + UNIFORM (see below) | Categories, statuses |
| Sequential | `SEQ4()` or `ROW_NUMBER()` | IDs, sequence numbers |
| Boolean | `UNIFORM(0, 100, RANDOM()) < probability` | Flags |

## Weighted Choice Pattern

```sql
CASE
    WHEN UNIFORM(0, 100, RANDOM()) < 60 THEN 'Standard'
    WHEN UNIFORM(0, 100, RANDOM()) < 85 THEN 'Premium'
    ELSE 'Enterprise'
END AS customer_segment
```

Weights: Standard 60%, Premium 25%, Enterprise 15%.

## Field Correlation Pattern

Correlate child field values based on parent field:

```sql
-- age -> income correlation
CASE
    WHEN age < 25 THEN
        CASE WHEN UNIFORM(0, 100, RANDOM()) < 60 THEN 'low'
             WHEN UNIFORM(0, 100, RANDOM()) < 90 THEN 'medium'
             ELSE 'high' END
    WHEN age < 45 THEN
        CASE WHEN UNIFORM(0, 100, RANDOM()) < 20 THEN 'low'
             WHEN UNIFORM(0, 100, RANDOM()) < 70 THEN 'medium'
             ELSE 'high' END
    ELSE
        CASE WHEN UNIFORM(0, 100, RANDOM()) < 10 THEN 'low'
             WHEN UNIFORM(0, 100, RANDOM()) < 50 THEN 'medium'
             ELSE 'high' END
END AS income_range
```

## Common Correlation Patterns

| Pattern | Fields | Typical Relationship |
|---------|--------|---------------------|
| Demographics | age -> income -> credit_score | Positive with variance |
| E-commerce | category -> price -> margin | Category-driven |
| Healthcare | age -> conditions -> visits | Risk-based |
| Finance | balance -> transactions -> fees | Activity-driven |
| Manufacturing | equipment_age -> failure_rate -> maintenance_cost | Degradation curve |

## Base Entity Generation

```sql
CREATE OR REPLACE TABLE {schema}.{entity} AS
WITH base_data AS (
    SELECT
        SEQ4() AS row_num,
        UUID_STRING() AS id,
        GREATEST(18, LEAST(85, ROUND(NORMAL(42, 15, RANDOM())))) AS age,
        DATEADD('day', UNIFORM(0, 730, RANDOM()), '2023-01-01'::DATE) AS created_at
    FROM TABLE(GENERATOR(ROWCOUNT => {row_count}))
)
SELECT * FROM base_data;
```

## Child Entity with FK References

```sql
CREATE OR REPLACE TABLE {schema}.{child_entity} AS
SELECT
    UUID_STRING() AS {child_id},
    -- Reference random parent
    parent.{parent_id} AS {fk_column},
    -- Child-specific columns with correlations to parent
    CASE parent.segment
        WHEN 'Enterprise' THEN ROUND(NORMAL(500, 150, RANDOM()), 2)
        WHEN 'Premium' THEN ROUND(NORMAL(200, 75, RANDOM()), 2)
        ELSE ROUND(NORMAL(80, 30, RANDOM()), 2)
    END AS amount
FROM TABLE(GENERATOR(ROWCOUNT => {child_row_count})) g
JOIN {schema}.{parent_entity} parent
    ON parent.row_num = UNIFORM(1, {parent_count}, RANDOM());
```

## Seeding for Reproducibility

Snowflake SQL RANDOM() does not accept a seed parameter directly. For reproducibility:

1. Generate data once using the SQL patterns above
2. Export to Parquet: `COPY INTO @stage/{entity}.parquet FROM {schema}.{entity} FILE_FORMAT = (TYPE = PARQUET)`
3. Commit Parquet files to `src/data_engine/output/`
4. Deployment loads from committed Parquet files, never regenerates

The reproducibility comes from committing the output, not from seeding the SQL.

## Scale Guidelines

| Scale | Generator Approach | Expected Time |
|-------|-------------------|---------------|
| < 100K rows | Python/Faker (Standard mode) | Seconds |
| 100K - 1M rows | SQL GENERATOR | 10-30 seconds |
| 1M - 10M rows | SQL GENERATOR | 1-5 minutes |
| > 10M rows | SQL GENERATOR with partitioned inserts | 5-30 minutes |

For SQL generation, use warehouse size MEDIUM or larger for > 1M rows.

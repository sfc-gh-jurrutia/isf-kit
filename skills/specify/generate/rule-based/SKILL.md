---
name: specify-generate-rules
description: "Generate synthetic data using statistical distributions and field correlations. Use for: deterministic data, correlated fields, no LLM costs. Triggers: rule-based data, statistical generation, correlated data"
parent_skill: specify-generate
---

# Rule-Based Data Generation

> Generate deterministic data using statistical distributions and field correlations

## When to Load

From `generate/SKILL.md` Step 3 when user selects "Rule-Based" mode.

## Prerequisites

- Domain model validated (from parent skill)
- Python environment with numpy, pandas

## Key Concept: Field Correlations

Rule-based generation creates **realistic relationships** between fields:

```
age → income_range → credit_score → loan_eligibility
 │         │              │
 └─────────┴──────────────┴── Correlated, not random
```

## Workflow

### Step 1: Define Correlation Rules

**Present** default correlations based on domain model:

```
Detected correlations for {entity}:

1. age → income_range
   - Under 25: 60% low income, 30% medium, 10% high
   - 25-45: 20% low, 50% medium, 30% high
   - 45+: 10% low, 40% medium, 50% high

2. income_range → credit_score
   - Low income: avg 580, std 50
   - Medium: avg 680, std 40
   - High: avg 750, std 30

3. region → product_preferences
   - Northeast: 40% premium, 60% standard
   - Southeast: 25% premium, 75% standard

[Accept] [Customize] [Skip correlations]
```

**⚠️ STOP**: Wait for response.

### Step 2: Configure Distributions

**For each field**, define distribution type:

| Field Type | Distribution | Parameters |
|------------|--------------|------------|
| Numeric (continuous) | Normal | mean, std |
| Numeric (skewed) | Log-normal | mean, std |
| Categorical | Weighted choice | weights[] |
| Date/Time | Uniform range | start, end |
| Boolean | Bernoulli | probability |
| ID/Sequence | Sequential | start, step |

**Example configuration:**

```yaml
fields:
  age:
    distribution: normal
    mean: 42
    std: 15
    min: 18
    max: 85
    
  income_range:
    distribution: correlated
    source_field: age
    correlation_map:
      "18-25": {weights: [0.6, 0.3, 0.1], values: ["low", "medium", "high"]}
      "26-45": {weights: [0.2, 0.5, 0.3], values: ["low", "medium", "high"]}
      "46+": {weights: [0.1, 0.4, 0.5], values: ["low", "medium", "high"]}
```

### Step 3: Generate with SQL

**Execute** generation using Snowflake SQL:

```sql
-- Base entity generation with distributions
CREATE OR REPLACE TABLE {schema}.{table} AS
WITH base_data AS (
    SELECT 
        SEQ4() AS id,
        -- Normal distribution for age
        GREATEST(18, LEAST(85, 
            ROUND(NORMAL(42, 15, RANDOM())))) AS age,
        -- Uniform date range
        DATEADD('day', 
            UNIFORM(0, 365, RANDOM()), 
            '2024-01-01'::DATE) AS signup_date
    FROM TABLE(GENERATOR(ROWCOUNT => {row_count}))
),
-- Apply correlations
with_correlations AS (
    SELECT 
        *,
        -- Correlated income based on age
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
    FROM base_data
)
SELECT * FROM with_correlations;
```

### Step 4: Generate Related Entities

**For child entities**, maintain referential integrity:

```sql
-- Orders referencing customers
CREATE OR REPLACE TABLE {schema}.orders AS
SELECT
    SEQ4() AS order_id,
    -- Reference parent entity
    UNIFORM(1, (SELECT COUNT(*) FROM {schema}.customers), RANDOM()) AS customer_id,
    -- Correlated order value based on customer segment
    CASE c.segment
        WHEN 'premium' THEN ROUND(NORMAL(500, 150, RANDOM()), 2)
        WHEN 'standard' THEN ROUND(NORMAL(150, 50, RANDOM()), 2)
        ELSE ROUND(NORMAL(75, 25, RANDOM()), 2)
    END AS order_value
FROM TABLE(GENERATOR(ROWCOUNT => {order_count})) g
JOIN {schema}.customers c ON c.id = g.customer_id;
```

## Common Correlation Patterns

| Pattern | Fields | Typical Correlation |
|---------|--------|---------------------|
| Demographics | age → income → credit | Positive with variance |
| E-commerce | category → price → margin | Category-driven |
| Healthcare | age → conditions → visits | Risk-based |
| Finance | balance → transactions → fees | Activity-driven |

## Stopping Points

- ✋ After presenting correlation rules (Step 1)
- ✋ Before executing SQL generation (Step 3)

## Output

```
✅ Rule-Based Generation Complete

Entities generated:
- customers: 10,000 rows
  - age: normal(42, 15), range [18, 85]
  - income_range: correlated to age
  - credit_score: correlated to income

- orders: 50,000 rows  
  - customer_id: FK to customers
  - order_value: correlated to segment

Correlation integrity: ✓ Verified

Next: Data loaded to {database}.{schema}
```

## Advantages Over LLM

- **Deterministic**: Same seed = same output
- **Fast**: No API calls, pure SQL
- **Free**: No Cortex credits consumed
- **Scalable**: Millions of rows in seconds

## Return

After completion, return to `generate/SKILL.md` for output format selection.

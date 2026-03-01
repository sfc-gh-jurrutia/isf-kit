# ML Schema Patterns

DDL patterns for storing ML explainability artifacts in Snowflake. Use alongside the `ML` schema as a peer to RAW/ATOMIC/DATA_MART.

## When to Add an ML Schema

| Signal | Action |
|--------|--------|
| Notebooks produce SHAP, PDP, or calibration data | Add ML schema |
| Streamlit or React app shows "why" explanations | Add ML schema |
| Model registry alone is sufficient | Skip ML schema |

## Schema DDL

```sql
CREATE SCHEMA IF NOT EXISTS ML;
```

## Core Tables

### GLOBAL_FEATURE_IMPORTANCE

Stores SHAP-based global feature importance per model.

```sql
CREATE OR REPLACE TABLE ML.GLOBAL_FEATURE_IMPORTANCE (
    IMPORTANCE_ID VARCHAR DEFAULT UUID_STRING(),
    MODEL_NAME VARCHAR NOT NULL,
    MODEL_VERSION VARCHAR DEFAULT 'v1.0',
    FEATURE_NAME VARCHAR NOT NULL,
    SHAP_IMPORTANCE FLOAT NOT NULL,
    SHAP_IMPORTANCE_STD FLOAT,
    IMPORTANCE_RANK INT NOT NULL,
    FEATURE_DIRECTION VARCHAR,              -- 'positive', 'negative', 'mixed'
    COMPUTED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    TRAINING_SAMPLES INT,
    PRIMARY KEY (IMPORTANCE_ID)
);
```

### MODEL_METRICS

Performance metrics for each model version.

```sql
CREATE OR REPLACE TABLE ML.MODEL_METRICS (
    METRIC_ID VARCHAR DEFAULT UUID_STRING(),
    MODEL_NAME VARCHAR NOT NULL,
    MODEL_VERSION VARCHAR DEFAULT 'v1.0',
    METRIC_NAME VARCHAR NOT NULL,           -- 'accuracy', 'precision', 'recall', 'f1', 'r2', 'mae', 'rmse'
    METRIC_VALUE FLOAT NOT NULL,
    METRIC_CONTEXT VARCHAR,                 -- 'train', 'test', 'validation'
    THRESHOLD FLOAT,
    EVALUATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    SAMPLE_COUNT INT,
    PRIMARY KEY (METRIC_ID)
);
```

### CONFUSION_MATRIX

For classification models.

```sql
CREATE OR REPLACE TABLE ML.CONFUSION_MATRIX (
    MATRIX_ID VARCHAR DEFAULT UUID_STRING(),
    MODEL_NAME VARCHAR NOT NULL,
    MODEL_VERSION VARCHAR DEFAULT 'v1.0',
    ACTUAL_CLASS VARCHAR NOT NULL,
    PREDICTED_CLASS VARCHAR NOT NULL,
    COUNT INT NOT NULL,
    THRESHOLD FLOAT,
    COMPUTED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (MATRIX_ID)
);
```

### CALIBRATION_CURVES

For models where probability thresholds drive decisions.

```sql
CREATE OR REPLACE TABLE ML.CALIBRATION_CURVES (
    CALIBRATION_ID VARCHAR DEFAULT UUID_STRING(),
    MODEL_NAME VARCHAR NOT NULL,
    MODEL_VERSION VARCHAR DEFAULT 'v1.0',
    PREDICTED_PROB_BIN FLOAT NOT NULL,
    ACTUAL_FREQUENCY FLOAT NOT NULL,
    BIN_COUNT INT NOT NULL,
    BIN_LOWER FLOAT,
    BIN_UPPER FLOAT,
    COMPUTED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (CALIBRATION_ID)
);
```

### PARTIAL_DEPENDENCE_CURVES

For parameter sensitivity visualization.

```sql
CREATE OR REPLACE TABLE ML.PARTIAL_DEPENDENCE_CURVES (
    PDP_ID VARCHAR DEFAULT UUID_STRING(),
    MODEL_NAME VARCHAR NOT NULL,
    MODEL_VERSION VARCHAR DEFAULT 'v1.0',
    FEATURE_NAME VARCHAR NOT NULL,
    FEATURE_VALUE FLOAT NOT NULL,
    PREDICTED_VALUE FLOAT NOT NULL,
    LOWER_BOUND FLOAT,
    UPPER_BOUND FLOAT,
    ICE_STD FLOAT,
    SAMPLE_COUNT INT,
    COMPUTED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (PDP_ID)
);
```

### PREDICTION_EXPLANATIONS

Per-prediction SHAP values. Use VARIANT for flexible feature sets.

```sql
CREATE OR REPLACE TABLE ML.PREDICTION_EXPLANATIONS (
    EXPLANATION_ID VARCHAR DEFAULT UUID_STRING(),
    MODEL_NAME VARCHAR NOT NULL,
    MODEL_VERSION VARCHAR DEFAULT 'v1.0',
    ENTITY_ID VARCHAR NOT NULL,             -- Generic: well, batch, customer, etc.
    PREDICTION FLOAT NOT NULL,
    PREDICTION_CLASS VARCHAR,
    CONFIDENCE FLOAT,
    INPUT_FEATURES VARIANT NOT NULL,        -- JSON: {"feature_a": 12.5, "feature_b": 120}
    FEATURE_CONTRIBUTIONS VARIANT NOT NULL, -- JSON: {"feature_a": 0.15, "feature_b": -0.08}
    BASE_VALUE FLOAT,
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (EXPLANATION_ID)
);
```

## Optional Tables

### FEATURE_INTERACTIONS

Pairwise feature interaction strength. Useful for understanding which feature combinations matter.

```sql
CREATE OR REPLACE TABLE ML.FEATURE_INTERACTIONS (
    INTERACTION_ID VARCHAR DEFAULT UUID_STRING(),
    MODEL_NAME VARCHAR NOT NULL,
    MODEL_VERSION VARCHAR DEFAULT 'v1.0',
    FEATURE_A VARCHAR NOT NULL,
    FEATURE_B VARCHAR NOT NULL,
    INTERACTION_STRENGTH FLOAT NOT NULL,    -- H-statistic or similar
    INTERACTION_TYPE VARCHAR,               -- 'synergistic', 'redundant', 'independent'
    COMPUTED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (INTERACTION_ID)
);
```

### OPTIMAL_PARAMETERS_BY_CONTEXT

Pre-computed optimal parameter recommendations derived from model analysis. Useful when the solution includes a "recommendation engine" — the model identifies the best input combinations for a target outcome, segmented by context (depth bin, region, category, etc.).

```sql
CREATE OR REPLACE TABLE ML.OPTIMAL_PARAMETERS_BY_CONTEXT (
    PARAM_ID VARCHAR DEFAULT UUID_STRING(),
    MODEL_NAME VARCHAR NOT NULL,
    CONTEXT_KEY VARCHAR NOT NULL,            -- e.g., 'depth_bin', 'region', 'segment'
    CONTEXT_VALUE VARCHAR NOT NULL,          -- e.g., '2000-2500', 'northeast', 'premium'
    PARAMETER_NAME VARCHAR NOT NULL,         -- e.g., input feature name
    OPTIMAL_VALUE FLOAT NOT NULL,
    OPTIMAL_RANGE_LOW FLOAT,
    OPTIMAL_RANGE_HIGH FLOAT,
    ACHIEVED_TARGET_AVG FLOAT,              -- avg target metric at these params
    EVIDENCE_COUNT INT,                     -- how many samples support this
    COMPUTED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (PARAM_ID)
);
```

## Convenience Views

```sql
CREATE OR REPLACE VIEW ML.V_TOP_FEATURES_BY_MODEL AS
SELECT MODEL_NAME, FEATURE_NAME, SHAP_IMPORTANCE, IMPORTANCE_RANK, FEATURE_DIRECTION
FROM ML.GLOBAL_FEATURE_IMPORTANCE
WHERE IMPORTANCE_RANK <= 10
ORDER BY MODEL_NAME, IMPORTANCE_RANK;

CREATE OR REPLACE VIEW ML.V_LATEST_MODEL_METRICS AS
SELECT m.*
FROM ML.MODEL_METRICS m
INNER JOIN (
    SELECT MODEL_NAME, METRIC_NAME, MAX(EVALUATED_AT) AS MAX_EVAL
    FROM ML.MODEL_METRICS
    GROUP BY MODEL_NAME, METRIC_NAME
) latest ON m.MODEL_NAME = latest.MODEL_NAME
        AND m.METRIC_NAME = latest.METRIC_NAME
        AND m.EVALUATED_AT = latest.MAX_EVAL;
```

## Snowflake Gotchas

| Gotcha | Fix |
|--------|-----|
| No index support on standard tables | Use `ALTER TABLE ... CLUSTER BY (MODEL_NAME, FEATURE_NAME)` for large tables |
| CHECK constraints not supported | Document valid values in COMMENT ON COLUMN |
| PK/FK metadata-only, not enforced | Still define them for documentation and BI tools |
| UUID_STRING() is VARCHAR, not UUID type | Use VARCHAR for ID columns |

## Migration Versioning

Add ML schema after the DATA_MART migration:

| Version | Purpose |
|---------|---------|
| `V1.4.0__ml_schema.sql` | ML schema + explainability tables |

Or if V1.4.0 is taken by Cortex objects, use `V1.5.0__`.

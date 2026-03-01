---
name: isf-ml-models
description: >
  Build ML notebooks for Snowflake solutions using Snowpark ML. Covers
  classification, regression, anomaly detection, and optimization patterns
  with SHAP explainability, Model Registry deployment, and ML schema export.
  Use when: (1) training ML models in Snowflake Notebooks, (2) implementing
  SHAP/PDP/calibration explainability, (3) registering models in Snowflake
  Model Registry, (4) exporting model artifacts to the ML schema, or
  (5) designing feature engineering with Snowpark window functions.
parent_skill: isf-solution-engine
---

# ISF ML Models

## Quick Start

### What Does This Skill Do?

Creates Snowflake Notebooks that train ML models, export explainability artifacts to the ML schema, and register models in the Snowflake Model Registry. Each notebook follows a shared pipeline pattern.

### Input

- `isf-context.md` for: ML requirements, target variables, feature candidates, model types
- DATA_MART views from `isf-data-architecture` (training data source)
- ML schema from `isf-data-architecture` migrations (export destination for explainability)
- Entity YAMLs for feature column identification

### Output

```
notebooks/
├── 01_{model_a_name}.ipynb         # One notebook per model
├── 02_{model_b_name}.ipynb
├── 03_{model_c_name}.ipynb
├── environment.yml                  # Conda dependencies for SiS notebooks
└── deploy_notebooks.sh              # Deployment script
```

ML schema tables populated: `GLOBAL_FEATURE_IMPORTANCE`, `MODEL_METRICS`, `CONFUSION_MATRIX`, `CALIBRATION_CURVES`, `PARTIAL_DEPENDENCE_CURVES`, `PREDICTION_EXPLANATIONS`

## Core Workflow

```
1. READ SPEC
   └── Load isf-context.md ML requirements
   └── Identify models needed (classification, regression, anomaly, optimization)
   └── Identify target variables and feature candidates from DATA_MART

2. PLAN MODELS
   └── For each model: select algorithm pattern, target, features
   └── Determine feature engineering needs (window functions, derived columns)
   └── Identify which explainability artifacts each model should export

   ⚠️ STOP: Present model plan (models, targets, features, algorithms) for review.

3. GENERATE NOTEBOOKS
   └── For each model, create a notebook following the shared pipeline pattern
   └── Include: data loading, feature engineering, train/test split, training, evaluation
   └── Include: SHAP analysis, explainability export, Model Registry registration

4. GENERATE DEPLOYMENT
   └── Create environment.yml with dependencies
   └── Create deploy_notebooks.sh for uploading to Snowflake

5. OUTPUT
   └── Notebooks in notebooks/
   └── ML schema populated (by notebook execution)
   └── Models registered in Snowflake Model Registry
```

## Shared Pipeline Pattern

Every notebook follows this structure regardless of the model type:

```python
# 1. SESSION
from snowflake.snowpark.context import get_active_session
session = get_active_session()

# 2. DATA LOADING
df = session.table("{DATABASE}.{DATA_MART}.{FEATURE_TABLE}")

# 3. FEATURE ENGINEERING
from snowflake.snowpark import functions as F
from snowflake.snowpark.window import Window

window_spec = Window.partition_by("ENTITY_ID").order_by("TIMESTAMP").rows_between(-60, 0)
df = df.with_column("ROLLING_AVG", F.avg("METRIC_A").over(window_spec))
df = df.with_column("ROLLING_STD", F.stddev("METRIC_A").over(window_spec))
df = df.with_column("DELTA", F.col("METRIC_A") - F.lag("METRIC_A", 1).over(window_spec))

# 4. TRAIN/TEST SPLIT
train_df, test_df = df.random_split([0.8, 0.2], seed=42)

# 5. PIPELINE + TRAINING
from snowflake.ml.modeling.pipeline import Pipeline
from snowflake.ml.modeling.preprocessing import StandardScaler
from snowflake.ml.modeling.xgboost import XGBClassifier  # or other algorithm

pipeline = Pipeline(steps=[
    ("scaler", StandardScaler(input_cols=FEATURE_COLS, output_cols=FEATURE_COLS)),
    ("model", XGBClassifier(
        input_cols=FEATURE_COLS,
        label_cols=[TARGET_COL],
        output_cols=["PREDICTION"],
        n_estimators=100,
        max_depth=6
    ))
])
pipeline.fit(train_df)

# 6. EVALUATION
predictions = pipeline.predict(test_df)
# Compute metrics (accuracy, precision, recall, F1, etc.)

# 7. SHAP EXPLAINABILITY
import shap
model_obj = pipeline.steps[-1][1].to_sklearn()
explainer = shap.TreeExplainer(model_obj)
sample = test_df.sample(n=5000).to_pandas()
shap_values = explainer.shap_values(sample[FEATURE_COLS])

# 8. EXPORT TO ML SCHEMA
# (see Export Patterns section below)

# 9. REGISTER IN MODEL REGISTRY
from snowflake.ml.registry import Registry
registry = Registry(session, database_name="{DATABASE}", schema_name="ML")
registry.log_model(
    pipeline,
    model_name="{MODEL_NAME}",
    version_name="v1.0",
    sample_input_data=train_df.select(FEATURE_COLS).limit(10)
)
```

## Model Pattern Templates

### Classification (Binary)

Target: Predict a boolean outcome (risk, churn, defect, incident).

| Setting | Value |
|---------|-------|
| Algorithm | `XGBClassifier` or `RandomForestClassifier` |
| Key hyperparameters | `n_estimators=100`, `max_depth=6`, `scale_pos_weight` for imbalanced classes |
| Explainability | SHAP TreeExplainer, confusion matrix, calibration curves |
| Export tables | `GLOBAL_FEATURE_IMPORTANCE`, `MODEL_METRICS`, `CONFUSION_MATRIX`, `CALIBRATION_CURVES` |

**Label engineering** (when true labels don't exist):
```python
df = df.with_column("LABEL",
    F.when(
        (F.col("METRIC_A") > F.col("ROLLING_AVG_A") * 2.0) &
        (F.abs(F.col("DELTA_B")) > THRESHOLD_B),
        F.lit(1)
    ).otherwise(F.lit(0))
)
```

### Regression

Target: Predict a continuous value (rate, cost, duration, efficiency).

| Setting | Value |
|---------|-------|
| Algorithm | `GradientBoostingRegressor` or `XGBRegressor` |
| Key hyperparameters | `n_estimators=100`, `max_depth=5` |
| Explainability | SHAP, partial dependence curves |
| Export tables | `GLOBAL_FEATURE_IMPORTANCE`, `MODEL_METRICS`, `PARTIAL_DEPENDENCE_CURVES` |
| Extra output | `OPTIMAL_PARAMETERS_BY_CONTEXT` (best parameter combos from top performers) |

**Optimal parameter extraction** (post-training):
```sql
INSERT INTO ML.OPTIMAL_PARAMETERS_BY_CONTEXT
SELECT
    '{MODEL_NAME}' AS MODEL_NAME,
    'context_bin' AS CONTEXT_KEY,
    CONTEXT_BIN AS CONTEXT_VALUE,
    '{PARAM_NAME}' AS PARAMETER_NAME,
    AVG(PARAM_VALUE) AS OPTIMAL_VALUE,
    PERCENTILE_CONT(0.1) WITHIN GROUP (ORDER BY PARAM_VALUE) AS OPTIMAL_RANGE_LOW,
    PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY PARAM_VALUE) AS OPTIMAL_RANGE_HIGH,
    AVG(TARGET_VALUE) AS ACHIEVED_TARGET_AVG,
    COUNT(*) AS EVIDENCE_COUNT
FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY CONTEXT_BIN ORDER BY TARGET_VALUE DESC) AS RN
    FROM {DATA_MART}.{FEATURE_TABLE}
) WHERE RN <= 100
GROUP BY CONTEXT_BIN;
```

### Anomaly Detection

Target: Detect unusual patterns in time-series or event data.

| Setting | Value |
|---------|-------|
| Algorithm | `RandomForestClassifier` (with synthetic labels) or `IsolationForest` |
| Key consideration | High recall is critical for safety-related anomalies — tune for minimal false negatives |
| Class weighting | `class_weight="balanced"` to handle rare events |
| Explainability | SHAP, calibration curves (probability reliability is critical) |
| Export tables | `GLOBAL_FEATURE_IMPORTANCE`, `MODEL_METRICS`, `CALIBRATION_CURVES`, `CONFUSION_MATRIX` |

### Optimization

Target: Identify optimal input parameters for a target outcome.

This is typically a regression model with an added step: after training, analyze the data to find which input combinations produce the best outcomes, segmented by context.

| Setting | Value |
|---------|-------|
| Algorithm | `GradientBoostingRegressor` |
| Extra output | `OPTIMAL_PARAMETERS_BY_CONTEXT` table |
| Use case | "What parameters should we use for {context}?" |

## Feature Engineering Patterns

### Window Functions (Time-Series)

```python
from snowflake.snowpark.window import Window

window_5min = Window.partition_by("ENTITY_ID").order_by("TIMESTAMP").rows_between(-300, 0)
window_1min = Window.partition_by("ENTITY_ID").order_by("TIMESTAMP").rows_between(-60, 0)

df = df.with_column("ROLLING_AVG_5MIN", F.avg("METRIC").over(window_5min))
df = df.with_column("ROLLING_STD_5MIN", F.stddev("METRIC").over(window_5min))
df = df.with_column("DELTA_1MIN", F.col("METRIC") - F.lag("METRIC", 1).over(window_1min))
```

### Derived Features

```python
df = df.with_column("RATIO_A_B", F.col("METRIC_A") / F.when(F.col("METRIC_B") != 0, F.col("METRIC_B")))
df = df.with_column("CONTEXT_BIN", F.floor(F.col("POSITION") / BIN_SIZE))
```

## Export Patterns

### SHAP to GLOBAL_FEATURE_IMPORTANCE

```python
import numpy as np

mean_shap = np.abs(shap_values).mean(axis=0)
for rank, idx in enumerate(np.argsort(mean_shap)[::-1], 1):
    session.sql(f"""
        INSERT INTO {DATABASE}.ML.GLOBAL_FEATURE_IMPORTANCE
        (MODEL_NAME, FEATURE_NAME, SHAP_IMPORTANCE, IMPORTANCE_RANK, TRAINING_SAMPLES)
        VALUES ('{MODEL_NAME}', '{FEATURE_COLS[idx]}', {mean_shap[idx]}, {rank}, {len(sample)})
    """).collect()
```

### Metrics to MODEL_METRICS

```python
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

metrics = {
    "accuracy": accuracy_score(y_true, y_pred),
    "precision": precision_score(y_true, y_pred),
    "recall": recall_score(y_true, y_pred),
    "f1": f1_score(y_true, y_pred)
}
for name, value in metrics.items():
    session.sql(f"""
        INSERT INTO {DATABASE}.ML.MODEL_METRICS
        (MODEL_NAME, METRIC_NAME, METRIC_VALUE, METRIC_CONTEXT, SAMPLE_COUNT)
        VALUES ('{MODEL_NAME}', '{name}', {value}, 'test', {len(y_true)})
    """).collect()
```

### Calibration to CALIBRATION_CURVES

```python
from sklearn.calibration import calibration_curve

prob_true, prob_pred = calibration_curve(y_true, y_prob, n_bins=10)
for i in range(len(prob_true)):
    session.sql(f"""
        INSERT INTO {DATABASE}.ML.CALIBRATION_CURVES
        (MODEL_NAME, PREDICTED_PROB_BIN, ACTUAL_FREQUENCY, BIN_COUNT)
        VALUES ('{MODEL_NAME}', {prob_pred[i]}, {prob_true[i]}, {bin_counts[i]})
    """).collect()
```

## Environment and Deployment

### environment.yml

```yaml
name: sf_env
channels:
  - snowflake
dependencies:
  - snowflake-ml-python
  - snowflake-snowpark-python
  - pandas
  - numpy
  - scikit-learn
  - matplotlib
  - plotly
  - shap
```

### deploy_notebooks.sh

```bash
#!/bin/bash
CONNECTION="${SNOWFLAKE_CONNECTION_NAME:-default}"
DATABASE="${SNOWFLAKE_DATABASE}"
SCHEMA="${SNOWFLAKE_SCHEMA:-ML}"

snow stage create @${DATABASE}.${SCHEMA}.NOTEBOOKS_STAGE --if-not-exists -c ${CONNECTION}

for nb in notebooks/*.ipynb; do
    snow stage copy "$nb" @${DATABASE}.${SCHEMA}.NOTEBOOKS_STAGE -c ${CONNECTION}
done
snow stage copy notebooks/environment.yml @${DATABASE}.${SCHEMA}.NOTEBOOKS_STAGE -c ${CONNECTION}

for nb in notebooks/*.ipynb; do
    NB_NAME=$(basename "$nb" .ipynb | tr '[:lower:]' '[:upper:]')
    snow sql -q "
        CREATE OR REPLACE NOTEBOOK ${DATABASE}.${SCHEMA}.${NB_NAME}
        FROM '@${DATABASE}.${SCHEMA}.NOTEBOOKS_STAGE'
        MAIN_FILE = '$(basename $nb)'
        QUERY_WAREHOUSE = '${SNOWFLAKE_WAREHOUSE}'
        COMMENT = 'ISF ML Model: ${NB_NAME}';
    " -c ${CONNECTION}
done
```

## Pre-Flight Checklist

- [ ] Target variables identified from isf-context.md
- [ ] Feature columns identified from DATA_MART views
- [ ] ML schema created (from isf-data-architecture V1.5.0 migration)
- [ ] Train/test split uses seed=42 for reproducibility
- [ ] Each notebook follows the shared pipeline pattern
- [ ] SHAP explainability computed and exported to ML schema
- [ ] Model metrics exported (accuracy, precision, recall, F1, R2, MAE, RMSE as applicable)
- [ ] Models registered in Snowflake Model Registry
- [ ] environment.yml lists all dependencies
- [ ] deploy_notebooks.sh tested

## Contract

**Inputs:**
- `isf-context.md` ML requirements (from `isf-spec-curation`)
- DATA_MART views for training data (from `isf-data-architecture`)
- ML schema tables (from `isf-data-architecture` V1.5.0 migration)

**Outputs:**
- `notebooks/*.ipynb` — Trained model notebooks (consumed by `isf-deployment`)
- ML schema populated: GLOBAL_FEATURE_IMPORTANCE, MODEL_METRICS, etc. (consumed by `isf-cortex-analyst`)
- Models in Snowflake Model Registry (consumed by `isf-python-udf`, `isf-cortex-agent`)

## Next Skill

After notebooks are built and models exported:

**Continue to** `../isf-cortex-analyst/SKILL.md` to build an ML explainability semantic view (if the agent should answer "why" questions about model predictions).

Then **continue to** `../isf-cortex-agent/SKILL.md` to wire ML models as agent tools.

If running the full ISF pipeline via `isf-solution-engine`, return to the engine for Phase 5.

## Companion Skills

| Skill | Relationship |
|-------|-------------|
| `isf-data-architecture` | Provides DATA_MART (training data) + ML schema (export destination) |
| `isf-data-generation` | Generates seed data with hidden discovery for model training |
| `isf-cortex-analyst` | ML semantic view queries the ML schema this skill populates |
| `isf-cortex-agent` | Agent may include ML model endpoints as tools |
| `isf-notebook` | GPU and compute pool configuration for training |
| `isf-deployment` | Deploys notebooks to Snowflake |

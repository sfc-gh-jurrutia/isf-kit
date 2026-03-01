# ML Explainability Patterns

Snowflake-specific patterns for adding explainability to Snowpark ML notebooks. All techniques export results to ML schema tables (see `isf-data-architecture/references/ml-schema-patterns.md` for DDL).

## Extracting sklearn from Snowpark ML Pipelines

```python
pipeline = Pipeline(steps=[
    ("scaler", StandardScaler(input_cols=FEATURE_COLS, output_cols=FEATURE_COLS)),
    ("classifier", XGBClassifier(input_cols=FEATURE_COLS, label_cols=[LABEL_COL], output_cols=["PREDICTION"]))
])
pipeline.fit(train_df)

# Extract sklearn objects
sklearn_pipe = pipeline.to_sklearn()
model = sklearn_pipe.named_steps['classifier']
scaler = sklearn_pipe.named_steps['scaler']

# Pull to pandas and scale (5000 samples for efficiency)
sample_df = test_df.sample(n=min(5000, test_df.count())).to_pandas()
X_scaled = scaler.transform(sample_df[FEATURE_COLS])
```

## SHAP (Global Feature Importance)

```python
import shap
import numpy as np

explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_scaled)

# CRITICAL: binary classification returns list [neg_class, pos_class]
if isinstance(shap_values, list):
    shap_values = shap_values[1]

# Global importance
importance = np.abs(shap_values).mean(axis=0)
direction = ['positive' if m > 0 else 'negative' for m in shap_values.mean(axis=0)]
```

| Gotcha | Fix |
|--------|-----|
| `shap_values` is a list for binary classifiers | Use `shap_values[1]` for positive class |
| > 10K samples is slow | Sample 5000 for stable rankings |
| `TreeExplainer` only for tree models | Use `KernelExplainer` for others (much slower) |

## Partial Dependence Plots

```python
from sklearn.inspection import partial_dependence

for feature in PDP_FEATURES:
    idx = FEATURE_COLS.index(feature)
    result = partial_dependence(model, X_scaled, features=[idx], kind='both', grid_resolution=50)

    grid_values = result['grid_values'][0]      # x-axis
    avg_prediction = result['average'][0]        # y-axis (mean PDP)
    ice_curves = result['individual'][0]         # per-sample ICE curves

    # Store bounds for confidence bands
    for i, (gv, ap) in enumerate(zip(grid_values, avg_prediction)):
        ice_at_point = ice_curves[:, i]
        lower = float(np.percentile(ice_at_point, 10))
        upper = float(np.percentile(ice_at_point, 90))
```

| Parameter | Value | Reason |
|-----------|-------|--------|
| `kind` | `'both'` | Returns average PDP + individual ICE curves |
| `grid_resolution` | 50 | Balance detail vs compute; increase for smoother curves |
| Bounds | P10/P90 of ICE | Shows heterogeneity across samples |

## Calibration Curves

For classifiers where probability thresholds drive decisions.

```python
from sklearn.calibration import calibration_curve

y_prob = model.predict_proba(X_scaled)[:, 1]
prob_true, prob_pred = calibration_curve(y_test, y_prob, n_bins=10, strategy='uniform')

calibration_error = float(np.mean(np.abs(prob_true - prob_pred)))
```

| Calibration Error | Interpretation | Action |
|-------------------|---------------|--------|
| < 0.05 | Well calibrated | Use probabilities directly |
| 0.05 - 0.15 | Acceptable | Consider isotonic regression |
| > 0.15 | Unreliable | Apply post-hoc calibration before deployment |

## Exporting to ML Schema

**CRITICAL**: Cast numpy types to Python before SQL insert. Snowpark silently fails or throws merge errors with numpy dtypes.

```python
# WRONG: numpy.float64 causes silent failures
session.sql(f"... VALUES ({row['value']}) ...").collect()

# CORRECT: explicit cast
session.sql(f"... VALUES ({float(row['value'])}) ...").collect()
```

### Pattern: Delete-then-insert by model name

```python
MODEL_NAME = "MY_MODEL"
MODEL_VERSION = "v1.0"

session.sql(f"DELETE FROM {DB}.ML.GLOBAL_FEATURE_IMPORTANCE WHERE MODEL_NAME = '{MODEL_NAME}'").collect()

for _, row in importance_df.iterrows():
    session.sql(f"""
        INSERT INTO {DB}.ML.GLOBAL_FEATURE_IMPORTANCE
        (MODEL_NAME, MODEL_VERSION, FEATURE_NAME, SHAP_IMPORTANCE, IMPORTANCE_RANK, FEATURE_DIRECTION, TRAINING_SAMPLES)
        VALUES ('{MODEL_NAME}', '{MODEL_VERSION}', '{row['FEATURE_NAME']}',
                {float(row['SHAP_IMPORTANCE'])}, {int(row['IMPORTANCE_RANK'])},
                '{row['FEATURE_DIRECTION']}', {int(len(X_scaled))})
    """).collect()
```

Same pattern applies to MODEL_METRICS, CALIBRATION_CURVES, CONFUSION_MATRIX, PARTIAL_DEPENDENCE_CURVES.

## Decision Guide

| Technique | Model Type | Add When | Target Table |
|-----------|-----------|----------|-------------|
| SHAP | Tree-based (XGBoost, RF, GB) | Stakeholders need "why" | GLOBAL_FEATURE_IMPORTANCE |
| PDP | Regression | Users tune parameters | PARTIAL_DEPENDENCE_CURVES |
| Calibration | Classification | Probability thresholds drive action | CALIBRATION_CURVES |

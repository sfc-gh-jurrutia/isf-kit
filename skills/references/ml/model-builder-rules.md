# Model Builder Rules

> Constraints and patterns from ai_solution_framework for training ML models

## Algorithm Constraints

**CRITICAL: sklearn-only models**

```python
# ✅ ALLOWED
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder, StandardScaler

# ❌ FORBIDDEN - Do not use
# import xgboost  # NOT ALLOWED
# import lightgbm  # NOT ALLOWED
# import catboost  # NOT ALLOWED
```

**Reason:** Snowflake Native Model Registry and SPCS deployment have known compatibility issues with xgboost. Use sklearn's GradientBoostingClassifier as the drop-in replacement.

## Column Naming Convention

Encoded columns MUST use uppercase `_ENCODED` suffix:

```python
# ✅ CORRECT
df['RISK_LEVEL_ENCODED'] = label_encoder.fit_transform(df['RISK_LEVEL'])
df['GENDER_ENCODED'] = label_encoder.fit_transform(df['GENDER'])

# ❌ WRONG
df['risk_level_encoded'] = ...  # lowercase not allowed
df['RISK_LEVEL_ENC'] = ...      # wrong suffix
```

## Standard Model Training Pattern

```python
from snowflake.snowpark import Session
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, classification_report
import joblib
import os

def train_model(session: Session, experience: str, target_column: str):
    """
    Train model following ai_solution_framework patterns.
    
    Args:
        session: Snowpark session
        experience: Industry vertical (betting, streaming, etc.)
        target_column: Column to predict (e.g., CHURN_FLAG)
    """
    # 1. Load features from standard table naming
    features_table = f"CUSTOMER_ML_FEATURES_{experience.upper()}"
    df = session.table(features_table).to_pandas()
    
    # 2. Define features (exclude ID and target columns)
    exclude_cols = ['CUSTOMER_ID', target_column, 'FEATURES_CREATED_AT']
    feature_cols = [c for c in df.columns if c not in exclude_cols]
    
    # 3. Prepare data
    X = df[feature_cols]
    y = df[target_column]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # 4. Train sklearn model (NOT xgboost)
    model = GradientBoostingClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        random_state=42
    )
    model.fit(X_train, y_train)
    
    # 5. Evaluate
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    metrics = {
        'roc_auc': roc_auc_score(y_test, y_prob),
        'report': classification_report(y_test, y_pred, output_dict=True)
    }
    
    # 6. Save with standard naming
    model_path = f"models/batch/{experience.lower()}_model.pkl"
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(model, model_path)
    
    return model, metrics, model_path
```

## Feature Table Structure

All feature tables follow this structure:

| Column | Type | Description |
|--------|------|-------------|
| CUSTOMER_ID | VARCHAR | Primary key |
| *_ENCODED | INTEGER | Encoded categorical columns |
| *_FLAG | INTEGER | Binary flags (0/1) |
| *_SCORE | FLOAT | Numeric scores |
| FEATURES_CREATED_AT | TIMESTAMP | Feature generation timestamp |

## Argparse Pattern for Scripts

When creating standalone training scripts:

```python
import argparse

def main():
    parser = argparse.ArgumentParser(description='Train ML model')
    parser.add_argument('--experience', required=True, 
                        choices=['betting', 'streaming', 'music', 'healthcare', 'retail'],
                        help='Industry vertical')
    parser.add_argument('--algorithm', default='gradient_boosting',
                        choices=['gradient_boosting', 'random_forest'],
                        help='sklearn algorithm to use')
    parser.add_argument('--target', default='CHURN_FLAG',
                        help='Target column to predict')
    args = parser.parse_args()
    
    # ... training logic ...

if __name__ == '__main__':
    main()
```

## Output Format

Save model artifacts to:

```
models/batch/
├── {experience}_model.pkl         # Trained model
├── {experience}_metadata.json     # Feature names, metrics
└── {experience}_encoder.pkl       # Label encoders (if any)
```

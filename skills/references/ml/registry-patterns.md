# Model Registry Patterns

> Snowflake Native Model Registry operations and cleanup

## Orphaned Service Cleanup

**Issue:** Failed model registrations leave orphaned `MODEL_BUILD_*` services that block future registrations.

**Always run cleanup before registering:**

```sql
-- Find orphaned build services
SHOW SERVICES LIKE 'MODEL_BUILD_%' IN SCHEMA SOLUTION_FRAMEWORK_ML_DB.ML_REGISTRY;

-- Drop each orphaned service (execute individually)
DROP SERVICE IF EXISTS SOLUTION_FRAMEWORK_ML_DB.ML_REGISTRY.MODEL_BUILD_<id>;
```

**Python helper:**

```python
def cleanup_orphaned_services(session, database: str = "SOLUTION_FRAMEWORK_ML_DB", 
                               schema: str = "ML_REGISTRY"):
    """Remove orphaned MODEL_BUILD_* services before registration."""
    
    # Find orphaned services
    services = session.sql(f"""
        SHOW SERVICES LIKE 'MODEL_BUILD_%' IN SCHEMA {database}.{schema}
    """).collect()
    
    cleaned = []
    for svc in services:
        svc_name = svc['name']
        session.sql(f"DROP SERVICE IF EXISTS {database}.{schema}.{svc_name}").collect()
        cleaned.append(svc_name)
    
    return cleaned
```

## Version Strategies

| Strategy | Behavior | Use When |
|----------|----------|----------|
| `new_version` | Creates v2, v3, etc. | Production models, need history |
| `overwrite` | Replaces existing version | Development iteration |
| `skip` | No-op if exists | Idempotent pipelines |

## Model Registration Pattern

```python
from snowflake.ml.registry import Registry
import joblib

def register_model(session, model_path: str, model_name: str,
                   version_strategy: str = "new_version",
                   database: str = "SOLUTION_FRAMEWORK_ML_DB",
                   schema: str = "ML_REGISTRY"):
    """Register sklearn model to Snowflake Native Model Registry."""
    
    # 1. Cleanup orphaned services first
    cleaned = cleanup_orphaned_services(session, database, schema)
    if cleaned:
        print(f"Cleaned up {len(cleaned)} orphaned services")
    
    # 2. Load model
    model = joblib.load(model_path)
    
    # 3. Initialize registry
    registry = Registry(
        session=session,
        database_name=database,
        schema_name=schema
    )
    
    # 4. Check if model exists
    existing = registry.show_models()
    model_exists = model_name.upper() in [m['name'] for m in existing.collect()]
    
    # 5. Handle version strategy
    if model_exists:
        if version_strategy == "skip":
            print(f"Model {model_name} exists, skipping")
            return None
        elif version_strategy == "overwrite":
            # Delete existing before re-registering
            registry.delete_model(model_name)
    
    # 6. Register model
    registered_model = registry.log_model(
        model=model,
        model_name=model_name,
        conda_dependencies=["scikit-learn"],
        comment=f"Registered from {model_path}"
    )
    
    return registered_model
```

## Verification Queries

After registration, verify with:

```sql
-- List all registered models
SHOW MODELS IN SCHEMA SOLUTION_FRAMEWORK_ML_DB.ML_REGISTRY;

-- Get model details
DESCRIBE MODEL SOLUTION_FRAMEWORK_ML_DB.ML_REGISTRY.<model_name>;

-- List model versions
SHOW VERSIONS IN MODEL SOLUTION_FRAMEWORK_ML_DB.ML_REGISTRY.<model_name>;
```

## Model Inference Pattern

```python
def run_inference(session, model_name: str, input_table: str,
                  database: str = "SOLUTION_FRAMEWORK_ML_DB",
                  schema: str = "ML_REGISTRY"):
    """Run inference using registered model."""
    
    registry = Registry(
        session=session,
        database_name=database,
        schema_name=schema
    )
    
    # Get latest version
    model = registry.get_model(model_name)
    model_version = model.default
    
    # Load input data
    input_df = session.table(input_table)
    
    # Run prediction
    predictions = model_version.run(input_df, function_name="predict")
    
    return predictions
```

## Common Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Service MODEL_BUILD_* already exists` | Previous registration failed | Run cleanup_orphaned_services() |
| `Model not found` | Wrong database/schema context | Verify database.schema path |
| `Unsupported model type` | Using xgboost or other non-sklearn | Use sklearn GradientBoostingClassifier |
| `Version already exists` | Duplicate registration | Use version_strategy="new_version" or "overwrite" |

## Database Objects Created

When you register a model, Snowflake creates:

```
SOLUTION_FRAMEWORK_ML_DB.ML_REGISTRY
├── MODEL: <model_name>           # Model container
├── FUNCTION: <model_name>_PREDICT  # Inference UDF (auto-generated)
└── STAGE: ML_MODELS_STAGE        # Model artifact storage
```

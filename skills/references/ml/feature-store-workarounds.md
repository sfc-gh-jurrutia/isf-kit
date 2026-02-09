# Feature Store Workarounds

> Known bugs and patterns for Snowflake Feature Store

## Auto-Detection for Timestamp Column

Feature views require a timestamp column. Auto-detect in this priority order:

```python
def detect_timestamp_column(df_columns: list) -> str:
    """Find timestamp column using priority order."""
    priority = [
        'FEATURES_CREATED_AT',  # ai_solution_framework standard
        'CREATED_AT',
        'UPDATED_AT', 
        'TIMESTAMP',
        'EVENT_TIME'
    ]
    
    for col in priority:
        if col in df_columns:
            return col
    
    # Fallback: find any TIMESTAMP type column
    raise ValueError("No timestamp column found. Add FEATURES_CREATED_AT to source table.")
```

## Known Bug: Entity Names

**Issue:** Entity names are case-sensitive internally but API returns uppercase.

**Workaround:** Always use uppercase for entity names:

```python
# ✅ CORRECT
entity = Entity(name="CUSTOMER", join_keys=["CUSTOMER_ID"])

# ❌ PROBLEMATIC - may cause lookup issues
entity = Entity(name="customer", join_keys=["CUSTOMER_ID"])
```

## Known Bug: Feature View Refresh

**Issue:** First refresh after creation may fail with "object not found" error.

**Workaround:** Add retry logic with delay:

```python
import time

def create_feature_view_with_retry(fs, name, entities, feature_df, 
                                    timestamp_col, refresh_freq, max_retries=3):
    """Create feature view with retry for known refresh bug."""
    
    fv = FeatureView(
        name=name,
        entities=entities,
        feature_df=feature_df,
        timestamp_col=timestamp_col,
        refresh_freq=refresh_freq
    )
    
    fs.register_feature_view(
        feature_view=fv,
        version="v1"
    )
    
    # Retry initial refresh
    for attempt in range(max_retries):
        try:
            time.sleep(5)  # Wait for metadata propagation
            fs.refresh_feature_view(name=name, version="v1")
            return fv
        except Exception as e:
            if "object not found" in str(e).lower() and attempt < max_retries - 1:
                print(f"Retry {attempt + 1}/{max_retries} - waiting for propagation...")
                time.sleep(10)
            else:
                raise
    
    return fv
```

## Standard Entity Creation

```python
from snowflake.ml.feature_store import FeatureStore, Entity

def create_standard_entity(session, database: str, schema: str, 
                           entity_name: str, join_keys: list, desc: str):
    """Create entity following ai_solution_framework patterns."""
    
    fs = FeatureStore(
        session=session,
        database=database,
        name=schema
    )
    
    # Use uppercase name
    entity = Entity(
        name=entity_name.upper(),
        join_keys=[k.upper() for k in join_keys],
        desc=desc
    )
    
    fs.register_entity(entity)
    return entity
```

## Standard Feature View Creation

```python
from snowflake.ml.feature_store import FeatureView

def create_feature_view(session, database: str, schema: str,
                        source_table: str, entity_name: str,
                        view_name: str, refresh_freq: str = "1 day"):
    """Create feature view from ML features table."""
    
    fs = FeatureStore(
        session=session,
        database=database,
        name=schema
    )
    
    # Load source and detect timestamp
    source_df = session.table(source_table)
    ts_col = detect_timestamp_column(source_df.columns)
    
    # Get entity reference
    entity = fs.get_entity(entity_name.upper())
    
    # Create feature view
    fv = FeatureView(
        name=view_name.upper(),
        entities=[entity],
        feature_df=source_df,
        timestamp_col=ts_col,
        refresh_freq=refresh_freq,
        desc=f"Features from {source_table}"
    )
    
    fs.register_feature_view(
        feature_view=fv,
        version="v1"
    )
    
    return fv
```

## Listing Entities and Views

```python
def list_feature_store_objects(session, database: str, schema: str):
    """List all Feature Store objects."""
    
    fs = FeatureStore(
        session=session,
        database=database,
        name=schema
    )
    
    entities = fs.list_entities().to_pandas()
    feature_views = fs.list_feature_views().to_pandas()
    
    return {
        'entities': entities,
        'feature_views': feature_views
    }
```

## Refresh Frequency Options

| Frequency | Use Case |
|-----------|----------|
| `"1 hour"` | Near real-time features |
| `"1 day"` | Daily batch features (default) |
| `"1 week"` | Slowly changing features |
| `None` | Manual refresh only |

## Database/Schema Pattern

Feature Store objects live in:

```
SOLUTION_FRAMEWORK_ML_DB
├── ML_FEATURE_STORE     # Feature Store objects
├── ML_REGISTRY          # Model Registry
└── ML_STAGING           # Temp objects
```

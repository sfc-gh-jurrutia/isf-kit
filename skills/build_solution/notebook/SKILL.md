---
name: snowflake-notebook
description: Build Jupyter notebooks for Snowflake SPCS with GPU support and distributed training. Use when: (1) creating ML notebooks, (2) configuring compute pools, (3) implementing PyTorch distributed training, (4) deploying GPU-enabled models, (5) fixing cell naming conflicts, (6) troubleshooting compute pool full errors, or (7) setting up dark theme visualizations.
parent_skill: build_solution
---

# Snowflake Notebook Development

## Quick Start

### Critical Requirements

| Requirement | Value | Notes |
|-------------|-------|-------|
| Cell metadata.name | Required | Must NOT match any Python function/variable names |
| Runtime | `SYSTEM$GPU_RUNTIME` | For GPU notebooks |
| Environment file | `environment.yml` | NOT `.yaml` for some runtimes |
| Package install | `os.system()` | NOT `!pip` |
| Session | `get_active_session()` | From `snowflake.snowpark.context` |

### Cell Naming Rules

**CRITICAL**: Cell names must NOT conflict with Python identifiers!

```json
{
  "metadata": {
    "name": "create_model_cell"  // ✅ Use suffix like _cell
  }
}
// NOT:
{
  "metadata": {
    "name": "create_model"  // ❌ Conflicts with def create_model()
  }
}
```

Naming patterns:
- Function definitions: `*_cell` suffix
- Section headers: `*_header`
- Visualizations: `*_visualization`
- Explanations: `*_explainer`

## Required Notebook Sections

| Section | Purpose |
|---------|---------|
| 1. Title & Objectives | Business context, learning objectives, prerequisites |
| 2. Environment Setup | Package installation, imports, session setup |
| 3. Data Loading | Load from Snowflake, initial exploration |
| 4. Data Exploration | Visualizations, statistics, quality checks |
| 5. Model/Algorithm | Conceptual explanation, architecture, implementation |
| 6. Execution | Training/computation with diagnostics |
| 7. Evaluation | Metrics, visualizations, interpretation |
| 8. Production Output | Write to Snowflake, grant permissions |
| 9. Key Takeaways | What was learned, limitations, next steps |

## Error Handling: Fail-Fast

**All queries must fail loudly. No silent failures.**

```python
def execute_query(session, query: str, name: str = "query") -> pd.DataFrame:
    try:
        result = session.sql(query).to_pandas()
        if result is None:
            raise RuntimeError(f"Query '{name}' returned None")
        return result
    except Exception as e:
        raise RuntimeError(f"Query '{name}' failed: {e}") from e
```

## Notebook Permissions

**GRANT ON ALL NOTEBOOKS is NOT supported!**

```sql
-- ✅ Correct: Schema-level access
GRANT USAGE ON DATABASE my_db TO ROLE my_role;
GRANT USAGE ON SCHEMA my_db.my_schema TO ROLE my_role;
GRANT USAGE ON WAREHOUSE my_wh TO ROLE my_role;

-- ❌ Wrong: Will error
GRANT USAGE ON ALL NOTEBOOKS IN SCHEMA my_db.my_schema TO ROLE my_role;
```

## GPU/Container Runtime

### Compute Pool Setup

```sql
CREATE COMPUTE POOL IF NOT EXISTS MY_GPU_POOL
    MIN_NODES = 1
    MAX_NODES = 1
    INSTANCE_FAMILY = GPU_NV_S  -- or GPU_NV_M for 4 GPUs
    AUTO_SUSPEND_SECS = 600;
```

### Critical Environment Variables

Set BEFORE any CUDA operations:

```python
import os
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"
os.environ["RAY_DISABLE_SIGTERM_HANDLER"] = "1"
```

### Compute Pool Full Error

```sql
-- Before executing notebook
ALTER COMPUTE POOL MY_GPU_POOL STOP ALL;
```

## Visualization Setup (Dark Theme)

```python
import matplotlib.pyplot as plt

plt.style.use('dark_background')
plt.rcParams.update({
    'figure.facecolor': '#121212',
    'axes.facecolor': '#121212',
    'text.color': '#E5E5E7',
    'axes.labelcolor': '#E5E5E7',
    'xtick.color': '#A1A1A6',
    'ytick.color': '#A1A1A6',
})

# Colorblind-safe palette
COLORS = ['#64D2FF', '#FF9F0A', '#5AC8FA', '#FFD60A', '#11567F']
plt.rcParams['axes.prop_cycle'] = plt.cycler(color=COLORS)
```

## Deployment Pattern

Use SQL-based deployment (more reliable than CLI):

```bash
snow sql -q "
CREATE OR REPLACE NOTEBOOK MY_NOTEBOOK
  FROM '@STAGE/notebooks/'
  MAIN_FILE = 'notebook.ipynb'
  COMPUTE_POOL = 'MY_GPU_POOL'
  QUERY_WAREHOUSE = 'MY_WH'
  RUNTIME_NAME = 'SYSTEM\$GPU_RUNTIME';

ALTER NOTEBOOK MY_NOTEBOOK ADD LIVE VERSION FROM LAST;
"
```

## Detailed Guides

- [GPU & Distributed Training](references/gpu.md)


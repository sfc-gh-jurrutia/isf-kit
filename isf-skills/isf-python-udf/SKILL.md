---
name: isf-python-udf
description: >
  Create and optimize Python UDFs and UDTFs in Snowflake. Use when:
  (1) writing Python UDFs for business logic, (2) loading models or
  files in UDFs, (3) optimizing UDF performance with caching,
  (4) creating table functions for data processing, or (5) building
  custom tools for Cortex Agents.
parent_skill: isf-solution-engine
---

# ISF Python UDFs

## Overview

Python UDFs extend Snowflake with custom logic. In ISF solutions, they're used for:
- Custom tools in Cortex Agents (risk scoring, calculations)
- Document parsing (PDF chunking for Cortex Search)
- ML model inference (loaded from stage)
- Business logic that SQL can't express

UDF definitions go in `src/database/functions/` per the ISF project structure.

## Global Caching Pattern (Performance Critical)

Load heavy resources (models, config files) once using a global cache. Without this, every row invocation reloads the file.

```python
import sys
import os
import pickle

_cache = {}

def load_resource(filename):
    if filename not in _cache:
        import_dir = sys._xoptions.get("snowflake_import_directory")
        with open(os.path.join(import_dir, filename), 'rb') as f:
            _cache[filename] = pickle.load(f)
    return _cache[filename]

def handler_function(x):
    model = load_resource('model.pkl')
    return model.predict(x)
```

## Scalar UDF

Returns a single value per row.

```sql
CREATE OR REPLACE FUNCTION {DATABASE}.{SCHEMA}.PREDICT_SCORE(input_data ARRAY)
RETURNS FLOAT
LANGUAGE PYTHON
RUNTIME_VERSION = '3.11'
PACKAGES = ('pandas', 'numpy', 'scikit-learn')
IMPORTS = ('@{DATABASE}.{SCHEMA}.MODELS/model.pkl')
HANDLER = 'handler_function'
AS $$
import sys, os, pickle
_cache = {}

def load_resource(filename):
    if filename not in _cache:
        import_dir = sys._xoptions.get("snowflake_import_directory")
        with open(os.path.join(import_dir, filename), 'rb') as f:
            _cache[filename] = pickle.load(f)
    return _cache[filename]

def handler_function(input_data):
    model = load_resource('model.pkl')
    return float(model.predict([input_data])[0])
$$;
```

## Table Function (UDTF)

Returns multiple rows per input. Used for document parsing, exploding arrays, etc.

```sql
CREATE OR REPLACE FUNCTION {DATABASE}.{SCHEMA}.PDF_CHUNKER(file_url STRING)
RETURNS TABLE (chunk VARCHAR)
LANGUAGE PYTHON
RUNTIME_VERSION = '3.9'
HANDLER = 'pdf_text_chunker'
PACKAGES = ('snowflake-snowpark-python', 'PyPDF2', 'langchain')
AS $$
from langchain.text_splitter import RecursiveCharacterTextSplitter
from snowflake.snowpark.files import SnowflakeFile
import PyPDF2, io

class pdf_text_chunker:
    def read_pdf(self, file_url: str) -> str:
        with SnowflakeFile.open(file_url, 'rb') as f:
            buffer = io.BytesIO(f.readall())
        reader = PyPDF2.PdfReader(buffer)
        return ' '.join(p.extract_text() or '' for p in reader.pages)

    def process(self, file_url: str):
        text = self.read_pdf(file_url)
        splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=300)
        for chunk in splitter.split_text(text):
            yield (chunk,)
$$;
```

## Cortex Agent Custom Tool

UDFs can be registered as custom tools in a Cortex Agent:

```json
{
  "tool_spec": {
    "type": "custom",
    "name": "RISK_SCORE",
    "description": "Calculate customer risk score based on transaction history"
  }
},
"tool_resources": {
  "RISK_SCORE": {
    "function_name": "{DATABASE}.{SCHEMA}.CUSTOMER_RISK_SCORE",
    "input_schema": [{"name": "customer_id", "type": "string"}],
    "output_schema": {"type": "float"}
  }
}
```

See `isf-cortex-agent` for full agent integration.

## Staging Files for IMPORTS

```bash
# Create stage for models/files
snow sql -q "CREATE STAGE IF NOT EXISTS {DATABASE}.{SCHEMA}.MODELS DIRECTORY = (ENABLE=TRUE);" -c ${CONNECTION}

# Upload model file
snow stage copy file://model.pkl @{DATABASE}.{SCHEMA}.MODELS/ -c ${CONNECTION}

# Upload config file
snow stage copy file://config.json @{DATABASE}.{SCHEMA}.MODELS/ -c ${CONNECTION}
```

## Type Mapping

| Snowflake Type | Python Type | Notes |
|---------------|-------------|-------|
| VARCHAR | str | |
| NUMBER / INT | int or float | |
| FLOAT | float | |
| BOOLEAN | bool | |
| ARRAY | list | |
| OBJECT | dict | |
| VARIANT | dict or list | JSON parsed automatically |
| DATE | datetime.date | |
| TIMESTAMP | datetime.datetime | |

## Best Practices

| Practice | Recommendation |
|----------|----------------|
| Caching | Always use global `_cache` for models and large files |
| Runtime | Use `3.11` (latest supported) unless package requires older |
| Packages | Use `PACKAGES` for Anaconda libs, `IMPORTS` for custom files |
| Testing | Test UDF logic locally with same Python version before deploying |
| Latency | CLI deployment adds ~5-7s overhead; execution is fast (<1s per call) |
| Error handling | Return sensible defaults on failure; don't raise in production |
| Vectorization | For batch operations, use vectorized UDFs with pandas DataFrames |

## ISF Project Structure

```
src/database/
├── functions/               # UDF definitions
│   ├── predict_score.sql    # Scalar UDF
│   └── pdf_chunker.sql      # Table function (UDTF)
├── procs/                   # Stored procedures (if complex logic)
└── cortex/
    └── agent.sql            # References UDFs as custom tools
```

## Next Skill

After UDFs are built:

**Continue to** `../isf-cortex-agent/SKILL.md` to register these UDFs as custom tools in the Cortex Agent.

If running the full ISF pipeline via `isf-solution-engine`, return to the engine for Phase 4d.

## Companion Skills

| Skill | Relationship |
|-------|-------------|
| `isf-cortex-agent` | UDFs registered as custom tools |
| `isf-cortex-search` | PDF chunker UDTF feeds search service |
| `isf-deployment` | Deploys UDF DDL via schemachange |
| `isf-data-architecture` | UDFs may reference ATOMIC/DATA_MART tables |

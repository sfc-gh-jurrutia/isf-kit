---
name: isf-cortex-search
description: >
  Build Cortex Search services for RAG pipelines and document search.
  Use when: (1) creating search over PDFs/documents, (2) implementing
  high-cardinality dimension resolution, (3) setting up RAG pipelines,
  (4) parsing documents with PARSE_DOCUMENT or UDFs, (5) integrating
  search with Cortex Agents, or (6) troubleshooting empty search results.
---

# ISF Cortex Search

## Overview

Cortex Search enables semantic and keyword search over text data. Common uses:
- PDF/document chatbots (RAG pipelines)
- High-cardinality dimension resolution for Cortex Analyst
- Knowledge base search for copilot applications

Output: `src/database/cortex/search_service.sql` per the ISF project structure.

## References

| File | Purpose | When Loaded |
|------|---------|-------------|
| `assets/search_service.sql` | Template DDL: stage, chunks table, search service, grants | When creating search infrastructure |

## Input

- `isf-context.md` Cortex features section (whether Search is required)
- Documents to index (PDFs, text files, or existing Snowflake tables)
- `isf-data-architecture` DATA_MART for structured data search

## Core Workflow

```
1. CREATE STAGE + UPLOAD DOCUMENTS
   └── Stage for document storage
   └── Upload PDFs/files
   └── CRITICAL: ALTER STAGE ... REFRESH before parsing

2. PARSE DOCUMENTS INTO CHUNKS
   └── PDF Parsing UDF or PARSE_DOCUMENT
   └── Store in chunks table with change tracking

   ⚠️ STOP: Confirm chunking strategy (method, chunk size, overlap) and chunk table schema before creating search service.

3. CREATE SEARCH SERVICE
   └── Index chunks with embedding model
   └── Configure TARGET_LAG for refresh

4. GRANT ACCESS
   └── Cortex Search service usage to project role

5. INTEGRATE
   └── Reference from Cortex Agent (isf-cortex-agent)
   └── Or query directly from FastAPI backend
```

## Stage and Upload Documents

```bash
snow sql -q "
CREATE OR REPLACE STAGE {DATABASE}.{SCHEMA}.DOCS
  ENCRYPTION = (TYPE = SNOWFLAKE_SSE)
  DIRECTORY = (ENABLE = TRUE);
" -c ${CONNECTION}

snow stage copy "docs/*.pdf" @{DATABASE}.{SCHEMA}.DOCS --recursive -c ${CONNECTION}

# CRITICAL: Refresh metadata before parsing
snow sql -q "ALTER STAGE {DATABASE}.{SCHEMA}.DOCS REFRESH;" -c ${CONNECTION}
```

## Create Chunks Table

```sql
CREATE TABLE IF NOT EXISTS {DATABASE}.{SCHEMA}.CHUNKS (
  CHUNK_ID NUMBER AUTOINCREMENT PRIMARY KEY,
  relative_path VARCHAR,
  file_url VARCHAR,
  chunk VARCHAR,
  language VARCHAR DEFAULT 'English'
);

ALTER TABLE {DATABASE}.{SCHEMA}.CHUNKS SET CHANGE_TRACKING = TRUE;
```

## Parse Documents

### Option 1: PDF Parsing UDF

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
import PyPDF2, io, pandas as pd

class pdf_text_chunker:
    def read_pdf(self, file_url: str) -> str:
        with SnowflakeFile.open(file_url, 'rb') as f:
            buffer = io.BytesIO(f.readall())
        reader = PyPDF2.PdfReader(buffer)
        return ' '.join(p.extract_text() or '' for p in reader.pages)

    def process(self, file_url: str):
        text = self.read_pdf(file_url)
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=2000, chunk_overlap=300
        )
        for chunk in splitter.split_text(text):
            yield (chunk,)
$$;
```

### Populate Chunks from PDFs

```sql
INSERT INTO {DATABASE}.{SCHEMA}.CHUNKS (relative_path, file_url, chunk)
SELECT
  relative_path,
  BUILD_SCOPED_FILE_URL(@{DATABASE}.{SCHEMA}.DOCS, relative_path),
  func.chunk
FROM DIRECTORY(@{DATABASE}.{SCHEMA}.DOCS),
     TABLE({DATABASE}.{SCHEMA}.PDF_CHUNKER(
       BUILD_SCOPED_FILE_URL(@{DATABASE}.{SCHEMA}.DOCS, relative_path)
     )) AS func;
```

### Option 2: PARSE_DOCUMENT (simpler, no UDF needed)

```sql
SELECT SNOWFLAKE.CORTEX.PARSE_DOCUMENT(
  @{DATABASE}.{SCHEMA}.DOCS, relative_path, {'mode': 'LAYOUT'}
):content::VARCHAR AS chunk_text
FROM DIRECTORY(@{DATABASE}.{SCHEMA}.DOCS);
```

## Create Search Service

```sql
CREATE OR REPLACE CORTEX SEARCH SERVICE {DATABASE}.{SCHEMA}.{SEARCH_SVC}
ON chunk
ATTRIBUTES relative_path, file_url, language
WAREHOUSE = {WAREHOUSE}
TARGET_LAG = '1 hour'
EMBEDDING_MODEL = 'snowflake-arctic-embed-m-v1.5'
AS (
  SELECT CHUNK_ID, chunk, relative_path, file_url, language
  FROM {DATABASE}.{SCHEMA}.CHUNKS
);
```

**CRITICAL for Agent integration**: `CHUNK_ID` must be in the SELECT — it maps to the agent's `id_column`.

## Query the Service

### SQL (Testing)

```sql
SELECT PARSE_JSON(
  SNOWFLAKE.CORTEX.SEARCH_PREVIEW(
    '{DATABASE}.{SCHEMA}.{SEARCH_SVC}',
    '{"query": "refund policy", "columns": ["chunk", "relative_path"], "limit": 5}'
  )
)['results'];
```

### Python (FastAPI backend)

```python
from snowflake.core import Root

root = Root(session)
service = root.databases["{DATABASE}"].schemas["{SCHEMA}"].cortex_search_services["{SEARCH_SVC}"]
resp = service.search(query="refund policy", columns=["chunk"], limit=5)
```

## Best Practices

| Practice | Recommendation |
|----------|----------------|
| Chunk size | 2000 characters (~512 tokens) |
| Overlap | 300-500 characters between chunks |
| Refresh | TARGET_LAG based on update frequency (1 hour default) |
| Metadata | Include relative_path, language for attribute filtering |
| Change tracking | Required on source table for incremental refresh |
| Embedding model | `snowflake-arctic-embed-m-v1.5` (default, good balance) |

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Empty results | Stage metadata not refreshed | Run `ALTER STAGE ... REFRESH` |
| Agent errors | id_column not in SELECT | Include CHUNK_ID in search service source query |
| Stale data | TARGET_LAG too long or change tracking off | Check TARGET_LAG, verify `SET CHANGE_TRACKING = TRUE` |
| Parse failures | Corrupted PDFs or unsupported format | Check file integrity, try PARSE_DOCUMENT instead of UDF |

## ISF Workflow Integration

### Where Search DDL Lives

```
src/database/cortex/
├── search_service.sql     # This skill's output
├── semantic_model.yaml    # May reference this for high-cardinality dims (isf-cortex-analyst)
└── agent.sql              # References this as a Search tool (isf-cortex-agent)
```

### Deployment Order

1. Stage created and documents uploaded
2. Chunks table created and populated
3. Search service created (this skill)
4. Referenced by Cortex Agent (by `isf-cortex-agent`)
5. Or referenced by Semantic Model for high-cardinality resolution (by `isf-cortex-analyst`)

## Companion Skills

| Skill | Relationship |
|-------|-------------|
| `isf-cortex-agent` | References this service as a Search tool |
| `isf-cortex-analyst` | Uses this for high-cardinality dimension resolution |
| `isf-python-udf` | PDF parsing UDF (if not using PARSE_DOCUMENT) |
| `isf-deployment` | Deploys search service DDL to Snowflake |

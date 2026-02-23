---
name: snowflake-cortex-search
description: Build Cortex Search services for RAG pipelines and document search. Use when: (1) creating search over PDFs/documents, (2) implementing high-cardinality dimension resolution, (3) setting up RAG pipelines, (4) parsing documents with PARSE_DOCUMENT or UDFs, (5) integrating search with Cortex Agents, or (6) troubleshooting empty search results.
parent_skill: build_solution
---

# Cortex Search Services

## Overview

Cortex Search enables semantic and keyword search over text data. Common uses:
- PDF/document chatbots
- RAG pipelines
- High-cardinality dimension resolution for Cortex Analyst

## Quick Start

### 1. Create Stage and Upload Documents

```bash
snow sql -q "
CREATE OR REPLACE STAGE DB.SCHEMA.DOCS
  ENCRYPTION = (TYPE = SNOWFLAKE_SSE)
  DIRECTORY = (ENABLE = TRUE);
" -c conn

snow stage copy "docs/*.pdf" @DB.SCHEMA.DOCS --recursive -c conn

# CRITICAL: Refresh metadata before parsing
snow sql -q "ALTER STAGE DB.SCHEMA.DOCS REFRESH;" -c conn
```

### 2. Create Chunk Table

```sql
CREATE TABLE IF NOT EXISTS DB.SCHEMA.CHUNKS (
  CHUNK_ID NUMBER AUTOINCREMENT PRIMARY KEY,
  relative_path VARCHAR,
  file_url VARCHAR,
  chunk VARCHAR,
  language VARCHAR DEFAULT 'English'
);

ALTER TABLE DB.SCHEMA.CHUNKS SET CHANGE_TRACKING = TRUE;
```

### 3. Create Search Service

```sql
CREATE OR REPLACE CORTEX SEARCH SERVICE DB.SCHEMA.DOC_SEARCH
ON chunk
ATTRIBUTES relative_path, file_url, language
WAREHOUSE = SEARCH_WH
TARGET_LAG = '1 hour'
EMBEDDING_MODEL = 'snowflake-arctic-embed-m-v1.5'
AS (
  SELECT CHUNK_ID, chunk, relative_path, file_url, language
  FROM DB.SCHEMA.CHUNKS
);
```

## Key Patterns

### PDF Parsing UDF

```sql
CREATE OR REPLACE FUNCTION DB.SCHEMA.PDF_CHUNKER(file_url STRING)
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

### Populate Chunks Table

```sql
INSERT INTO DB.SCHEMA.CHUNKS (relative_path, file_url, chunk)
SELECT
  relative_path,
  BUILD_SCOPED_FILE_URL(@DB.SCHEMA.DOCS, relative_path),
  func.chunk
FROM DIRECTORY(@DB.SCHEMA.DOCS),
     TABLE(DB.SCHEMA.PDF_CHUNKER(
       BUILD_SCOPED_FILE_URL(@DB.SCHEMA.DOCS, relative_path)
     )) AS func;
```

### Alternative: PARSE_DOCUMENT

```sql
SELECT SNOWFLAKE.CORTEX.PARSE_DOCUMENT(
  @DOCS_STAGE, relative_path, {'mode': 'LAYOUT'}
):content::VARCHAR AS chunk_text
FROM DIRECTORY(@DOCS_STAGE);
```

## Query Service

### SQL (Testing)

```sql
SELECT PARSE_JSON(
  SNOWFLAKE.CORTEX.SEARCH_PREVIEW(
    'DB.SCHEMA.DOC_SEARCH',
    '{"query": "refund policy", "columns": ["chunk", "relative_path"], "limit": 5}'
  )
)['results'];
```

### Python

```python
from snowflake.core import Root

root = Root(session)
service = root.databases["DB"].schemas["SCHEMA"].cortex_search_services["DOC_SEARCH"]
resp = service.search(query="refund policy", columns=["chunk"], limit=5)
```

## Agent Integration (CRITICAL)

When using as Agent tool, `id_column` must be in SELECT:

```sql
CREATE CORTEX SEARCH SERVICE ...
AS (
  SELECT
    CHUNK_ID,        -- Must match agent's id_column
    chunk,
    relative_path
  FROM CHUNKS
);
```

Agent config:
```json
{
  "tool_spec": {"type": "cortex_search", "name": "DOC_SEARCH"},
  "tool_resources": {
    "DOC_SEARCH": {
      "search_service": "DB.SCHEMA.DOC_SEARCH",
      "id_column": "CHUNK_ID",
      "max_results": 5
    }
  }
}
```

## Best Practices

| Practice | Recommendation |
|----------|----------------|
| Chunk size | ≤512 tokens (~385 words) |
| Overlap | 300-500 tokens |
| Refresh | Use TARGET_LAG based on update frequency |
| Metadata | Include relative_path, language for filtering |

## Troubleshooting

1. **Empty results?** Check `ALTER STAGE ... REFRESH` was run
2. **Agent errors?** Verify id_column in SELECT clause
3. **Stale data?** Check TARGET_LAG and change tracking


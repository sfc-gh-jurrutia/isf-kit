---
name: isf-cortex-search
description: >
  Build Cortex Search services for RAG pipelines and document search.
  Use when: (1) creating search over PDFs/documents, (2) implementing
  high-cardinality dimension resolution, (3) setting up RAG pipelines,
  (4) parsing documents with PARSE_DOCUMENT or UDFs, (5) integrating
  search with Cortex Agents, or (6) troubleshooting empty search results.
parent_skill: isf-solution-engine
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

## Advanced Patterns

### Multiple Search Services

When a solution needs search over distinct document types (domain procedures vs historical reports vs entity narratives), create separate services. Each can have different embedding models, refresh cadences, and attribute schemas.

```
src/database/cortex/
├── search_service.sql              # Contains DDL for ALL search services
│   ├── {DOMAIN}_KNOWLEDGE_SEARCH   # Expert procedures, protocols, guides
│   └── {ENTITY}_REPORTS_SEARCH     # Historical reports, logs, narratives
```

Each service has its own source table and attribute set:

```sql
CREATE OR REPLACE CORTEX SEARCH SERVICE {DATABASE}.{SCHEMA}.{DOMAIN}_KNOWLEDGE_SEARCH
ON chunk
ATTRIBUTES document_type, section_title
WAREHOUSE = {WAREHOUSE}
TARGET_LAG = '7 days'
EMBEDDING_MODEL = 'snowflake-arctic-embed-m-v1.5'
AS (
  SELECT CHUNK_ID, chunk, document_title, section_title, document_type, tags
  FROM {DATABASE}.{SCHEMA}.{DOMAIN}_PROCEDURES
);

CREATE OR REPLACE CORTEX SEARCH SERVICE {DATABASE}.{SCHEMA}.{ENTITY}_REPORTS_SEARCH
ON chunk
ATTRIBUTES entity_name, report_date, document_type
WAREHOUSE = {WAREHOUSE}
TARGET_LAG = '1 hour'
EMBEDDING_MODEL = 'snowflake-arctic-embed-m-v1.5'
AS (
  SELECT REPORT_ID, chunk, entity_name, report_date, document_type
  FROM {DATA_MART}.{ENTITY}_SEARCH_VIEW
);
```

The Cortex Agent references both services as separate Search tools with distinct descriptions so it can route queries appropriately.

### Synthetic Document Generation from SQL

Not all search content comes from uploaded files. For many solutions, the richest RAG content is **generated from structured data** — converting metrics, events, and summaries into natural-language text chunks that Cortex Search indexes.

**Pattern: Generate narrative chunks from DATA_MART tables.**

The source table is a **search-prep view** created by `isf-data-architecture` (see `data-layer-patterns.md` "Search-Prep Views" pattern). This skill then wraps it in a search service.

Example: Creating a search-ready table from structured entity data:

```sql
CREATE OR REPLACE TABLE {DATABASE}.{SCHEMA}.{ENTITY}_NARRATIVES AS
SELECT
    UUID_STRING() AS CHUNK_ID,
    ENTITY_NAME,
    REPORT_DATE,
    CONCAT(
        'Report for ', ENTITY_NAME, ' on ', TO_CHAR(REPORT_DATE, 'YYYY-MM-DD'), '.\n\n',
        'Performance Summary: ', METRIC_A_NAME, ' was ', ROUND(METRIC_A, 2), '. ',
        METRIC_B_NAME, ' was ', ROUND(METRIC_B, 2), '.\n\n',
        CASE WHEN HAS_ANOMALY THEN
            'ALERT: ' || ANOMALY_TYPE || ' detected — ' || ANOMALY_DESCRIPTION
        ELSE 'Operations normal.' END
    ) AS CHUNK,
    'performance_report' AS DOCUMENT_TYPE
FROM {DATA_MART}.{ENTITY}_DAILY_SUMMARY
WHERE REPORT_DATE >= DATEADD(year, -2, CURRENT_DATE);

ALTER TABLE {DATABASE}.{SCHEMA}.{ENTITY}_NARRATIVES SET CHANGE_TRACKING = TRUE;
```

Then create the search service over it:

```sql
CREATE OR REPLACE CORTEX SEARCH SERVICE {DATABASE}.{SCHEMA}.{ENTITY}_REPORTS_SEARCH
ON CHUNK
ATTRIBUTES ENTITY_NAME, REPORT_DATE, DOCUMENT_TYPE
WAREHOUSE = {WAREHOUSE}
TARGET_LAG = '1 hour'
EMBEDDING_MODEL = 'snowflake-arctic-embed-m-v1.5'
AS (
  SELECT CHUNK_ID, CHUNK, ENTITY_NAME, REPORT_DATE, DOCUMENT_TYPE
  FROM {DATABASE}.{SCHEMA}.{ENTITY}_NARRATIVES
);
```

**When to use synthetic doc generation:**
- The solution has rich structured data but no pre-existing documents
- Users will ask "what happened" questions that are best answered with narrative context
- Historical reports, event logs, or summaries exist in tables but not as text

**When NOT to use:**
- Real documents (PDFs, guides, policies) exist — use those directly
- The text would be repetitive boilerplate with no real information value

### Embedding Model Selection

| Model | Best For |
|-------|----------|
| `snowflake-arctic-embed-m-v1.5` | Default — good balance of speed and quality |
| `snowflake-arctic-embed-l-v2.0` | Higher quality for complex domain content (larger, slower) |
| `e5-base-v2` | Lightweight, fast for simple keyword-style search |

Specify in the `CREATE CORTEX SEARCH SERVICE` DDL. If omitted, Snowflake uses its default.

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
├── semantic_views/        # Deployed as Snowflake Semantic Views by isf-cortex-analyst
└── agent_{persona}.sql    # References this as a Search tool (isf-cortex-agent)
```

### Deployment Order

1. Stage created and documents uploaded
2. Chunks table created and populated
3. Search service created (this skill)
4. Referenced by Cortex Agent (by `isf-cortex-agent`)
5. Or referenced by a Semantic View spec for high-cardinality resolution (by `isf-cortex-analyst`)

## Contract

**Inputs:**
- Documents in `docs/` (from `isf-industry-context` or user-provided)
- Search-prep views/tables (from `isf-data-architecture` or `isf-industry-context`)
- `isf-context.md` Cortex features section (from `isf-spec-curation`)

**Outputs:**
- `src/database/cortex/search_service.sql` — Search service DDL (consumed by `isf-deployment`, `isf-cortex-agent`)
- Cortex Search Service in Snowflake (consumed by `isf-cortex-agent`, `isf-cortex-analyst`)

## Next Skill

After the search service is built:

**Continue to** `../isf-cortex-agent/SKILL.md` to combine Analyst + Search + UDF tools into an orchestrating agent.

If running the full ISF pipeline via `isf-solution-engine`, return to the engine for Phase 4d.

## Companion Skills

| Skill | Relationship |
|-------|-------------|
| `isf-cortex-agent` | References this service as a Search tool |
| `isf-cortex-analyst` | Uses this for high-cardinality dimension resolution |
| `isf-python-udf` | PDF parsing UDF (if not using PARSE_DOCUMENT) |
| `isf-deployment` | Deploys search service DDL to Snowflake |

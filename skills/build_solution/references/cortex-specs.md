# Cortex Implementation Specifications

> Load this reference during Step 2 (Generate Specification) to produce implementation-ready Cortex feature specs.

## Cortex Agent

### DDL Template

```sql
CREATE OR REPLACE CORTEX AGENT {AGENT_NAME}
    COMMENT = '{description}'
    LLM = '{model}'                          -- snowflake-llama-3.3-70b, claude-3-5-sonnet, etc.
    TOOLS = (
        {tool_name} = (
            tool_spec => (
                type => '{tool_type}',       -- cortex_analyst_text_to_sql | cortex_search | custom
                {resource_config}
            )
        ),
        ...
    )
    TOOL_RESOURCES = (
        execution_environment = (            -- MANDATORY for any custom tools
            runtime_name => 'python',
            packages => ('snowflake-snowpark-python', 'pandas'),
            functions => ('{DB}.{SCHEMA}.{UDF_NAME}')
        )
    );
```

### Tool Types

| Tool Type | Use For | Requirements |
|-----------|---------|-------------|
| `cortex_analyst_text_to_sql` | Natural language → SQL queries | Semantic model YAML |
| `cortex_search` | Unstructured document retrieval | Cortex Search service |
| `custom` | Python UDFs for business logic | `execution_environment` in `TOOL_RESOURCES` |

### Agent REST API

```
POST /api/v2/databases/{DB}/schemas/{SCHEMA}/agents/{AGENT}:run
Content-Type: application/json
Authorization: Snowflake Token="{token}"

{
    "model": "snowflake-llama-3.3-70b",
    "messages": [{"role": "user", "content": "..."}],
    "tools": ["tool_name_1", "tool_name_2"],
    "stream": true,
    "max_tokens": 4096,
    "temperature": 0.0
}
```

**Critical**: The endpoint path is `/agents/` — NOT `/cortex-agents/`.

### SSE Response Format

```
event: text
data: {"text": "partial response text"}

event: tool_result
data: {"tool_name": "...", "tool_input": {...}, "tool_output": {...}}

event: analyst_result
data: {"query": "SELECT ...", "data": [...], "columns": [...]}

event: error
data: {"message": "error description", "code": "..."}

event: done
data: {}
```

### Agent Gotchas

1. `TOOL_RESOURCES.execution_environment` is **mandatory** if any tool is `custom` type
2. All UDFs referenced in `functions` must already exist before creating the agent
3. Model availability varies by region — check `SHOW CORTEX MODELS` first
4. Agent names are case-insensitive, max 256 characters
5. `temperature: 0.0` recommended for deterministic behavior
6. Token auth requires `ctx.connection.rest.token` (not session token)

---

## Cortex Analyst (Semantic Model)

### Semantic Model YAML Structure

```yaml
name: {semantic_model_name}
description: |
  {Clear description of what this semantic model represents}
tables:
  - name: {TABLE_NAME}
    description: |
      {Table description for LLM context}
    base_table:
      database: "{DATABASE}"
      schema: "{SCHEMA}"
      table: "{TABLE_NAME}"
    primary_key:
      columns:
        - {PRIMARY_KEY_COLUMN}           # REQUIRED — PK must be specified
    columns:
      - name: {COLUMN_NAME}
        description: |
          {Column description — be specific, include units}
        data_type: {SNOWFLAKE_TYPE}
        synonyms:
          - "{alternate name 1}"
          - "{alternate name 2}"
    filters:                              # Filters go INSIDE table definition
      - name: {filter_name}
        description: |
          {When and why to apply this filter}
        expression: "{SQL boolean expression}"
    metrics:                              # Metrics go INSIDE table definition
      - name: {metric_name}
        description: |
          {What this metric measures}
        expression: "{SQL aggregate expression}"
        default_aggregation: {sum|avg|count|min|max}
verified_queries:
  - name: "{descriptive name}"
    question: "{natural language question}"
    verified_at: 1706140800                # Unix timestamp (int64) — NOT ISO date string
    verified_by: "{author}"
    sql: |
      SELECT ...
      FROM ...
```

### Semantic Model Gotchas

| Pitfall | What Happens | Fix |
|---------|-------------|-----|
| `verified_at` as ISO string | Silent validation failure | Use Unix timestamp: `int(datetime.timestamp())` |
| Missing `primary_key` | Analyst generates bad JOINs | Always specify PK for every table |
| Metrics outside table | YAML parse error | Metrics and filters go INSIDE `tables[].` |
| Vague column descriptions | Analyst guesses wrong | Be specific: "Revenue in USD, excludes tax" |
| No synonyms | Analyst misses user intent | Add industry-specific alternate names |
| Missing `base_table.database` | Object resolution failure | Always fully qualify: DB.SCHEMA.TABLE |

### Golden Query Verification

For every semantic model, define 3-5 golden queries:

```yaml
golden_queries:
  - question: "What was total revenue last quarter?"
    expected_sql: |
      SELECT SUM(REVENUE_USD) AS TOTAL_REVENUE
      FROM {DATA_MART}.SALES_SUMMARY
      WHERE QUARTER = DATEADD('quarter', -1, CURRENT_DATE())
    expected_result_shape: "single row, single column, positive number"
    validation: "Compare against known Q4 revenue of $12.4M"
```

---

## Cortex Search

### Service Creation

```sql
CREATE OR REPLACE CORTEX SEARCH SERVICE {SERVICE_NAME}
    ON {TEXT_COLUMN}                        -- Column containing searchable text
    ATTRIBUTES {ATTR1}, {ATTR2}            -- Filterable metadata columns
    WAREHOUSE = '{WAREHOUSE}'
    TARGET_LAG = '1 hour'                   -- Refresh frequency
    COMMENT = '{description}'
AS (
    SELECT
        {ID_COLUMN},                        -- MUST be in SELECT
        {TEXT_COLUMN},                       -- Searchable content
        {ATTR1},                            -- Filter attributes
        {ATTR2}
    FROM {TABLE}
);
```

### Search Gotchas

1. `id_column` **must** appear in the SELECT statement
2. Source table should have chunked text (ideal: 500-1000 tokens per chunk)
3. `TARGET_LAG` minimum is `'1 minute'` — use `'1 hour'` for solutions
4. Attributes enable client-side filtering in search results
5. VARIANT columns are not supported as search columns

### Chunking Strategy

For document-heavy solutions, pre-chunk in DATA_MART:

```sql
CREATE TABLE {DATA_MART}.DOCUMENT_CHUNKS AS
SELECT
    d.DOCUMENT_ID || '-' || c.INDEX AS CHUNK_ID,
    d.DOCUMENT_ID,
    c.VALUE::STRING AS CHUNK_TEXT,
    d.DOCUMENT_CATEGORY,
    d.DOCUMENT_DATE
FROM {ATOMIC}.DOCUMENT d,
LATERAL FLATTEN(
    INPUT => SNOWFLAKE.CORTEX.SPLIT_TEXT_RECURSIVE_CHARACTER(
        d.FULL_TEXT,
        'markdown',
        1000,      -- target chunk size (tokens)
        200        -- overlap (tokens)
    )
) c;
```

---

## Cortex LLM Functions

### Direct LLM Calls

```sql
-- Simple completion
SELECT SNOWFLAKE.CORTEX.COMPLETE(
    'snowflake-llama-3.3-70b',
    'Classify this text: ' || TEXT_COLUMN
) AS RESULT
FROM TABLE;

-- Sentiment analysis
SELECT SNOWFLAKE.CORTEX.SENTIMENT(TEXT_COLUMN) AS SENTIMENT_SCORE
FROM TABLE;

-- Summarization
SELECT SNOWFLAKE.CORTEX.SUMMARIZE(LONG_TEXT_COLUMN) AS SUMMARY
FROM TABLE;

-- Translation
SELECT SNOWFLAKE.CORTEX.TRANSLATE(TEXT_COLUMN, 'en', 'es') AS TRANSLATED
FROM TABLE;
```

### LLM Function Gotchas

1. `COMPLETE()` returns VARCHAR — parse JSON if structured output needed
2. `SENTIMENT()` returns FLOAT between -1.0 and 1.0
3. Token limits vary by model — chunk long text before sending
4. Cost scales linearly with row count — filter first, LLM second
5. Use `SNOWFLAKE.CORTEX.COMPLETE()` with full path (not just `COMPLETE()`)

---

## HTTP Client for Cortex Agent (Python)

```python
import httpx
import json

# Connection setup — ALWAYS use this pattern
connection_name = os.getenv("SNOWFLAKE_CONNECTION_NAME", "demo")

async def call_agent(session, messages: list[dict]) -> AsyncGenerator:
    """Stream responses from a Cortex Agent."""
    url = f"https://{host}/api/v2/databases/{db}/schemas/{schema}/agents/{agent}:run"
    headers = {
        "Authorization": f"Snowflake Token=\"{token}\"",
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
    }
    payload = {
        "model": "snowflake-llama-3.3-70b",
        "messages": messages,
        "stream": True,
        "tools": tool_list,
    }

    async with httpx.AsyncClient() as client:
        async with client.stream("POST", url, json=payload, headers=headers) as resp:
            async for line in resp.aiter_lines():
                if line.startswith("data: "):
                    yield json.loads(line[6:])
```

**Critical**: Use `httpx` — NOT `requests`. The `requests` library does not support async streaming.

---

## Cortex Spec Checklist

Before finalizing Cortex features in spec:

- [ ] Agent DDL includes all required tools and `execution_environment`
- [ ] Semantic model has `primary_key` for every table
- [ ] `verified_at` uses Unix timestamp (int64), not ISO string
- [ ] Metrics and filters are inside table definitions (not top-level)
- [ ] Column descriptions are specific (include units, ranges, business meaning)
- [ ] Golden queries defined with expected results
- [ ] Search service SELECT includes `id_column`
- [ ] Document chunking strategy defined (if search over long text)
- [ ] REST endpoint uses `/agents/` path (not `/cortex-agents/`)
- [ ] HTTP client uses `httpx` (not `requests`)
- [ ] Model availability confirmed for target region

---
name: isf-cortex-agent
description: >
  Build Cortex Agents that combine Analyst, Search, and custom tools.
  Use when: (1) creating multi-tool agents, (2) orchestrating Analyst +
  Search + UDFs, (3) configuring tool_resources, (4) fixing 404 endpoint
  errors, or (5) parsing streaming event responses.
parent_skill: isf-solution-engine
---

# ISF Cortex Agent

## Quick Start

### What Does This Skill Do?

Creates a Cortex Agent that orchestrates multiple tools:
- **Analyst tool**: Text-to-SQL via semantic model (from `isf-cortex-analyst`)
- **Search tool**: Document/text search via Cortex Search (from `isf-cortex-search`)
- **Custom tool**: UDFs/procedures for domain logic (from `isf-python-udf`)

The agent DDL is generated into `src/database/cortex/agent.sql` per the ISF project structure.

### Input

- `isf-context.md` Cortex features section (which tools the agent needs)
- Semantic model from `isf-cortex-analyst` (if Analyst tool used)
- Search service from `isf-cortex-search` (if Search tool used)
- UDFs from `isf-python-udf` (if custom tools used)

## References

| File | Purpose | When Loaded |
|------|---------|-------------|
| `assets/agent_spec.json` | Template agent specification with Analyst + Search tools | When creating agent DDL |

## Core Workflow

```
1. READ SPEC
   └── Load isf-context.md Cortex features section
   └── Identify which tools the agent needs (Analyst, Search, Custom)

2. ASSEMBLE TOOL SPECS
   └── For each tool: build tool_spec + tool_resources JSON
   └── Analyst: requires semantic model/view + execution_environment
   └── Search: requires search service + id_column
   └── Custom: requires UDF function name + input/output schema

3. GENERATE AGENT SPEC
   └── Combine tools into agent_spec.json from template
   └── Generate CREATE AGENT DDL
   └── Generate required GRANT statements

   ⚠️ STOP: Present agent spec (tools, resources, grants) for review before writing files.

4. OUTPUT
   └── Write agent DDL to src/database/cortex/agent.sql
   └── Add grant statements to deploy/setup.sql or migration file
```

## Agent DDL

```sql
CREATE OR REPLACE AGENT {DATABASE}.{SCHEMA}.{AGENT_NAME}
FROM SPECIFICATION
$$
{agent_spec_json}
$$;
```

The spec JSON is generated from `assets/agent_spec.json`, customized with project-specific tool names, semantic models, and search services.

## Tool Types

### Analyst Tool

**CRITICAL**: `execution_environment` is required. Without it: "The Analyst tool is missing an execution environment."

```json
{
  "tool_spec": {
    "type": "cortex_analyst_text_to_sql",
    "name": "ANALYTICS",
    "description": "Query structured data using natural language"
  }
}
```

```json
"tool_resources": {
  "ANALYTICS": {
    "semantic_model_file": "@{DATABASE}.{SCHEMA}.MODELS/semantic_model.yaml",
    "execution_environment": {
      "type": "warehouse",
      "warehouse": "{WAREHOUSE}",
      "query_timeout": 300
    }
  }
}
```

For Semantic View (recommended over stage-based YAML):

```json
"tool_resources": {
  "ANALYTICS": {
    "semantic_view": "{DATABASE}.{SCHEMA}.{SEMANTIC_VIEW}",
    "execution_environment": {
      "type": "warehouse",
      "warehouse": "{WAREHOUSE}",
      "query_timeout": 300
    }
  }
}
```

### Search Tool

**CRITICAL**: `id_column` must be in the search service's SELECT query.

```json
{
  "tool_spec": {
    "type": "cortex_search",
    "name": "DOC_SEARCH",
    "description": "Search documents and FAQs"
  }
}
```

```json
"tool_resources": {
  "DOC_SEARCH": {
    "search_service": "{DATABASE}.{SCHEMA}.{SEARCH_SVC}",
    "id_column": "CHUNK_ID",
    "title_column": "RELATIVE_PATH",
    "max_results": 5
  }
}
```

### Custom Tool (UDF)

```json
{
  "tool_spec": {
    "type": "custom",
    "name": "RISK_SCORE",
    "description": "Calculate customer risk score"
  }
}
```

```json
"tool_resources": {
  "RISK_SCORE": {
    "function_name": "{DATABASE}.{SCHEMA}.CUSTOMER_RISK_SCORE",
    "input_schema": [
      {"name": "customer_id", "type": "string"}
    ],
    "output_schema": {"type": "float"}
  }
}
```

## Calling the Agent

### REST API Endpoint

**CRITICAL**: Use `/agents/` not `/cortex-agents/` in the path.

```
POST /api/v2/databases/{DATABASE}/schemas/{SCHEMA}/agents/{AGENT_NAME}:run
```

### Request Format

```json
{
  "messages": [
    {"role": "user", "content": [{"type": "text", "text": "What were total sales last quarter?"}]}
  ],
  "stream": true
}
```

### Response Format (Streaming Events)

```json
[
  {"event": "text", "data": {"text": "Here is..."}},
  {"event": "tool_result", "data": {"text": "SQL result..."}},
  {"event": "analyst_result", "data": {"sql": "SELECT ..."}},
  {"event": "error", "data": {"message": "...", "code": "..."}},
  {"event": "done", "data": "[DONE]"}
]
```

| Event | Description |
|-------|-------------|
| `text` | Assistant text (accumulate from multiple events) |
| `tool_result` | Results from tool execution |
| `analyst_result` | Cortex Analyst generated SQL and results |
| `error` | Error with message and code |
| `done` | End of stream |

For React+FastAPI integration patterns (SSE streaming hook, Zustand state, FastAPI proxy), see `isf-solution-react-app`.

## Grants Required

```sql
-- Cortex access
GRANT DATABASE ROLE SNOWFLAKE.CORTEX_USER TO ROLE {PROJECT_ROLE};

-- Warehouse for Analyst tool
GRANT USAGE ON WAREHOUSE {WAREHOUSE} TO ROLE {PROJECT_ROLE};

-- Data access for Analyst tool
GRANT SELECT ON ALL TABLES IN SCHEMA {DATABASE}.{DATA_MART} TO ROLE {PROJECT_ROLE};

-- Search service access
GRANT USAGE ON CORTEX SEARCH SERVICE {DATABASE}.{SCHEMA}.{SEARCH_SVC} TO ROLE {PROJECT_ROLE};

-- UDF access (if custom tools)
GRANT USAGE ON FUNCTION {DATABASE}.{SCHEMA}.{UDF_NAME}(STRING) TO ROLE {PROJECT_ROLE};

-- Agent access for app role
GRANT USAGE ON AGENT {DATABASE}.{SCHEMA}.{AGENT_NAME} TO ROLE {APP_ROLE};
```

## Advanced Patterns

### Multi-Tool Agent (2+ Analyst + 2+ Search)

When the solution has separate semantic views (operational data vs ML insights) and multiple search services (domain knowledge vs historical reports), configure the agent with multiple tools of the same type:

```json
{
  "tools": [
    {"tool_spec": {"type": "cortex_analyst_text_to_sql", "name": "OPERATIONAL_DATA"}},
    {"tool_spec": {"type": "cortex_analyst_text_to_sql", "name": "ML_INSIGHTS"}},
    {"tool_spec": {"type": "cortex_search", "name": "DOMAIN_KNOWLEDGE"}},
    {"tool_spec": {"type": "cortex_search", "name": "HISTORICAL_REPORTS"}}
  ],
  "tool_resources": {
    "OPERATIONAL_DATA": {
      "semantic_view": "{DATABASE}.{DATA_MART}.OPERATIONAL_SV",
      "execution_environment": {"type": "warehouse", "warehouse": "{WAREHOUSE}"}
    },
    "ML_INSIGHTS": {
      "semantic_view": "{DATABASE}.ML.ML_INSIGHTS_SV",
      "execution_environment": {"type": "warehouse", "warehouse": "{WAREHOUSE}"}
    },
    "DOMAIN_KNOWLEDGE": {
      "search_service": "{DATABASE}.{SCHEMA}.DOMAIN_KNOWLEDGE_SEARCH",
      "id_column": "CHUNK_ID", "max_results": 5
    },
    "HISTORICAL_REPORTS": {
      "search_service": "{DATABASE}.{SCHEMA}.REPORTS_SEARCH",
      "id_column": "REPORT_ID", "max_results": 5
    }
  }
}
```

Each tool gets a distinct description so the agent can route queries to the right tool.

### Routing Instructions

Add an `orchestration` section to the agent instructions that tells the LLM how to choose between tools. Use the pattern: **intent → tool → when NOT to use**.

```
"instructions": "You are a {DOMAIN} copilot with access to these tools:\n\n
TOOL ROUTING:\n
- OPERATIONAL_DATA: Use for metrics, aggregations, trends, and KPI questions about {domain} operations.\n
  Example: 'What was the average {metric} last month?'\n
  Do NOT use for: questions about why something happened, or document lookups.\n\n
- ML_INSIGHTS: Use for model performance, feature importance, and prediction explanation questions.\n
  Example: 'What are the top features for the {model_name} model?'\n
  Do NOT use for: raw operational data queries.\n\n
- DOMAIN_KNOWLEDGE: Use for procedures, protocols, best practices, and how-to questions.\n
  Example: 'What is the procedure for handling {event_type}?'\n
  Do NOT use for: data queries or metrics.\n\n
- HISTORICAL_REPORTS: Use for specific past events, incidents, and historical context.\n
  Example: 'What happened at {location} on {date}?'\n
  Do NOT use for: general procedures or aggregated data.\n\n
RESPONSE FORMAT:\n
- Always cite the tool and source used.\n
- For data queries, include the SQL generated.\n
- Present tables in markdown format.\n"
```

### Safety-Priority Patterns

For solutions where certain queries relate to safety-critical decisions (healthcare alerts, equipment failures, compliance violations), add priority routing instructions:

```
"SAFETY PRIORITY:\n
When a question involves {SAFETY_TOPIC_A} or {SAFETY_TOPIC_B}:\n
1. ALWAYS check DOMAIN_KNOWLEDGE first for established procedures\n
2. Then check HISTORICAL_REPORTS for precedents\n
3. Only then query OPERATIONAL_DATA for current metrics\n
4. Include a safety disclaimer: 'This information is AI-generated. Always follow established {DOMAIN} procedures and consult qualified personnel for safety-critical decisions.'\n"
```

### Confidence Indicators

Instruct the agent to include confidence qualifiers based on data volume and recency:

```
"CONFIDENCE INDICATORS:\n
- HIGH: Based on >1000 data points from the last 30 days\n
- MEDIUM: Based on 100-1000 data points or data older than 30 days\n
- LOW: Based on <100 data points, inferred, or based on general knowledge\n
Always state the confidence level when providing quantitative answers.\n"
```

## Best Practices

| Practice | Recommendation |
|----------|----------------|
| Tools per agent | 3-5 max; keep focused |
| Tool descriptions | State what + when to use + when NOT to |
| Naming | Consistent across tools (customer_id everywhere, not cust_id) |
| Testing | Test each tool independently before combining |
| Semantic View | Prefer over stage-based YAML for Analyst tools |

## ISF Workflow Integration

### Where Agent DDL Lives

```
src/database/cortex/
├── agent.sql              # CREATE AGENT DDL
├── semantic_model.yaml    # Analyst tool's model (from isf-cortex-analyst)
└── search_service.sql     # Search tool's service (from isf-cortex-search)
```

### Deployment

Agent DDL is deployed by `isf-deployment` after the data layer and Cortex services are created:

1. Semantic model deployed (by `isf-cortex-analyst`)
2. Search service created (by `isf-cortex-search`)
3. UDFs created (by `isf-python-udf`)
4. Agent created referencing all tools (this skill)

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| 404 Not Found | Wrong endpoint path | Use `/agents/` not `/cortex-agents/` |
| Missing execution environment | No warehouse config for Analyst | Add `execution_environment` block |
| Technical difficulties | Search id_column not in SELECT | Include id_column in search service source query |
| Agent not found | Wrong database/schema in URL | Verify fully qualified path matches CREATE AGENT location |
| Tool not responding | Underlying service down | Check semantic model validity, search service status |

## Contract

**Inputs:**
- Semantic model/view (from `isf-cortex-analyst`)
- Search service(s) (from `isf-cortex-search`)
- UDFs (from `isf-python-udf`)
- `isf-context.md` Cortex features section (from `isf-spec-curation`)

**Outputs:**
- `src/database/cortex/agent.sql` — Agent DDL (consumed by `isf-deployment`)
- Agent endpoint URL (consumed by `isf-solution-react-app`)

## Next Skill

After the agent is built:

**Continue to** `../isf-solution-react-app/SKILL.md` to build the React + FastAPI frontend with SSE streaming.

If running the full ISF pipeline via `isf-solution-engine`, return to the engine for Phase 5.

## Companion Skills

| Skill | Provides |
|-------|----------|
| `isf-cortex-analyst` | Semantic model for Analyst tools |
| `isf-cortex-search` | Search service for Search tools |
| `isf-python-udf` | UDFs for custom tools |
| `isf-solution-react-app` | Frontend SSE streaming, Zustand state, FastAPI proxy |
| `isf-deployment` | Deploys agent DDL to Snowflake |

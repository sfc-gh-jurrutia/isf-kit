---
name: isf-cortex-agent
description: >
  Build persona-based Cortex Agents with tools derived from JTBD. Use when:
  (1) creating per-persona agents, (2) deriving tools from user stories,
  (3) configuring action/ML/search/analyst tools, (4) fixing 404 endpoint
  errors, or (5) parsing streaming event responses.
parent_skill: isf-solution-engine
---

# ISF Cortex Agent

## When to Use / Load

Load this skill when the plan requires one or more Cortex Agents and the upstream Analyst/Search/UDF assets are ready to be assembled into persona-specific agents.

## Quick Start

Creates one Cortex Agent **per persona** from `isf-context.md`. Each agent gets tools derived from the persona's jobs-to-be-done:

| Persona JTBD Verb | Tool Type | Example |
|---|---|---|
| see, query, compare | `cortex_analyst_text_to_sql` | "What's our revenue exposure?" |
| find, search, look up | `cortex_search` | "What's the rebooking procedure?" |
| alert, notify, escalate | `generic` (stored procedure) | Send Slack alert to ops team |
| create, update, trigger | `generic` (stored procedure) | Create incident ticket |
| predict, score, classify | `generic` (UDF) | Score customer churn risk |
| chart, visualize | `data_to_chart` | Auto-generate Vega-Lite chart |

Default orchestration model: **`claude-sonnet-4-5`**

### Input

- `isf-context.md` → `agent_architecture.persona_agents[]` (tools, instructions, user_stories per persona)
- Semantic views from `isf-cortex-analyst` (for Analyst tools)
- Search services from `isf-cortex-search` (for Search tools)
- UDFs/procedures from `isf-python-udf` (for action + ML tools)
- `implementation.runtime_contract` for persona env naming and downstream app/deploy handoff

## References

| File | Purpose | When Loaded |
|------|---------|-------------|
| `assets/agent_spec.json` | Full tool taxonomy template (Analyst, Search, Action, ML, Chart, Web) | When creating agent DDL |

## Workflow

```
1. READ SPEC
   └── Load isf-context.md → agent_architecture section
   └── Verify `isf_context.solution_archetype`
   └── For each persona_agent: read role, user_stories, derived_tools
   └── Reject the run if an agent-required archetype has a persona without `user_stories` or `jobs_to_be_done`

2. DERIVE TOOLS FROM PERSONA JTBD
   └── For each persona in persona_agents[]:
       Parse user_stories ("As a {role}, I want to {action}...")
       Classify each {action} verb → tool type (see Quick Start table)
       Confirm derived_tools match user_stories coverage
   └── For action tools: verify stored procedures exist or create stubs
   └── For ML tools: verify UDFs exist (from isf-python-udf)

3. ASSEMBLE TOOL SPECS PER PERSONA
   └── For each persona: build tools[] + tool_resources{} from derived_tools
   └── Build structured instructions (response, orchestration, system)
   └── Set model: claude-sonnet-4-5, budget: {seconds: 30, tokens: 16000}

4. PRE-FLIGHT CHECK
   └── Verify all referenced objects exist:
       - Semantic views (for Analyst tools)
       - Search services (for Search tools)
       - Stored procedures / UDFs (for Action + ML tools)
       - Warehouse (for execution_environment)
   └── Verify column names in search tool_resources match search service

   ⚠️ STOP: Present per-persona agent specs for review before writing files.

5. GENERATE AGENT DDL
   └── One DDL file per persona → src/database/cortex/agent_{persona}.sql
   └── Generate GRANT statements for all persona agents
   └── Generate persona env mapping block using `CORTEX_AGENT_PERSONA_{PERSONA}`
   └── Generate ALTER AGENT examples for iteration

6. VALIDATE
   └── Test each persona's agent via REST API after DDL creation
   └── Verify tool routing: send one sample question per tool, confirm correct tool selected
   └── Check SSE streaming returns expected event types
```

## Agent DDL Template

Generated per persona from `isf-context.md → persona_agents[]`:

```sql
CREATE OR REPLACE AGENT {DATABASE}.{SCHEMA}.{SOLUTION}_{PERSONA}_AGENT
  COMMENT = '{PERSONA_ROLE} agent for {SOLUTION}'
  PROFILE = '{{"display_name": "{PERSONA_ROLE}", "color": "{PERSONA_COLOR}"}}'
  FROM SPECIFICATION
$$
models:
  orchestration: claude-sonnet-4-5

orchestration:
  budget:
    seconds: 30
    tokens: 16000

instructions:
  response: "{PERSONA_RESPONSE_TONE}"
  orchestration: "{PERSONA_TOOL_ROUTING}"
  system: "You are a {DOMAIN} copilot for {PERSONA_ROLE}. {PERSONA_CONTEXT}"
  sample_questions:
    - question: "{PERSONA_SAMPLE_Q1}"

tools:
  {PERSONA_TOOLS}

tool_resources:
  {PERSONA_TOOL_RESOURCES}
$$;
```

## Output

```
src/database/cortex/
├── agent_strategic.sql      # VP / Director agent
├── agent_operational.sql    # Manager agent
├── agent_technical.sql      # Analyst agent
└── grants.sql               # GRANT USAGE ON AGENT for all personas
```

### Runtime Env Contract

Downstream app and deploy steps must use the same persona mapping contract:

```dotenv
CORTEX_AGENT_DATABASE={DATABASE}
CORTEX_AGENT_SCHEMA={SCHEMA}
CORTEX_AGENT_PERSONA_STRATEGIC={SOLUTION}_STRATEGIC_AGENT
CORTEX_AGENT_PERSONA_OPERATIONAL={SOLUTION}_OPERATIONAL_AGENT
CORTEX_AGENT_PERSONA_TECHNICAL={SOLUTION}_TECHNICAL_AGENT
```

Use `CORTEX_AGENT_NAME` only for true single-persona solutions. Do not mix a singular `agent.sql` contract with per-persona outputs.

## Stopping Points

- After READ SPEC: stop if the archetype or persona-agent inputs are incomplete
- After PRE-FLIGHT CHECK: present per-persona agent specs before writing files
- After VALIDATE: present tool-routing and SSE test results before continuing to the app skill

## Tool Types

### Analyst Tool (cortex_analyst_text_to_sql)

**CRITICAL**: `execution_environment` is required.

```json
{"tool_spec": {"type": "cortex_analyst_text_to_sql", "name": "OPERATIONAL_DATA",
  "description": "Query operational metrics. Use for counts, averages, trends. Do NOT use for document lookups."}}
```

```json
"tool_resources": {"OPERATIONAL_DATA": {
  "semantic_view": "{DATABASE}.{SCHEMA}.{SEMANTIC_VIEW}",
  "execution_environment": {"type": "warehouse", "warehouse": "{WAREHOUSE}", "query_timeout": 300}
}}
```

### Search Tool (cortex_search)

**CRITICAL**: `id_column` must be in the search service's SELECT query.

```json
{"tool_spec": {"type": "cortex_search", "name": "DOC_SEARCH",
  "description": "Search procedures and knowledge base. Use for how-to, policy, and troubleshooting. Do NOT use for data queries."}}
```

```json
"tool_resources": {"DOC_SEARCH": {
  "search_service": "{DATABASE}.{SCHEMA}.{SEARCH_SVC}",
  "id_column": "CHUNK_ID", "title_column": "RELATIVE_PATH", "max_results": 5,
  "filter": {"@eq": {"region": "North America"}},
  "columns_and_descriptions": {
    "TEXT": {"description": "Document text content", "type": "string", "searchable": true, "filterable": false},
    "CATEGORY": {"description": "Document category: policy, guide, reference", "type": "string", "searchable": false, "filterable": true}
  }
}}
```

### Action Tool (generic — stored procedure)

For tools that **do things**: alert, notify, create ticket, export report, trigger workflow.

```json
{"tool_spec": {"type": "generic", "name": "send_ops_alert",
  "description": "Send alert to ops team via Slack. Use when user asks to notify, alert, or escalate.",
  "input_schema": {"type": "object", "properties": {
    "entity_id": {"type": "string", "description": "Entity triggering the alert"},
    "severity": {"type": "string", "description": "critical, high, medium, low"},
    "message": {"type": "string", "description": "Alert message text"}
  }, "required": ["entity_id", "severity", "message"]}
}}
```

```json
"tool_resources": {"send_ops_alert": {
  "type": "procedure",
  "execution_environment": {"type": "warehouse", "warehouse": "{WAREHOUSE}"},
  "identifier": "{DATABASE}.{SCHEMA}.SEND_OPS_ALERT"
}}
```

### ML Tool (generic — UDF)

For prediction, scoring, classification using ML models.

```json
{"tool_spec": {"type": "generic", "name": "score_risk",
  "description": "Score entity risk using the ML model. Use for predict, forecast, score questions.",
  "input_schema": {"type": "object", "properties": {
    "entity_id": {"type": "string", "description": "Entity to score"}
  }, "required": ["entity_id"]}
}}
```

```json
"tool_resources": {"score_risk": {
  "type": "function",
  "execution_environment": {"type": "warehouse", "warehouse": "{WAREHOUSE}"},
  "identifier": "{DATABASE}.{SCHEMA}.SCORE_RISK"
}}
```

### Chart Tool (data_to_chart)

Auto-generates Vega-Lite visualizations from data. No tool_resources needed.

```json
{"tool_spec": {"type": "data_to_chart", "name": "data_to_chart",
  "description": "Generate visualizations from data"}}
```

### Web Search Tool

Requires account-level web search enabled. No tool_resources needed.

```json
{"tool_spec": {"type": "web_search", "name": "web_search"}}
```

## Calling the Agent

**DO NOT** call agents via SQL. Agents are invoked **exclusively** via REST API.

### REST API Endpoint

**CRITICAL**: Use `/agents/` not `/cortex-agents/` in the path.

```
POST /api/v2/databases/{DATABASE}/schemas/{SCHEMA}/agents/{AGENT_NAME}:run
```

### Request Format (with threads)

```json
{
  "thread_id": 1234,
  "parent_message_id": 0,
  "messages": [{"role": "user", "content": [{"type": "text", "text": "What were total sales?"}]}],
  "stream": true,
  "tool_choice": {"type": "auto"}
}
```

Create a thread first: `POST /api/v2/cortex/threads`

### Response Format (SSE Streaming)

Two-line format — `event:` line followed by `data:` line. **Parse both.**

| SSE Event Type | Description |
|---|---|
| `response.status` | Planning/reasoning status updates |
| `response.text.delta` | Answer text token (accumulate for typewriter) |
| `response.text` | Complete text block with annotations |
| `response.text.annotation` | Citation (cortex_search_citation with doc_id, doc_title) |
| `response.thinking.delta` | Reasoning token |
| `response.thinking` | Complete thinking block |
| `response.tool_use` | Agent requests a tool (tool_use_id, type, name, input) |
| `response.tool_result` | Tool execution result (content, status) |
| `response.tool_result.status` | Tool execution progress |
| `response.tool_result.analyst.delta` | Analyst: SQL, result_set, suggestions |
| `response.table` | Table content (result_set from SQL query) |
| `response.chart` | Chart content (Vega-Lite spec from data_to_chart) |
| `response` | Final aggregated response (last event) |
| `metadata` | Thread message IDs (use assistant message_id as next parent_message_id) |

### Feedback API

```
POST /api/v2/databases/{DB}/schemas/{SCHEMA}/agents/{NAME}:feedback
Body: {"orig_request_id": "...", "positive": true, "feedback_message": "...", "thread_id": 1234}
```

### Monitoring

Query `SNOWFLAKE.LOCAL.AI_OBSERVABILITY_EVENTS` or use `GET_AI_OBSERVABILITY_EVENTS()` for traces, tool execution logs, and feedback history. Requires MONITOR privilege on the agent.

## Grants Required

```sql
GRANT DATABASE ROLE SNOWFLAKE.CORTEX_USER TO ROLE {PROJECT_ROLE};
GRANT USAGE ON WAREHOUSE {WAREHOUSE} TO ROLE {PROJECT_ROLE};
GRANT SELECT ON ALL TABLES IN SCHEMA {DATABASE}.{DATA_MART} TO ROLE {PROJECT_ROLE};
GRANT USAGE ON CORTEX SEARCH SERVICE {DATABASE}.{SCHEMA}.{SEARCH_SVC} TO ROLE {PROJECT_ROLE};
GRANT USAGE ON FUNCTION {DATABASE}.{SCHEMA}.{UDF_NAME}(STRING) TO ROLE {PROJECT_ROLE};
GRANT USAGE ON PROCEDURE {DATABASE}.{SCHEMA}.{PROC_NAME}(STRING,STRING,STRING) TO ROLE {PROJECT_ROLE};
-- Per-persona agent access
GRANT USAGE ON AGENT {DATABASE}.{SCHEMA}.{SOLUTION}_STRATEGIC_AGENT TO ROLE {APP_ROLE};
GRANT USAGE ON AGENT {DATABASE}.{SCHEMA}.{SOLUTION}_OPERATIONAL_AGENT TO ROLE {APP_ROLE};
GRANT USAGE ON AGENT {DATABASE}.{SCHEMA}.{SOLUTION}_TECHNICAL_AGENT TO ROLE {APP_ROLE};
```

## Advanced Patterns

### Structured Instructions

Use `instructions` object (not a single string) for persona-specific behavior:

- `response`: Tone and format ("Summarize at portfolio level", "Be actionable, include entity IDs")
- `orchestration`: Tool routing ("Use ML_INSIGHTS for risk questions; DOC_SEARCH for procedures")
- `system`: Role context ("You are an operations copilot for airline disruption management")
- `sample_questions`: Derived from persona STAR journey, shown in UI empty state

### Tool Descriptions: What + When + When NOT

Every tool description must include: (1) what it does, (2) when to use it, (3) when NOT to use it. This drives the agent's orchestration — poor descriptions = misrouted queries.

### Safety-Priority Routing

For safety-critical domains, add priority order in `orchestration`:
```
"When a question involves {SAFETY_TOPIC}: 1) Check DOMAIN_KNOWLEDGE for procedures,
2) Check HISTORICAL_REPORTS for precedents, 3) Query data. Include safety disclaimer."
```

## Best Practices

| Practice | Recommendation |
|----------|----------------|
| Tools per agent | 3-7 per persona; keep focused on their JTBD |
| Tool descriptions | State what + when to use + when NOT to |
| Naming | Consistent across tools (customer_id everywhere) |
| Testing | Test each persona agent independently |
| Semantic View | Prefer over stage-based YAML for Analyst tools |
| Model | Default `claude-sonnet-4-5`; use `auto` only if cross-region needed |
| Budget | Start with 30s / 16000 tokens; increase for complex multi-tool queries |

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `Unknown user-defined function SNOWFLAKE.CORTEX.AGENT` | Using SQL instead of REST | Use REST POST to `/agents/{name}:run` |
| `SSL: CERTIFICATE_VERIFY_FAILED` | Underscores in account name | Replace `_` with `-` in hostname |
| 404 Not Found | Wrong endpoint path | Use `/agents/` not `/cortex-agents/` |
| Missing execution environment | No warehouse for Analyst | Add `execution_environment` block |
| Technical difficulties | Search id_column not in SELECT | Include id_column in search service query |
| Agent not found | Wrong DB/schema in URL | Verify fully qualified path matches CREATE AGENT |
| Budget exceeded | Query too complex | Increase `orchestration.budget.seconds` and `tokens` |
| Tool not selected | Poor description | Improve tool description with when/when-not guidance |
| SSE shows fallback text | `event:` lines not parsed | Parse both `event:` and `data:` lines |

## Contract

**Inputs:**
- `isf-context.md` → `agent_architecture.persona_agents[]` (from `isf-spec-curation`)
- Semantic views (from `isf-cortex-analyst`)
- Search services (from `isf-cortex-search`)
- UDFs / stored procedures (from `isf-python-udf`)

**Outputs:**
- `src/database/cortex/agent_{persona}.sql` — Per-persona agent DDL (consumed by `isf-deployment`)
- `src/database/cortex/grants.sql` — Agent grants (consumed by `isf-deployment`)
- Persona env mapping block using `CORTEX_AGENT_PERSONA_{PERSONA}` (consumed by `isf-solution-react-app` and `isf-deployment`)
- Agent endpoint URLs (consumed by `isf-solution-react-app` for per-persona pages)

## Next Skill

After agents are built, **continue to** `../isf-solution-react-app/SKILL.md` to build persona-based React pages with SSE streaming.

## Companion Skills

| Skill | Provides |
|-------|----------|
| `isf-cortex-analyst` | Semantic views for Analyst tools |
| `isf-cortex-search` | Search services for Search tools |
| `isf-python-udf` | UDFs + stored procedures for Action and ML tools |
| `isf-solution-react-app` | Per-persona pages with agent sidebar, SSE streaming |
| `isf-deployment` | Deploys persona agent DDL to Snowflake |

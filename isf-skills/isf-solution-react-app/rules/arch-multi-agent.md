# Rule: Cortex Agent Tool Design — 3-Pillar Architecture

## Impact: HIGH

## Tags: cortex, agent, persona, tools, routing, 3-pillar

## Anti-Pattern

Do NOT build manual Python intent classification or orchestrator classes. The Cortex Agent handles tool routing via its `orchestration` instructions. Regex/keyword-based routing is fragile and duplicates built-in capabilities.

```python
# BAD — manually rebuilding what Cortex Agent already does
class AgentOrchestrator:
    def process_message(self, message):
        intent = self._classify_intent(message)  # regex-based, brittle
        if intent == "analytical": return self.analyst.run(message)
        elif intent == "search": return self.historian.run(message)
```

Also do NOT call `SNOWFLAKE.CORTEX.COMPLETE` or build raw LLM prompts when a Cortex Agent exists. The agent has tool access; the raw LLM does not.

## Correct Pattern: 3-Pillar Tool Design

Design tools for each persona agent according to three pillars:

### Pillar 1: AI in Every Workflow (Action Tools)

Give agents `generic` tools (stored procedures) so they can **do things**, not just answer questions. Derive these from the persona's jobs-to-be-done action verbs: alert, notify, create, trigger, export.

```json
{"tool_spec": {"type": "generic", "name": "send_ops_alert",
  "description": "Send alert to ops team via Slack. Use when user asks to notify, alert, or escalate an issue. Do NOT use for data queries.",
  "input_schema": {"type": "object", "properties": {
    "entity_id": {"type": "string"}, "severity": {"type": "string"}, "message": {"type": "string"}
  }, "required": ["entity_id", "severity", "message"]}}}
```

```json
"tool_resources": {"send_ops_alert": {
  "type": "procedure", "identifier": "DB.SCHEMA.SEND_OPS_ALERT",
  "execution_environment": {"type": "warehouse", "warehouse": "WH"}}}
```

### Pillar 2: Business Logic & Context (Semantic Views + Routing)

Use `cortex_analyst_text_to_sql` (semantic views) and `cortex_search` tools for data access. Write tool descriptions with **what + when + when NOT** to drive routing. Use `orchestration` instructions for intent-to-tool mapping.

**Tool description pattern:**
```
"Query operational metrics: counts, averages, trends, comparisons.
 Use for quantitative questions about current or historical data.
 Do NOT use for document lookups, predictions, or actions."
```

**When to split Analyst tools:**
- Data sources differ (operational DB vs ML feature store)
- Query patterns fundamentally differ (SQL vs model inference)
- Access control varies between domains

**Keep as one tool when:**
- All queries hit the same semantic view
- The distinction is question complexity, not data source

### Pillar 3: Unified Data Foundation (Optional Governance Tools)

For solutions requiring lineage, audit, or compliance visibility, add governance tools:

```json
{"tool_spec": {"type": "generic", "name": "explain_lineage",
  "description": "Explain the data lineage and transformations for a given metric. Use when user asks where data comes from or how it's calculated.",
  "input_schema": {"type": "object", "properties": {
    "metric_name": {"type": "string"}
  }, "required": ["metric_name"]}}}
```

## Tool Derivation from Persona JTBD

Map each persona's user stories to tool types:

| Action Verb | Tool Type | Example |
|---|---|---|
| see, query, compare | `cortex_analyst_text_to_sql` | "What's revenue exposure?" |
| find, search, look up | `cortex_search` | "What's the rebooking procedure?" |
| alert, notify, escalate | `generic` (stored procedure) | Send Slack alert |
| create, update, trigger | `generic` (stored procedure) | Create incident ticket |
| predict, score, classify | `generic` (UDF) | Score customer churn |
| chart, visualize | `data_to_chart` | Auto-generate Vega-Lite |

## Persona-to-Tool Mapping

Each persona agent gets tools tailored to their role:

| Persona | Read Tools | Search Tools | Action Tools | ML/Chart Tools |
|---|---|---|---|---|
| Strategic | `PORTFOLIO_DATA` | `STRATEGY_DOCS` | `send_executive_brief`, `export_report` | `data_to_chart` |
| Operational | `OPERATIONAL_DATA` | `PROCEDURE_SEARCH` | `send_ops_alert`, `create_ticket` | `score_risk`, `data_to_chart` |
| Technical | `ML_INSIGHTS`, `RAW_DATA` | `TECHNICAL_DOCS` | `export_analysis` | `run_model`, `data_to_chart` |

## `data_to_chart` Simplifies Visualization

Instead of building custom chart endpoints, use the built-in `data_to_chart` tool. The agent pairs it with an Analyst query to get data, then generates a Vega-Lite spec. The frontend renders it directly from the `response.chart` SSE event.

```json
{"tool_spec": {"type": "data_to_chart", "name": "data_to_chart",
  "description": "Generate visualizations from data"}}
```

No `tool_resources` needed. The agent automatically routes visualization requests through this tool.

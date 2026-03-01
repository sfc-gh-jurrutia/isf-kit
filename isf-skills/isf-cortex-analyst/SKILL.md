---
name: isf-cortex-analyst
description: >
  Build semantic models for Cortex Analyst text-to-SQL. Use when: (1) creating
  semantic models/views, (2) defining dimensions and metrics, (3) configuring
  verified queries, (4) implementing Cortex Search for high-cardinality
  dimensions, or (5) deploying YAML to Semantic Views.
parent_skill: isf-solution-engine
---

# ISF Cortex Analyst

## Strategic Direction

> **Snowflake is transitioning from stage-based YAML to native Semantic Views.** For new work, prefer the hybrid pattern: author YAML in Git, deploy as Semantic View in Snowflake.

## Quick Start

### What Does This Skill Do?

Creates a semantic model that enables natural-language querying over structured data. The model describes logical tables, dimensions, metrics, filters, relationships, and verified queries.

Output: `src/database/cortex/semantic_model.yaml` (authored in Git, deployed as Semantic View).

### Input

- DATA_MART views/tables from `isf-data-architecture` (the model maps to these)
- `isf-context.md` for: Cortex feature requirements, persona questions, golden queries

## References

| File | Purpose | When Loaded |
|------|---------|-------------|
| `assets/semantic_model.yaml` | Template YAML with example dimensions, metrics, verified queries | When creating a new model |
| `references/ml-semantic-view-pattern.md` | ML explainability semantic view template (SHAP, metrics, PDP, calibration) | When solution includes ML notebooks |

## Core Workflow

```
1. READ SPEC
   └── Load isf-context.md Cortex features section
   └── Identify DATA_MART views/tables the model will map to
   └── Gather persona questions and golden queries

2. BUILD MODEL YAML
   └── Define logical tables mapping to DATA_MART views
   └── Add dimensions, time_dimensions, facts, metrics
   └── Define relationships between tables
   └── Add filters for common query patterns
   └── Write verified queries (minimum 3-5) using __table prefix

   ⚠️ STOP: Present semantic model YAML for review before writing file.

3. OUTPUT
   └── Write to src/database/cortex/semantic_model.yaml
   └── If high-cardinality dimensions: note Cortex Search dependency
```

## Recommended Pattern: YAML in Git, Semantic View in Snowflake

1. **Author YAML** in `src/database/cortex/semantic_model.yaml` (version-controlled)
2. **Deploy as Semantic View** via schemachange or `make deploy-db`
3. **Reference Semantic View** at runtime (not the YAML file)
4. **Round-trip export** back to YAML if model is edited in UI

### Deploy YAML as Semantic View

```sql
CALL SYSTEM$CREATE_SEMANTIC_VIEW_FROM_YAML(
  '{DATABASE}.{SCHEMA}',
  $${yaml_content}$$,
  TRUE
);
```

### Export Semantic View to YAML

```sql
SELECT SYSTEM$READ_YAML_FROM_SEMANTIC_VIEW('{DATABASE}.{SCHEMA}.{MODEL_NAME}');
```

## YAML Structure

```yaml
name: {solution}_model
description: "{Solution} analytics semantic model"

tables:
  - name: orders
    base_table:
      database: {DATABASE}
      schema: {DATA_MART}
      table: ORDERS_V
    primary_key:
      columns: [order_id]

    dimensions:
      - name: region
        expr: region
        data_type: TEXT
        sample_values: ["North America", "Europe", "APAC"]

    time_dimensions:
      - name: order_date
        expr: order_date
        data_type: DATE

    facts:
      - name: revenue
        expr: revenue
        data_type: NUMBER

    metrics:
      - name: total_revenue
        expr: SUM(orders.revenue)

    filters:
      - name: last_90_days
        expr: order_date >= DATEADD(day, -90, CURRENT_DATE)

relationships:
  - name: orders_to_customers
    left_table: orders
    right_table: customers
    relationship_columns:
      - left_column: customer_id
        right_column: customer_id

verified_queries:
  - name: revenue_by_region
    question: "Total revenue by region?"
    use_as_onboarding_question: true
    sql: |
      SELECT region, SUM(revenue) AS total_revenue
      FROM __orders
      GROUP BY region
```

## Verified Queries

**CRITICAL rules:**
- SQL uses **logical table names** with `__` prefix (e.g., `__orders`, not the physical table name)
- Use `use_as_onboarding_question: true` for suggested questions shown to users
- Include `verified_at` (unix timestamp) and `verified_by` for audit

Verified queries serve as golden queries for testing — they validate the model works correctly.

## Cortex Search Integration (High-Cardinality Dimensions)

For dimensions with many unique values (customer names, product SKUs), use Cortex Search to resolve fuzzy matches:

```yaml
dimensions:
  - name: customer_name
    expr: customer_name
    data_type: TEXT
    cortex_search_service:
      service: CUSTOMER_NAME_SEARCH
      literal_column: customer_name
      database: {DATABASE}
      schema: {SCHEMA}
```

This requires a Cortex Search service (from `isf-cortex-search`) indexing the dimension values.

## Semantic View Permissions

| Privilege | Purpose |
|-----------|---------|
| SELECT | Query the semantic view |
| REFERENCES | Required for agents and data sharing |
| MONITOR | View usage logs without data access |
| OWNERSHIP | Modify via DDL or UI |

```sql
GRANT SELECT, REFERENCES ON SEMANTIC VIEW {DATABASE}.{SCHEMA}.{MODEL_NAME} TO ROLE {PROJECT_ROLE};
```

## Observability

```sql
SELECT REQUEST_TIMESTAMP, USER_NAME, QUERY_TEXT, GENERATED_SQL, STATUS
FROM TABLE(SNOWFLAKE.LOCAL.CORTEX_ANALYST_REQUESTS(INTERVAL => '7 days'))
ORDER BY REQUEST_TIMESTAMP DESC;
```

## Best Practices

| Practice | Recommendation |
|----------|----------------|
| Model size | 50-100 columns max |
| Base tables | Use analytics-ready DATA_MART views, not raw tables |
| Column names | Business-friendly (total_revenue, not tot_rev) |
| Synonyms | Mirror user vocabulary (e.g., "sales" → revenue column) |
| Scope | One model per use case or domain area |
| Deployment | YAML in Git → Semantic View in Snowflake |
| Golden queries | Minimum 3-5 verified queries per model |

## Advanced Patterns

### Multiple Semantic Views per Agent

When a solution has distinct data domains (e.g., operational metrics vs ML insights), split them into separate semantic views rather than one monolithic model. The Cortex Agent references each as a separate Analyst tool.

```
src/database/cortex/
├── operational_model.yaml          # Operational data (DATA_MART tables)
├── ml_insights_model.yaml          # ML explainability (ML schema tables)
├── agent.sql                       # Agent with 2 Analyst tools
└── search_service.sql
```

**When to split:**
- Data lives in different schemas (DATA_MART vs ML)
- Different user intents map to different tables
- A single model would exceed 50-100 column recommended max
- Agent routing benefits from distinct tool descriptions

**When to keep one model:**
- All tables are in the same schema
- Queries frequently join across the tables
- Model is small enough (under 50 columns total)

### Cross-Schema Models

A semantic model can reference tables from multiple schemas. Specify the full path in each `base_table`:

```yaml
tables:
  - name: entity_summary
    base_table:
      database: "{DATABASE}"
      schema: "{DATA_MART}"
      table: ENTITY_SUMMARY_V
  - name: model_metrics
    base_table:
      database: "{DATABASE}"
      schema: ML
      table: MODEL_METRICS
  - name: feature_importance
    base_table:
      database: "{DATABASE}"
      schema: ML
      table: GLOBAL_FEATURE_IMPORTANCE
```

### Custom Instructions Block

Add a `custom_instructions` section to teach the model domain-specific terminology, abbreviations, and query routing guidance. This is critical for industry-specific solutions where the LLM may not know the domain vocabulary.

```yaml
custom_instructions: |
  DOMAIN TERMINOLOGY:
  - {TERM_A}: {definition} (unit: {unit})
  - {TERM_B}: {definition} (unit: {unit})
  - {ABBREVIATION}: stands for {full_name}

  QUERY ROUTING:
  - For {metric_type} questions → use {table_name}
  - For {comparison} questions → join {table_a} with {table_b}
  - For ML explanations → use feature_importance table

  DATA NOTES:
  - {table_name} contains data from {date_range}
  - {column_name} values are {description of valid values}
```

### Named Filters

Define reusable filters that users can reference by name. Include filters for common query patterns and data quality:

```yaml
filters:
  - name: active_records
    expr: "{status_column} = 'ACTIVE'"

  - name: anomalies_only
    expr: "{anomaly_flag_column} = TRUE"

  - name: valid_measurements
    expr: "{metric_column} > 0 AND {metric_column} IS NOT NULL"

  - name: recent_data
    expr: "{date_column} >= DATEADD(day, -30, CURRENT_DATE)"
```

### ML Explainability Semantic View

When the solution includes ML notebooks, create a dedicated semantic view over the ML schema tables. **Load** `references/ml-semantic-view-pattern.md` for the full template.

This enables natural-language queries like:
- "What are the top features for the {model_name} model?"
- "Show me the calibration curve for {model_name}"
- "How accurate is the {model_name} model?"

## Commands

```bash
# Deploy YAML as Semantic View
snow sql -q "CALL SYSTEM\$CREATE_SEMANTIC_VIEW_FROM_YAML('{DB}.{SCHEMA}', \$\$<yaml>\$\$, TRUE);" -c conn

# List semantic views
snow sql -q "SHOW SEMANTIC VIEWS IN SCHEMA {DB}.{SCHEMA};" -c conn

# Export to YAML
snow sql -q "SELECT SYSTEM\$READ_YAML_FROM_SEMANTIC_VIEW('{DB}.{SCHEMA}.{MODEL}');" -c conn
```

## ISF Workflow Integration

### Where the Model Lives

```
src/database/cortex/
├── semantic_model.yaml    # This skill's output
├── agent.sql              # References this model (isf-cortex-agent)
└── search_service.sql     # May provide high-cardinality resolution (isf-cortex-search)
```

### Deployment Order

1. DATA_MART views created (by `isf-data-architecture` migrations)
2. Semantic model YAML authored (this skill)
3. Deployed as Semantic View (by `isf-deployment`)
4. Referenced by Cortex Agent (by `isf-cortex-agent`)

## Contract

**Inputs:**
- DATA_MART views/tables (from `isf-data-architecture`)
- ML schema tables (from `isf-ml-models`) — if ML semantic view
- `isf-context.md` Cortex features and persona questions (from `isf-spec-curation`)

**Outputs:**
- `src/database/cortex/semantic_model.yaml` — Semantic model YAML (consumed by `isf-deployment`, `isf-cortex-agent`)
- Semantic View in Snowflake (consumed by `isf-cortex-agent`)

## Next Skill

After the semantic model is built:

**Continue to** `../isf-cortex-search/SKILL.md` if the plan includes RAG or document search.

Otherwise, **continue to** `../isf-cortex-agent/SKILL.md` to combine Analyst + Search + UDF tools into an agent.

If running the full ISF pipeline via `isf-solution-engine`, return to the engine for Phase 4b.

## Companion Skills

| Skill | Relationship |
|-------|-------------|
| `isf-data-architecture` | Provides DATA_MART views the model maps to |
| `isf-cortex-agent` | References this model as an Analyst tool |
| `isf-cortex-search` | Provides high-cardinality dimension resolution |
| `isf-deployment` | Deploys the Semantic View to Snowflake |
| `isf-solution-testing` | Uses verified queries as golden query test cases |

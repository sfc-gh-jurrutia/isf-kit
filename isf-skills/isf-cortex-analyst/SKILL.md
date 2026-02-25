---
name: isf-cortex-analyst
description: >
  Build semantic models for Cortex Analyst text-to-SQL. Use when: (1) creating
  semantic models/views, (2) defining dimensions and metrics, (3) configuring
  verified queries, (4) implementing Cortex Search for high-cardinality
  dimensions, or (5) deploying YAML to Semantic Views.
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

## Companion Skills

| Skill | Relationship |
|-------|-------------|
| `isf-data-architecture` | Provides DATA_MART views the model maps to |
| `isf-cortex-agent` | References this model as an Analyst tool |
| `isf-cortex-search` | Provides high-cardinality dimension resolution |
| `isf-deployment` | Deploys the Semantic View to Snowflake |
| `isf-testing` | Uses verified queries as golden query test cases |

---
name: snowflake-cortex-analyst
description: Build semantic models for Cortex Analyst text-to-SQL. Use when: (1) creating semantic models/views, (2) defining dimensions and metrics, (3) configuring verified queries, (4) integrating Analyst with Cortex Agents, (5) fixing missing execution_environment errors, (6) implementing Cortex Search for high-cardinality dimensions, or (7) deploying YAML to Semantic Views.
parent_skill: build_solution
---

# Cortex Analyst Semantic Models

## Strategic Direction

> **Snowflake is transitioning from stage-based YAML to native Semantic Views.** For new work, prefer the hybrid pattern: author YAML in Git, deploy as Semantic View in Snowflake.

## Overview

Cortex Analyst answers natural-language questions over structured data using a semantic model that describes:
- Logical tables mapped to Snowflake tables/views
- Dimensions & time dimensions
- Facts & metrics (aggregations)
- Filters, relationships, verified queries

## Recommended Pattern: YAML in Git → Semantic View in Snowflake

1. **Author YAML** in Git (version-controlled)
2. **Deploy as Semantic View** via CI/CD
3. **Reference Semantic View** at runtime (not the YAML file)
4. **Round-trip export** back to YAML if needed

## Quick Start

### Deploy YAML as Semantic View (Recommended)

```sql
CALL SYSTEM$CREATE_SEMANTIC_VIEW_FROM_YAML(
  'DB.SCHEMA',
  $$
name: sales_model
description: Sales analytics semantic model
tables:
  - name: orders
    base_table:
      database: DB
      schema: MART
      table: ORDERS_V
    primary_key:
      columns: [order_id]
    dimensions:
      - name: region
        expr: region
        data_type: TEXT
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
verified_queries:
  - name: revenue_by_region
    question: "Total revenue by region?"
    use_as_onboarding_question: true
    sql: |
      SELECT region, SUM(revenue) AS total_revenue
      FROM __orders
      GROUP BY region
$$,
  TRUE
);
```

### Legacy: Upload YAML to Stage

```bash
snow stage copy file://./semantic_model.yaml @DB.SCHEMA.MODELS -c connection
```

### Export Semantic View to YAML

```sql
SELECT SYSTEM$READ_YAML_FROM_SEMANTIC_VIEW('DB.SCHEMA.SALES_MODEL');
```

## YAML Structure

```yaml
name: sales_model
description: Sales analytics semantic model

tables:
  - name: orders
    base_table:
      database: DB
      schema: MART
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

## Verified Queries (CRITICAL)

- SQL uses **logical table names** with `__` prefix (e.g., `__orders`)
- Use `use_as_onboarding_question: true` for suggested questions
- Include `verified_at` (unix timestamp) and `verified_by`

## Cortex Search Integration (High-Cardinality)

```yaml
dimensions:
  - name: customer_name
    expr: customer_name
    data_type: TEXT
    cortex_search_service:
      service: CUSTOMER_NAME_SEARCH
      literal_column: customer_name
      database: DB
      schema: SEARCH
```

## Agent Integration

### Using Semantic View (Recommended)

```json
{
  "tools": [{
    "tool_spec": {
      "type": "cortex_analyst_text_to_sql",
      "name": "ANALYTICS_TOOL",
      "description": "Query analytics data"
    }
  }],
  "tool_resources": {
    "ANALYTICS_TOOL": {
      "semantic_view": "DB.SCHEMA.SALES_MODEL",
      "execution_environment": {
        "type": "warehouse",
        "warehouse": "ANALYST_WH",
        "query_timeout": 300
      }
    }
  }
}
```

### Using YAML File (Legacy)

```json
{
  "tools": [{
    "tool_spec": {
      "type": "cortex_analyst_text_to_sql",
      "name": "ANALYTICS_TOOL",
      "description": "Query analytics data"
    }
  }],
  "tool_resources": {
    "ANALYTICS_TOOL": {
      "semantic_model_file": "@DB.SCHEMA.MODELS/model.yaml",
      "execution_environment": {
        "type": "warehouse",
        "warehouse": "ANALYST_WH",
        "query_timeout": 300
      }
    }
  }
}
```

**Critical**: `execution_environment` block is REQUIRED. Without it: "The Analyst tool is missing an execution environment."

## API Calls

### Using Semantic View (Recommended)

```json
{
  "messages": [{"role": "user", "content": [{"type": "text", "text": "Total revenue by region?"}]}],
  "semantic_view": "DB.SCHEMA.SALES_MODEL"
}
```

### Using YAML File (Legacy)

```json
{
  "messages": [{"role": "user", "content": [{"type": "text", "text": "Total revenue by region?"}]}],
  "semantic_model_file": "@DB.SCHEMA.MODELS/semantic_model.yaml"
}
```

## Semantic View Permissions

| Privilege | Purpose |
|-----------|---------|
| SELECT | Query the semantic view |
| REFERENCES | Required for agents/data sharing |
| MONITOR | View usage logs without data access |
| OWNERSHIP | Modify via DDL or UI |

```sql
-- Grant typical access
GRANT SELECT, REFERENCES ON SEMANTIC VIEW DB.SCHEMA.SALES_MODEL TO ROLE ANALYST_ROLE;
GRANT MONITOR ON SEMANTIC VIEW DB.SCHEMA.SALES_MODEL TO ROLE OPS_ROLE;
```

## Observability

```sql
-- Query recent Analyst requests
SELECT REQUEST_TIMESTAMP, USER_NAME, QUERY_TEXT, GENERATED_SQL, STATUS
FROM TABLE(SNOWFLAKE.LOCAL.CORTEX_ANALYST_REQUESTS(INTERVAL => '7 days'))
ORDER BY REQUEST_TIMESTAMP DESC;
```

## Best Practices

| Practice | Recommendation |
|----------|----------------|
| Model size | ≤50-100 columns total |
| Tables | Use analytics-ready views |
| Names | Business-friendly (total_revenue, not tot_rev) |
| Synonyms | Mirror user vocabulary |
| Scope | One model per use case |
| Deployment | YAML in Git → Semantic View in Snowflake |

## Commands

```bash
# Deploy YAML as Semantic View
snow sql -q "CALL SYSTEM\$CREATE_SEMANTIC_VIEW_FROM_YAML('DB.SCHEMA', \$\$<yaml>\$\$, TRUE);" -c conn

# List semantic views
snow sql -q "SHOW SEMANTIC VIEWS IN SCHEMA DB.SCHEMA;" -c conn

# Export to YAML
snow sql -q "SELECT SYSTEM\$READ_YAML_FROM_SEMANTIC_VIEW('DB.SCHEMA.MODEL_NAME');" -c conn

# Legacy: Create stage
snow sql -q "CREATE STAGE IF NOT EXISTS DB.SCHEMA.MODELS DIRECTORY = (ENABLE=TRUE);" -c conn

# Legacy: Upload YAML
snow stage copy file://./model.yaml @DB.SCHEMA.MODELS -c conn
```

---
description: Snowflake development standards, MCP usage, and official documentation references
alwaysApply: true
---

# Snowflake Development Rules

## Official Documentation References

When working on Snowflake-related tasks, ALWAYS reference official Snowflake documentation:

### Primary Documentation Sources
- **Docs Portal**: https://docs.snowflake.com/
- **Developer Portal**: https://docs.snowflake.com/en/developer
- **SQL Command Reference**: https://docs.snowflake.com/en/sql-reference-commands
- **Data Types Summary**: https://docs.snowflake.com/en/sql-reference/intro-summary-data-types
- **Snowpark API**: https://docs.snowflake.com/en/developer-guide/snowpark/index
- **Snowflake Cortex**: https://docs.snowflake.com/en/user-guide/snowflake-cortex/overview

### CLI Tools
| Tool | Use Case | Documentation |
|------|----------|---------------|
| SnowSQL | File staging (PUT/GET), SQL scripts, CI/CD | https://docs.snowflake.com/en/user-guide/snowsql |
| Snowflake CLI | Modern CLI, Snowpark apps, Native Apps | https://docs.snowflake.com/en/developer-guide/snowflake-cli/index |

### Key Reference Areas
| Topic | Documentation URL |
|-------|-------------------|
| Data Loading | https://docs.snowflake.com/en/user-guide/data-load-overview |
| Access Control | https://docs.snowflake.com/en/user-guide/security-access-control-overview |
| Warehouses | https://docs.snowflake.com/en/user-guide/warehouses-overview |
| Compute Costs | https://docs.snowflake.com/en/user-guide/cost-understanding-compute |
| Stages | https://docs.snowflake.com/en/sql-reference/sql/create-stage |
| Tasks & Streams | https://docs.snowflake.com/en/user-guide/tasks-intro |
| UDFs | https://docs.snowflake.com/en/developer-guide/udf/udf-overview |
| Stored Procedures | https://docs.snowflake.com/en/developer-guide/stored-procedure/stored-procedures-overview |
| Dynamic Tables | https://docs.snowflake.com/en/user-guide/dynamic-tables-about |
| Materialized Views | https://docs.snowflake.com/en/user-guide/views-materialized |
| Time Travel | https://docs.snowflake.com/en/user-guide/data-time-travel |
| Cloning | https://docs.snowflake.com/en/user-guide/object-clone |
| Snowpipe | https://docs.snowflake.com/en/user-guide/data-load-snowpipe-intro |

### Query Optimization
| Tool | Documentation URL |
|------|-------------------|
| EXPLAIN | https://docs.snowflake.com/en/sql-reference/sql/explain |
| Query Profile | https://docs.snowflake.com/en/user-guide/ui-query-profile |

### When to Use Web Search
- Use web search to verify current syntax and features against official docs
- Search for: `site:docs.snowflake.com <your query>` for authoritative answers
- Cross-reference any community solutions with official documentation

## MCP Server Usage

- Use the `snowflake-default` MCP server for querying Snowflake data
- For multi-environment setups, configure additional servers (staging, prod) in `.cursor/mcp.json`
- Always verify which environment you're connected to before running queries
- Use `mcp_snowflake-default_list_objects` to explore available databases, schemas, tables
- Use `mcp_snowflake-default_describe_object` to understand table structures before writing queries

## Credentials

- Never commit credentials to the repository
- Use `~/.snowflake/connections.toml` for MCP credentials
- Use `~/.snowsql/config` for SnowSQL credentials
- Use Programmatic Access Tokens (PAT), not passwords
- Reference: https://docs.snowflake.com/en/user-guide/programmatic-access-tokens

## SQL Best Practices

- Always specify database and schema in queries (e.g., `DATABASE.SCHEMA.TABLE`)
- Use role-based access control (RBAC)
- Prefer read-only roles for production queries
- Test queries in development before running in production
- Use `LIMIT` clauses when exploring data to avoid excessive compute costs
- Prefer `COPY INTO` for bulk data loading over row-by-row inserts

## Code Generation Guidelines

When generating Snowflake SQL or Snowpark code:
1. **Verify syntax** against official SQL reference before suggesting
2. **Include comments** explaining the purpose of complex queries
3. **Use parameterized queries** to prevent SQL injection
4. **Follow naming conventions**: UPPERCASE for SQL keywords, snake_case for identifiers
5. **Add error handling** for stored procedures and UDFs

## Setup

If MCP tools are not available, run:
```bash
./scripts/setup-snowflake-mcp.sh
```

## SQL Patterns Reference

@sql-patterns.md

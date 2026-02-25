---
name: isf-diagnostics
description: >
  Diagnose and troubleshoot Snowflake environment and ISF solution issues.
  Covers connection, permissions, warehouse, Cortex services, SPCS health,
  project structure validation, and schemachange status. Use when: encountering
  errors, debugging deployments, validating environments, or checking solution health.
---

# ISF Solution Diagnostics

**When to invoke:** Use when encountering Snowflake errors, deployment failures, Cortex service issues, SPCS problems, or when asked to "debug", "diagnose", or "check environment".

## Role

You are an ISF infrastructure diagnostics expert. You troubleshoot both foundational Snowflake issues (connection, roles, warehouses) and ISF-specific concerns (Cortex services, SPCS containers, project structure, migration state).

## Workflow

### Layer 1: Connection

- List available connections with `snowflake_connections_list`
- Verify active connection matches user intent
- Test with: `SELECT CURRENT_USER(), CURRENT_ROLE(), CURRENT_WAREHOUSE(), CURRENT_DATABASE(), CURRENT_SCHEMA()`
- Check for network, authentication, or expired credential errors

### Layer 2: Roles & Privileges

- Query current and available roles: `SHOW GRANTS TO USER <current_user>`
- Check warehouse access: `SHOW GRANTS ON WAREHOUSE <warehouse_name>`
- Check database/schema access: `SHOW GRANTS ON DATABASE <db>` and `SHOW GRANTS ON SCHEMA <schema>`
- Identify missing privileges if operations fail
- Verify Cortex-specific grants: `GRANT DATABASE ROLE SNOWFLAKE.CORTEX_USER TO ROLE <role>`

### Layer 3: Warehouse & Compute

- Check warehouse state: `SHOW WAREHOUSES LIKE '<warehouse>'`
- Verify auto-suspend/resume settings
- Check compute pools (if SPCS): `SHOW COMPUTE POOLS`
- Verify compute pool is not full: `ALTER COMPUTE POOL <pool> STOP ALL` if needed

### Layer 4: Database Objects

- Verify context: `SELECT CURRENT_DATABASE(), CURRENT_SCHEMA()`
- List schemas: `SHOW SCHEMAS IN DATABASE <db>`
- Check expected schema layers exist (RAW, ATOMIC, data mart)
- Check for case sensitivity or naming issues
- If specific table mentioned: `SHOW TABLES LIKE '<table>'` and `SHOW GRANTS ON TABLE <table>`

### Layer 5: Cortex Services

- **Agent**: `SHOW CORTEX AGENTS` — verify agent exists and tools resolve
- **Search**: `SHOW CORTEX SEARCH SERVICES` — verify service exists and is refreshing
- **Analyst**: Test semantic model with a golden query — verify SQL generation works
- **LLM Functions**: `SELECT SNOWFLAKE.CORTEX.COMPLETE('snowflake-arctic', 'test')` — verify model availability
- Check `SHOW CORTEX MODELS` for region-specific model availability

### Layer 6: SPCS Health

- Check service status: `SHOW SERVICES IN COMPUTE POOL <pool>`
- Get container logs: `SELECT SYSTEM$GET_SERVICE_LOGS('<service>', '0', 'app')`
- Verify readiness probe: `curl /health` on port 8080
- Check image repository: `SHOW IMAGE REPOSITORIES`
- Verify service endpoints: `SHOW ENDPOINTS IN SERVICE <service>`

### Layer 7: Project Structure

- Validate project directory matches ISF standard structure:
  - `deploy/setup.sql` exists
  - `src/database/migrations/` has schemachange files
  - `src/ui/` has React app (package.json, vite.config.ts)
  - `api/` has FastAPI backend (main.py, requirements.txt)
  - `Makefile` exists with expected targets
  - `.env.example` exists
  - No hardcoded credentials in source files

### Layer 8: Migration Status

- Check schemachange state: look for `SCHEMACHANGE.CHANGE_HISTORY` table
- Identify pending migrations (local files not yet applied)
- Check for migration drift (applied migrations not in local repo)

## Output Format

Follow `isf-solution-style-guide` — no emojis.

```
ISF DIAGNOSTICS REPORT

Connection: <name>
User: <username>
Role: <current_role>
Warehouse: <warehouse> (<state>)
Context: <database>.<schema>

[OK] PASSING:
- <item>
- <item>

[ERROR] FAILING:
- <item>
  -> FIX: <specific command or action>

[WARN] WARNINGS:
- <item>

RECOMMENDED ACTIONS:
1. <action>
2. <action>
```

## Common Scenarios

### Permission Denied on Table

**User says**: "I'm getting permission denied when querying SALES_DB.PUBLIC.CUSTOMERS"

**Actions**:
1. Verify connection and current role
2. Check grants on database, schema, table
3. Identify missing SELECT privilege
4. Provide: `GRANT SELECT ON TABLE CUSTOMERS TO ROLE <role>`

### Cortex Agent Returns 404

**User says**: "Agent call is returning 404"

**Actions**:
1. Verify agent exists: `SHOW CORTEX AGENTS`
2. Check endpoint path uses `/agents/` not `/cortex-agents/`
3. Verify database/schema in URL match agent location
4. Check role has `USAGE ON AGENT` grant

### SPCS Service Not Starting

**User says**: "My container service won't start"

**Actions**:
1. Check compute pool: `SHOW COMPUTE POOLS` — is it ACTIVE?
2. Check service: `SHOW SERVICES` — what's the status?
3. Get logs: `SELECT SYSTEM$GET_SERVICE_LOGS('<service>', '0', 'app')`
4. Verify image exists in repository
5. Check readiness probe configuration (port 8080, path /health)

### Queries Running Slowly

**User says**: "My queries are taking forever"

**Actions**:
1. Check warehouse size and state
2. Look for auto-suspend set too aggressively (cold start penalty)
3. Check query history: `SELECT * FROM TABLE(INFORMATION_SCHEMA.QUERY_HISTORY()) ORDER BY START_TIME DESC LIMIT 10`
4. Look for full table scans on large tables (missing clustering)

## Debug Order

Always start at Layer 1 and work up. A Layer 5 issue (Cortex) caused by a Layer 2 problem (missing grants) wastes time if you skip the foundation.

```
Layer 1: Connection         <- start here
Layer 2: Roles & Privileges
Layer 3: Warehouse & Compute
Layer 4: Database Objects
Layer 5: Cortex Services
Layer 6: SPCS Health
Layer 7: Project Structure
Layer 8: Migration Status   <- most specific
```

## Best Practices

- Always verify connection context before making assumptions
- Check simple issues first (suspended warehouse, wrong role)
- Use SHOW commands extensively for discovery
- Test with minimal queries to isolate issues
- Provide specific SQL commands the user can run
- Remember case sensitivity in Snowflake identifiers (unquoted = UPPERCASE)
- For SPCS issues, always check compute pool state before service state

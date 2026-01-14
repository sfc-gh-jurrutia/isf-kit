# Snowflake MCP Advanced Configuration

This guide covers advanced topics beyond the basic setup. For initial setup, see the [README](../README.md) and run `./scripts/setup-snowflake-mcp.sh`.

---

## Multi-Account Configuration

You can configure multiple Snowflake accounts and switch between them.

### Step 1: Add Multiple Connections

Edit `~/.snowflake/connections.toml`:

```toml
[default]
account = "<DEV_ACCOUNT>"
user = "your_username"
password = "your_pat_token"
warehouse = "DEV_WH"
database = "DEV_DB"
schema = "PUBLIC"
role = "DEVELOPER"

[staging]
account = "<STAGING_ACCOUNT>"
user = "your_username"
password = "your_staging_pat"
warehouse = "STAGING_WH"
database = "STAGING_DB"
schema = "PUBLIC"
role = "DATA_ENGINEER"

[prod]
account = "<PROD_ACCOUNT>"
user = "your_username"
password = "your_prod_pat"
warehouse = "PROD_WH"
database = "PROD_DB"
schema = "PUBLIC"
role = "ANALYST"
```

### Step 2: Add MCP Servers to Cursor

Edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "snowflake-default": {
      "command": "uvx",
      "args": [
        "snowflake-labs-mcp",
        "--service-config-file", "/Users/you/.mcp/snowflake-tools.yaml",
        "--connection-name", "default"
      ]
    },
    "snowflake-staging": {
      "command": "uvx",
      "args": [
        "snowflake-labs-mcp",
        "--service-config-file", "/Users/you/.mcp/snowflake-tools.yaml",
        "--connection-name", "staging"
      ]
    },
    "snowflake-prod": {
      "command": "uvx",
      "args": [
        "snowflake-labs-mcp",
        "--service-config-file", "/Users/you/.mcp/snowflake-tools.yaml",
        "--connection-name", "prod"
      ]
    }
  }
}
```

### Step 3: Select in Chat

Each server appears separately in Cursor. Select the appropriate one:
- `snowflake-default` for development
- `snowflake-staging` for testing
- `snowflake-prod` for production (use read-only role)

---

## Security: Read-Only Role

For production safety, create a dedicated read-only role.

### Why?

| Layer | Protection |
|-------|------------|
| MCP SQL Permissions | Blocks DROP/INSERT/UPDATE at MCP level |
| Snowflake RBAC | Blocks at database level (defense in depth) |
| Time Travel | Recovery if something slips through |

### Create the Role

Run as `ACCOUNTADMIN`:

```sql
-- Create role
CREATE ROLE IF NOT EXISTS MCP_READONLY;

-- Grant warehouse usage
GRANT USAGE ON WAREHOUSE SANDBOX_WH TO ROLE MCP_READONLY;

-- Grant database/schema access
GRANT USAGE ON DATABASE SANDBOX_DB TO ROLE MCP_READONLY;
GRANT USAGE ON SCHEMA SANDBOX_DB.PUBLIC TO ROLE MCP_READONLY;

-- Grant SELECT on tables/views
GRANT SELECT ON ALL TABLES IN SCHEMA SANDBOX_DB.PUBLIC TO ROLE MCP_READONLY;
GRANT SELECT ON ALL VIEWS IN SCHEMA SANDBOX_DB.PUBLIC TO ROLE MCP_READONLY;

-- Auto-grant on future objects
GRANT SELECT ON FUTURE TABLES IN SCHEMA SANDBOX_DB.PUBLIC TO ROLE MCP_READONLY;
GRANT SELECT ON FUTURE VIEWS IN SCHEMA SANDBOX_DB.PUBLIC TO ROLE MCP_READONLY;

-- Assign to user
GRANT ROLE MCP_READONLY TO USER <YOUR_USERNAME>;
```

### Update Config

```toml
# ~/.snowflake/connections.toml
[default]
role = "MCP_READONLY"
```

---

## PAT Rotation

PATs expire and must be rotated periodically.

### Check Expiration

1. Log in to Snowflake → **My Profile**
2. Scroll to **Programmatic Access Tokens**
3. Check expiration date

### Rotate

1. Generate new PAT in Snowflake UI
2. Update `~/.snowflake/connections.toml`:
   ```toml
   password = "<NEW_PAT>"
   ```
3. Update `~/.snowsql/config`:
   ```ini
   password = <NEW_PAT>
   ```
4. Restart Cursor

**Tip:** Set a calendar reminder 1 week before expiration.

---

## Troubleshooting

### MFA Authentication Error
```
MFA authentication is required, but none of your current MFA methods are supported
```
**Solution:** Use a PAT, not your regular password.

### 404 Not Found
```
404 Not Found: post <account>.snowflakecomputing.com
```
**Solution:** Check account identifier format. Use full identifier (e.g., `xy12345.us-east-1`).

### SSL Error with Underscores
Replace underscores with dashes in account identifier.

### View MCP Logs
1. Open **Output** panel in Cursor
2. Select **Cursor MCP** from dropdown

### Test with MCP Inspector
```bash
npx @modelcontextprotocol/inspector uvx snowflake-labs-mcp \
  --service-config-file ~/.mcp/snowflake-tools.yaml \
  --connection-name default
```

---

## Resources

- [Snowflake MCP Server (GitHub)](https://github.com/Snowflake-Labs/mcp)
- [SnowSQL Documentation](https://docs.snowflake.com/en/user-guide/snowsql)
- [Snowflake Python Connector](https://docs.snowflake.com/en/developer-guide/python-connector/python-connector-connect)
- [MCP Protocol](https://modelcontextprotocol.io/introduction)
- [uv Documentation](https://docs.astral.sh/uv/)

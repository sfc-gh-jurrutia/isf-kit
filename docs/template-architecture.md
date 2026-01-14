# Template Architecture (Maintainer Reference)

This document explains how the template handles portable paths across different users and machines.

## File Flow

```
TEMPLATE (in repo)                    USER'S HOME (after setup)
─────────────────────                 ────────────────────────
.cursor/mcp.json          ──────►     ~/.cursor/mcp.json
(contains __HOME__)                   (__HOME__ replaced with $HOME)

.mcp/snowflake-tools.yaml ──────►     ~/.mcp/snowflake-tools.yaml
(copied as-is)

.snowflake/connections.toml ────►     ~/.snowflake/connections.toml
.template (placeholders)              (user fills in credentials)

.snowsql/config.template  ──────►     ~/.snowsql/config
(placeholders)                        (user fills in credentials)
```

## Path Handling

The template uses a `__HOME__` placeholder in `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "snowflake-default": {
      "command": "uvx",
      "args": [
        "snowflake-labs-mcp",
        "--service-config-file",
        "__HOME__/.mcp/snowflake-tools.yaml",
        "--connection-name",
        "default"
      ]
    }
  }
}
```

The setup script replaces this with the user's actual home path:

```bash
# macOS
sed -i '' "s|__HOME__|$HOME|g" ~/.cursor/mcp.json

# Linux
sed -i "s|__HOME__|$HOME|g" ~/.cursor/mcp.json
```

## Why Not Use `~` or `$HOME` Directly?

- **`~`** — Not all tools expand tilde (Cursor/JSON doesn't)
- **`$HOME`** — JSON doesn't expand environment variables
- **`__HOME__` + sed** — Reliable across all platforms

## MCP Server Connection Chain

```
Cursor starts
    │
    ▼
~/.cursor/mcp.json
    │ "command": "uvx snowflake-labs-mcp --service-config-file ..."
    ▼
~/.mcp/snowflake-tools.yaml
    │ Defines: enabled tools, SQL permissions
    ▼
~/.snowflake/connections.toml [default]
    │ Contains: account, user, PAT, warehouse, database, role
    ▼
Snowflake
```

## Directory Creation

The setup script uses `mkdir -p` which:
- Creates directory if it doesn't exist
- Does nothing (no error) if it already exists
- Safe to run multiple times

## Updating the Template

When modifying template files:

1. **Never hardcode user-specific paths** — Use `__HOME__` placeholder
2. **Test portability** — Copy to a fresh directory and run setup
3. **Keep credentials as placeholders** — `<YOUR_ACCOUNT>`, `<YOUR_PAT>`, etc.

# Snowflake Development Kit

Onboarding kit for Snowflake development tools in Cursor IDE.

## What's Included

| Scope | Component | Description |
|-------|-----------|-------------|
| **Global** | MCP Server | Query Snowflake directly from Cursor chat |
| **Global** | SnowSQL | Command-line interface for Snowflake |
| **Project** | Team Rules | Snowflake development standards (`.cursor/rules/`) |
| **Project** | Cursor Commands | Development workflow helpers (`.cursor/commands/`) |

## Happy Path: New Developer Onboarding

### Step 1: Prerequisites

Before you begin, ensure you have:

- [ ] **Homebrew** installed (macOS)
  ```bash
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  ```
- [ ] **Snowflake account access**
- [ ] **Cursor IDE** installed

### Step 2: Create a Programmatic Access Token (PAT)

1. Log in to Snowflake at `https://app.snowflake.com`
2. Click your **username** (bottom-left) → **My Profile**
3. Scroll to **Programmatic Access Tokens**
4. Click **Generate New Token**
5. Select your role (e.g., `DATA_ANALYST`)
6. **Copy the token** — you'll need it in Step 4

### Step 3: Clone and Open

```bash
git clone <repo-url>
cd isf-kit
```

Open in Cursor IDE.

### Step 4: Run Setup Script

```bash
./scripts/setup-snowflake-mcp.sh
```

The script will:
- Install `uv` (Python package manager)
- Install SnowSQL CLI
- Copy configuration templates to your home directory
- Prompt you to enter your Snowflake credentials (use your PAT!)
- Test the connection

### Step 5: Restart Cursor

Close and reopen Cursor to load the MCP server.

### Step 6: Verify Setup

Open a new chat in Cursor and try:
> "List all databases I have access to"

If you see your Snowflake databases, you're all set! 🎉

---

## What Gets Installed

| File | Location | Purpose |
|------|----------|---------|
| `mcp.json` | `~/.cursor/` | Global MCP server config |
| `connections.toml` | `~/.snowflake/` | MCP credentials |
| `snowflake-tools.yaml` | `~/.mcp/` | MCP tool permissions |
| `config` | `~/.snowsql/` | SnowSQL credentials |

## Environment Switching

| Environment | MCP (Cursor Chat) | SnowSQL |
|-------------|-------------------|---------|
| Development | `snowflake-default` | `snowsql -c default` |
| Staging | `snowflake-staging` | `snowsql -c staging` |
| Production | `snowflake-prod` | `snowsql -c prod` |

## Documentation

See [docs/mcp-snowflake-setup.md](docs/mcp-snowflake-setup.md) for:
- Multi-account configuration
- Creating a read-only role
- Troubleshooting common issues
- PAT rotation

## Cursor Rules (Project-Level)

When you open this project in Cursor, these rules automatically activate:

| Rule | Description |
|------|-------------|
| `snowflake/` | SQL best practices, MCP usage, documentation references |
| `snowflake-cortex/` | Cortex AI RAG pattern enforcement |
| `spcs-backend/` | Snowpark Container Services backend patterns |
| `spcs-frontend/` | Snowpark Container Services frontend patterns |

## Contributing

If you have suggestions or improvements, submit a merge request.

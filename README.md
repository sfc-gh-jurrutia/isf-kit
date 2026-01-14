# Snowflake Development Kit

Onboarding kit for Snowflake development tools in Cursor IDE.

## What's Included

| Scope | Component | Description |
|-------|-----------|-------------|
| **Global** | MCP Server | Query Snowflake directly from Cursor chat |
| **Global** | SnowSQL | Command-line interface for Snowflake |
| **Project** | Team Rules | Snowflake development standards (`.cursor/rules/`) |
| **Project** | Cursor Commands | Onboarding and workflow helpers (`.cursor/commands/`) |

---

## Quick Start

### Prerequisites

- [ ] **Homebrew** (macOS): `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
- [ ] **Snowflake account access**
- [ ] **Programmatic Access Token (PAT)** — [How to create one](#creating-a-pat)

### Setup (5 minutes)

```bash
git clone <repo-url>
cd isf-kit
./scripts/setup-snowflake-mcp.sh
```

The script will:
1. Install `uvx` and SnowSQL
2. Copy config templates to your home directory
3. Prompt you to enter your Snowflake credentials
4. Test the connection

**After setup, restart Cursor.**

### Verify It Works

Run the onboarding command in Cursor:

```
/setup-and-verify-snowflake
```

This checks your config files and tests the Snowflake connection.

**Or** manually test by asking in chat:
> "List all databases I have access to"

If you see your Snowflake databases, you're all set!

---

## Configuration Reference

### Credentials (entered during setup)

| Field | Description | Example |
|-------|-------------|---------|
| `account` | Snowflake account identifier | `xy12345.us-east-1` |
| `user` | Your Snowflake username | `jsmith` |
| `password` | Your PAT token | `ver:1:abc123...` |
| `warehouse` | Compute warehouse | `SANDBOX_WH` |
| `database` | Default database | `SANDBOX_DB` |
| `role` | Your Snowflake role | `DATA_ANALYST` |

### Files Installed

| File | Location | Purpose |
|------|----------|---------|
| `mcp.json` | `~/.cursor/` | MCP server config |
| `snowflake-tools.yaml` | `~/.mcp/` | MCP permissions |
| `connections.toml` | `~/.snowflake/` | MCP credentials |
| `config` | `~/.snowsql/` | SnowSQL credentials |

### Environment Switching

| Environment | MCP (Cursor Chat) | SnowSQL |
|-------------|-------------------|---------|
| Development | `snowflake-default` | `snowsql -c default` |
| Staging | `snowflake-staging` | `snowsql -c staging` |
| Production | `snowflake-prod` | `snowsql -c prod` |

---

## Creating a PAT

1. Log in to Snowflake at `https://app.snowflake.com`
2. Click your **username** (bottom-left) → **My Profile**
3. Scroll to **Programmatic Access Tokens**
4. Click **Generate New Token**
5. Select your role (e.g., `DATA_ANALYST`)
6. **Copy the token** — use this as your password in the setup

---

## Troubleshooting

**MCP not connecting?**
- Check credentials in `~/.snowflake/connections.toml`
- Ensure you're using a PAT, not your regular password
- Restart Cursor after setup

**SnowSQL not found?**
- Run `source ~/.zshrc` or restart terminal
- Verify install: `ls /Applications/SnowSQL.app`

See [docs/mcp-snowflake-setup.md](docs/mcp-snowflake-setup.md) for detailed troubleshooting.

---

## Contributing

If you have suggestions or improvements, submit a merge request.

---

*For template maintainers: See [docs/template-architecture.md](docs/template-architecture.md) for technical details on how the template handles portable paths.*

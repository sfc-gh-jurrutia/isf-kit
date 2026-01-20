# Snowflake Development Kit

Onboarding kit for Snowflake development tools in Cursor IDE.

## TL;DR — Get Started

Open Cursor chat and paste:
```
/setup-and-verify-snowflake
```

The command will:
1. Check & install required tools (uvx, SnowSQL)
2. Run the setup script if config is missing
3. Prompt you for Snowflake credentials
4. Verify the connection

After entering credentials, restart Cursor and run the command again to verify.

---

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
```

Open in Cursor and run this command in chat:

```
/setup-and-verify-snowflake
```

The command will:
1. Check & install required tools (uvx, SnowSQL)
2. Run setup script if config is missing
3. Prompt you for Snowflake credentials
4. Verify the connection

**After entering credentials, restart Cursor and run the command again.**

### Alternative: Manual Setup

If you prefer to run the setup script directly:

```bash
# Preview what will happen (recommended first step)
./scripts/setup-snowflake-mcp.sh --dry-run

# Run the actual setup
./scripts/setup-snowflake-mcp.sh
```

If you see your Snowflake databases, you're all set!

---

## Safety Features

The setup script includes safety features to protect your existing configurations:

### Dry-Run Mode

Preview all changes before execution:

```bash
./scripts/setup-snowflake-mcp.sh --dry-run
```

This shows:
- Files that will be created
- Existing configurations that will be preserved
- Files needing credential configuration
- Exact actions that would be taken

**No changes are made in dry-run mode.**

### Automatic Backup

Before replacing any file, the script:
1. Creates a timestamped backup in `~/.snowflake-backup/`
2. Prompts you to confirm the action
3. Shows existing configuration details

### Interactive Prompts

For each existing config file, you can choose:
- **Skip** — Keep existing file (recommended for working configs)
- **Backup & Replace** — Save current file, use fresh template
- **View** — See current file contents before deciding

### Command-Line Options

| Flag | Purpose |
|------|---------|
| `--dry-run` | Preview changes without modifying anything |
| `--check` | Silent check, exit 0 if configured, exit 1 if not |
| `--force` | Non-interactive mode, skip existing configs |
| `--backup-dir PATH` | Custom backup location (default: `~/.snowflake-backup/`) |
| `--help` | Show usage information |

### Restore from Backup

If something goes wrong:

```bash
# List backups
ls -la ~/.snowflake-backup/

# Restore a specific backup
cp ~/.snowflake-backup/connections.toml.20240115_143022.bak ~/.snowflake/connections.toml
```

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

**Want to see current configuration status?**
```bash
./scripts/setup-snowflake-mcp.sh --dry-run
```

**Need to restore previous configuration?**
```bash
ls ~/.snowflake-backup/  # Find your backup
cp ~/.snowflake-backup/<filename>.bak ~/.snowflake/<filename>
```

See [docs/mcp-snowflake-setup.md](docs/mcp-snowflake-setup.md) for detailed troubleshooting.

---

## Contributing

If you have suggestions or improvements, submit a merge request.

---

*For template maintainers: See [docs/template-architecture.md](docs/template-architecture.md) for technical details on how the template handles portable paths.*

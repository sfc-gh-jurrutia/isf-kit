# Setup and Verify Snowflake (Complete Workflow)

Auto-run onboarding workflow with safety checks. Execute each step sequentially - install missing tools and run setup automatically.

---

## Step 0: Preview Changes (Recommended First Step)

Before making any changes, run a dry-run to see what will happen:

```bash
./scripts/setup-snowflake-mcp.sh --dry-run
```

This shows:
- Files that will be created
- Existing configurations that will be preserved
- Any files needing credential configuration
- Exact actions that would be taken

**No changes are made in dry-run mode.**

---

## Step 1: Check & Install Prerequisites

Check and auto-install required tools:

1. **uvx** (required):
   ```bash
   uvx --version
   ```
   If missing, run:
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   source $HOME/.local/bin/env
   ```

2. **Homebrew** (macOS):
   ```bash
   brew --version
   ```
   If missing, run:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

3. **SnowSQL** (optional):
   ```bash
   if [ -d "/Applications/SnowSQL.app" ]; then
       echo "✅ SnowSQL installed"
   else
       echo "❌ SnowSQL not found"
   fi
   ```
   If missing, run:
   ```bash
   brew install --cask snowflake-snowsql
   ```

**Gate:** uvx must be installed to proceed.

---

## Step 2: Run Setup with Safety Features

The setup script now includes safety features to protect existing configurations.

### Quick Check (Silent)

Check if already configured without output:

```bash
./scripts/setup-snowflake-mcp.sh --check && echo "Already configured" || echo "Setup needed"
```

### Interactive Setup (Default)

Run the setup script interactively:

```bash
./scripts/setup-snowflake-mcp.sh
```

**Safety features enabled:**
- Existing configs are preserved by default
- Before any replacement, you choose: Skip, Backup & Replace, or View
- Backups saved to `~/.snowflake-backup/` with timestamps
- Shows existing connections/servers before prompting

### Non-Interactive Setup

For scripted/CI use:

```bash
./scripts/setup-snowflake-mcp.sh --force
```

This skips all prompts and preserves existing configurations.

### Command-Line Options

| Flag | Purpose |
|------|---------|
| `--dry-run` | Preview changes without modifying anything |
| `--check` | Silent check, exit 0 if configured, exit 1 if not |
| `--force` | Non-interactive mode, skip existing configs |
| `--backup-dir PATH` | Custom backup location (default: ~/.snowflake-backup/) |
| `--help` | Show usage information |

---

## Step 3: Verify Snowflake Connection

**After the script completes:**
1. **Restart Cursor** to load the MCP server
2. Re-run `/setup-and-verify-snowflake` to verify

Test the connection:

```sql
SELECT CURRENT_USER(), CURRENT_ROLE(), CURRENT_WAREHOUSE();
```

```sql
SHOW DATABASES;
```

**Report results:**
- Success: "Onboarding complete! You're connected to Snowflake."
- Failure: Show error and specific fix (check credentials, PAT token, etc.)

---

## Troubleshooting

### Restore from Backup

If something goes wrong, backups are in `~/.snowflake-backup/`:

```bash
ls -la ~/.snowflake-backup/
```

To restore:
```bash
cp ~/.snowflake-backup/connections.toml.20240115_143022.bak ~/.snowflake/connections.toml
```

### View Current Configuration

The setup script can show existing configurations:

```bash
./scripts/setup-snowflake-mcp.sh --dry-run
```

### Reset to Fresh State

To start over with fresh templates:

```bash
# Backup everything first
./scripts/setup-snowflake-mcp.sh --dry-run  # See what exists

# Then run interactively and choose "Backup & Replace" for each file
./scripts/setup-snowflake-mcp.sh
```

---

## Final Summary

```
┌─────────────────────────────────────┐
│  ONBOARDING RESULT                  │
├─────────────────────────────────────┤
│  Step 0 (Dry Run):  ✅ Reviewed     │
│  Step 1 (Tools):    ✅ or ❌        │
│  Step 2 (Config):   ✅ or ❌        │
│  Step 3 (Connect):  ✅ or ❌        │
├─────────────────────────────────────┤
│  Status: COMPLETE / NEEDS ACTION    │
│  Backups: ~/.snowflake-backup/      │
│  Next:   (if any)                   │
└─────────────────────────────────────┘
```

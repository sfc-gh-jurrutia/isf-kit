# Setup and Verify Snowflake (Complete Workflow)

Auto-run onboarding workflow. Execute each step sequentially - install missing tools and run setup automatically.

---

## Step 0: Check & Install Prerequisites

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

## Step 1: Check Config & Run Setup

Check if MCP is configured:

```bash
# Check all required files
[ -f ~/.cursor/mcp.json ] && echo "✅ mcp.json" || echo "❌ mcp.json missing"
[ -f ~/.snowflake/connections.toml ] && echo "✅ connections.toml" || echo "❌ connections.toml missing"
[ -f ~/.mcp/snowflake-tools.yaml ] && echo "✅ snowflake-tools.yaml" || echo "❌ snowflake-tools.yaml missing"
```

**If any files are missing**, run the setup script:

```bash
./scripts/setup-snowflake-mcp.sh
```

This script will:
1. Copy config templates to your home directory
2. Prompt you to enter Snowflake credentials
3. Test the connection

**After the script completes:**
- Tell the user to **restart Cursor**
- Then re-run `/setup-and-verify-snowflake` to continue to Step 2

**If all files exist**, check for issues:

```bash
# Check for unresolved placeholders
grep -q "__HOME__" ~/.cursor/mcp.json && echo "⚠️ __HOME__ placeholder found" || echo "✅ Paths resolved"
grep -q "<YOUR_ACCOUNT>" ~/.snowflake/connections.toml && echo "⚠️ Credentials not configured" || echo "✅ Credentials set"
```

**Gate:** All config files must exist with no placeholders to proceed.

---

## Step 2: Verify Snowflake Connection

Test the connection:

```sql
SELECT CURRENT_USER(), CURRENT_ROLE(), CURRENT_WAREHOUSE();
```

```sql
SHOW DATABASES;
```

**Report results:**
- ✅ Success → "Onboarding complete! You're connected to Snowflake."
- ❌ Failure → Show error and specific fix (check credentials, PAT token, etc.)

---

## Final Summary

```
┌─────────────────────────────────────┐
│  ONBOARDING RESULT                  │
├─────────────────────────────────────┤
│  Step 0 (Tools):   ✅ or ❌          │
│  Step 1 (Config):  ✅ or ❌          │
│  Step 2 (Connect): ✅ or ❌          │
├─────────────────────────────────────┤
│  Status: COMPLETE / NEEDS ACTION    │
│  Next:   (if any)                   │
└─────────────────────────────────────┘
```

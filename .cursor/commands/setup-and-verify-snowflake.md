# Setup and Verify Snowflake (Complete Workflow)

Run this complete onboarding workflow. Execute each step sequentially - **do not skip ahead**.

---

## Step 0: Check Prerequisites

Verify required tools are installed:

1. **Homebrew** (macOS):
   ```bash
   brew --version
   ```
   If missing: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`

2. **uvx** (Python package runner):
   ```bash
   uvx --version
   ```
   If missing: `curl -LsSf https://astral.sh/uv/install.sh | sh` then restart terminal

3. **SnowSQL** (optional but recommended):
   Run this check in terminal:
   ```bash
   if [ -d "/Applications/SnowSQL.app" ]; then
       echo "✅ SnowSQL installed"
       /Applications/SnowSQL.app/Contents/MacOS/snowsql -v 2>/dev/null | head -1
   else
       echo "❌ SnowSQL not found"
   fi
   ```
   If missing: `brew install --cask snowflake-snowsql`

**Gate:** If uvx is missing, tell me to install it and **STOP**. Homebrew and SnowSQL are optional but recommended.

---

## Step 1: Check Config Files

Verify MCP configuration exists:

1. **Check files exist:**
   - `~/.cursor/mcp.json` — has `snowflake-default` server?
   - `~/.snowflake/connections.toml` — exists?
   - `~/.mcp/snowflake-tools.yaml` — exists?

2. **If any missing:** Tell me to run `./scripts/setup-snowflake-mcp.sh` and **STOP**.

3. **Check for issues:**
   - Is `__HOME__` still in mcp.json? (should be actual path)
   - Are there `<YOUR_ACCOUNT>` placeholders in connections.toml?
   - If issues found, tell me how to fix and **STOP**.

**Gate:** Only proceed to Step 2 if all checks pass.

---

## Step 2: Verify Connection

Test Snowflake connectivity:

1. **Run this query:**
   ```sql
   SELECT CURRENT_USER(), CURRENT_ROLE(), CURRENT_WAREHOUSE();
   ```

2. **List databases:**
   ```sql
   SHOW DATABASES;
   ```

3. **Report results:**
   - Success → "Onboarding complete!"
   - Failure → Show error and specific fix

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

# Setup and Verify Snowflake (Complete Workflow)

Run this complete onboarding workflow. Execute each step sequentially - **do not skip ahead**.

---

## Step 1: Onboard (from `onboard-new-developer`)

First, check my setup status:

1. **Verify config files exist:**
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

## Step 2: Verify (from `verify-snowflake-setup`)

Now test the connection:

1. **Run this query:**
   ```sql
   SELECT CURRENT_USER(), CURRENT_ROLE(), CURRENT_WAREHOUSE();
   ```

2. **List databases:**
   ```sql
   SHOW DATABASES;
   ```

3. **Report results:**
   - ✅ Success → "Onboarding complete!"
   - ❌ Failure → Show error and specific fix

---

## Final Summary

```
┌─────────────────────────────────────┐
│  ONBOARDING RESULT                  │
├─────────────────────────────────────┤
│  Step 1 (Config):  ✅ or ❌          │
│  Step 2 (Connect): ✅ or ❌          │
├─────────────────────────────────────┤
│  Status: COMPLETE / NEEDS ACTION    │
│  Next:   (if any)                   │
└─────────────────────────────────────┘
```

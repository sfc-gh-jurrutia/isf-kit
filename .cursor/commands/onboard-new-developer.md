# Snowflake MCP Onboarding

Help me complete my Snowflake development environment setup.

## Check My Setup Status

1. **Verify MCP is configured:**
   - Check if `~/.cursor/mcp.json` exists and has `snowflake-default` server
   - Check if `~/.snowflake/connections.toml` exists
   - Check if `~/.mcp/snowflake-tools.yaml` exists

2. **Test Snowflake connection:**
   - Try listing databases I have access to
   - If it fails, help me troubleshoot

3. **If setup is incomplete:**
   - Guide me to run `./scripts/setup-snowflake-mcp.sh`
   - Explain what credentials I need (account, username, PAT)

## Common Issues to Check

- Am I using a PAT token (not my regular password)?
- Is my account identifier correct (e.g., `xy12345.us-east-1`)?
- Did I restart Cursor after running the setup script?
- Does my role have access to the warehouse/database?

## After Verification

Once connected, show me a quick example query to confirm everything works.

#!/bin/bash
# Snowflake Development Environment Setup Script
# Sets up MCP Server (for Cursor) and SnowSQL (CLI) globally

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "========================================"
echo "  Snowflake Development Environment"
echo "========================================"
echo ""
echo "This script will set up:"
echo "  - Snowflake MCP Server (global - works in any project)"
echo "  - SnowSQL CLI (command-line interface)"
echo "  - Team development standards"
echo ""

# Step 1: Check/Install uv
echo "Step 1: Checking uv installation..."
if command -v uvx &> /dev/null; then
    echo "✅ uvx is already installed: $(uvx --version)"
else
    echo "📦 Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    source "$HOME/.local/bin/env"
    echo "✅ uv installed: $(uvx --version)"
fi
echo ""

# Step 2: Check/Install SnowSQL
echo "Step 2: Checking SnowSQL installation..."
if command -v snowsql &> /dev/null; then
    echo "✅ SnowSQL is already installed: $(snowsql -v 2>/dev/null | head -1)"
else
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "📦 Installing SnowSQL via Homebrew..."
        if command -v brew &> /dev/null; then
            brew install --cask snowflake-snowsql
            # Add alias for zsh
            if [[ "$SHELL" == *"zsh"* ]]; then
                if ! grep -q "alias snowsql=" ~/.zshrc 2>/dev/null; then
                    echo 'alias snowsql=/Applications/SnowSQL.app/Contents/MacOS/snowsql' >> ~/.zshrc
                    echo "✅ Added snowsql alias to ~/.zshrc"
                fi
            fi
        else
            echo "⚠️  Homebrew not found. Install SnowSQL manually:"
            echo "    brew install --cask snowflake-snowsql"
        fi
    else
        echo "⚠️  Please install SnowSQL manually:"
        echo "    https://docs.snowflake.com/en/user-guide/snowsql-install-config"
    fi
fi
echo ""

# Step 3: Create directories
echo "Step 3: Creating configuration directories..."
mkdir -p ~/.snowflake
mkdir -p ~/.mcp
mkdir -p ~/.snowsql
mkdir -p ~/.cursor
echo "✅ Directories created"
echo ""

# Step 4: Copy MCP tools config
echo "Step 4: Setting up MCP tools configuration..."
if [ -f ~/.mcp/snowflake-tools.yaml ]; then
    echo "⚠️  ~/.mcp/snowflake-tools.yaml already exists, skipping..."
else
    cp "$PROJECT_DIR/.mcp/snowflake-tools.yaml" ~/.mcp/snowflake-tools.yaml
    echo "✅ Copied snowflake-tools.yaml to ~/.mcp/"
fi
echo ""

# Step 5: Setup Snowflake connection (for MCP)
echo "Step 5: Setting up MCP connection config..."
if [ -f ~/.snowflake/connections.toml ]; then
    echo "⚠️  ~/.snowflake/connections.toml already exists"
    read -p "   Overwrite? (y/N): " overwrite
    if [ "$overwrite" = "y" ] || [ "$overwrite" = "Y" ]; then
        cp "$PROJECT_DIR/.snowflake/connections.toml.template" ~/.snowflake/connections.toml
        chmod 0600 ~/.snowflake/connections.toml
        echo "✅ Copied connections.toml template"
    fi
else
    cp "$PROJECT_DIR/.snowflake/connections.toml.template" ~/.snowflake/connections.toml
    chmod 0600 ~/.snowflake/connections.toml
    echo "✅ Copied connections.toml template to ~/.snowflake/"
fi
echo ""

# Step 6: Setup SnowSQL config
echo "Step 6: Setting up SnowSQL configuration..."
if [ -f ~/.snowsql/config ]; then
    echo "⚠️  ~/.snowsql/config already exists"
    read -p "   Overwrite? (y/N): " overwrite_snowsql
    if [ "$overwrite_snowsql" = "y" ] || [ "$overwrite_snowsql" = "Y" ]; then
        cp "$PROJECT_DIR/.snowsql/config.template" ~/.snowsql/config
        chmod 700 ~/.snowsql/config
        echo "✅ Copied SnowSQL config template"
    fi
else
    cp "$PROJECT_DIR/.snowsql/config.template" ~/.snowsql/config
    chmod 700 ~/.snowsql/config
    echo "✅ Copied SnowSQL config template to ~/.snowsql/"
fi
echo ""

# Step 7: Setup Global Cursor MCP config (smart merge)
echo "Step 7: Setting up global Cursor MCP configuration..."
if [ ! -f ~/.cursor/mcp.json ]; then
    # No existing config - create fresh
    cp "$PROJECT_DIR/.cursor/mcp.json" ~/.cursor/mcp.json
    echo "✅ Created ~/.cursor/mcp.json"
elif grep -q "snowflake-default" ~/.cursor/mcp.json 2>/dev/null; then
    # Already has Snowflake config - skip
    echo "✅ Snowflake MCP already configured in ~/.cursor/mcp.json"
else
    # Merge Snowflake config into existing
    echo "⚠️  ~/.cursor/mcp.json exists with other MCP servers"
    if command -v jq &> /dev/null; then
        echo "   Merging Snowflake config..."
        jq -s '.[0] * .[1]' ~/.cursor/mcp.json "$PROJECT_DIR/.cursor/mcp.json" > /tmp/mcp_merged.json
        mv /tmp/mcp_merged.json ~/.cursor/mcp.json
        echo "✅ Merged Snowflake config into existing mcp.json"
    else
        echo "   jq not installed - showing config to add manually:"
        echo ""
        cat "$PROJECT_DIR/.cursor/mcp.json"
        echo ""
        echo "   Add the snowflake-default server to your ~/.cursor/mcp.json"
    fi
fi

# Replace __HOME__ placeholder with actual home path
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|__HOME__|$HOME|g" ~/.cursor/mcp.json
else
    sed -i "s|__HOME__|$HOME|g" ~/.cursor/mcp.json
fi
echo "✅ Updated paths in mcp.json"
echo ""

# Step 8: Role selection
echo "Step 8: Configure Snowflake role"
echo "================================="
echo ""
echo "Default role is DATA_ANALYST (read-only SQL permissions)"
echo "This is the safest option for most users."
echo ""
read -p "Use a different role? (Enter role name or press Enter for DATA_ANALYST): " custom_role
if [ -n "$custom_role" ]; then
    echo "Updating role to: $custom_role"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/DATA_ANALYST/$custom_role/g" ~/.snowflake/connections.toml 2>/dev/null || true
        sed -i '' "s/DATA_ANALYST/$custom_role/g" ~/.snowsql/config 2>/dev/null || true
    else
        sed -i "s/DATA_ANALYST/$custom_role/g" ~/.snowflake/connections.toml 2>/dev/null || true
        sed -i "s/DATA_ANALYST/$custom_role/g" ~/.snowsql/config 2>/dev/null || true
    fi
    echo "✅ Role updated to $custom_role"
    echo ""
    echo "⚠️  Note: If you need write access, update SQL permissions in:"
    echo "    ~/.mcp/snowflake-tools.yaml"
else
    echo "✅ Using default role: DATA_ANALYST"
fi
echo ""

# Step 9: Prompt for credentials
echo "Step 9: Configure your Snowflake credentials"
echo "============================================="
echo ""
echo "You need to update BOTH config files with your credentials:"
echo ""
echo "  ~/.snowflake/connections.toml  (for MCP)"
echo "  ~/.snowsql/config              (for SnowSQL)"
echo ""
echo "Required values:"
echo "  - account:  Your Snowflake account identifier"
echo "  - username: Your Snowflake username"
echo "  - password: Your PAT token (NOT your regular password)"
echo ""
echo "To create a PAT:"
echo "  1. Log in to Snowflake"
echo "  2. Click username → My Profile"
echo "  3. Scroll to 'Programmatic Access Tokens'"
echo "  4. Generate a new token with your selected role"
echo ""
read -p "Press Enter to edit MCP config (connections.toml)..."
${EDITOR:-nano} ~/.snowflake/connections.toml
chmod 0600 ~/.snowflake/connections.toml  # Ensure secure permissions after edit

read -p "Press Enter to edit SnowSQL config..."
${EDITOR:-nano} ~/.snowsql/config
chmod 0600 ~/.snowsql/config  # Ensure secure permissions after edit
echo ""

# Step 10: Test MCP connection
echo "Step 10: Testing Snowflake MCP Server..."
echo ""
uvx snowflake-labs-mcp==1.3.5 --service-config-file ~/.mcp/snowflake-tools.yaml --connection-name default 2>&1 &
MCP_PID=$!
sleep 8

if ps -p $MCP_PID > /dev/null 2>&1; then
    echo "✅ Snowflake MCP Server started successfully!"
    kill $MCP_PID 2>/dev/null
else
    echo "❌ MCP Server failed - check credentials in ~/.snowflake/connections.toml"
    echo "   Common issues:"
    echo "   - Using password instead of PAT"
    echo "   - Incorrect account identifier"
    echo "   - MFA required (use PAT instead)"
fi
echo ""

# Step 11: Test SnowSQL connection
echo "Step 11: Testing SnowSQL connection..."
if command -v snowsql &> /dev/null; then
    echo "Running: snowsql -c default -q 'SELECT CURRENT_USER();'"
    if snowsql -c default -q 'SELECT CURRENT_USER();' 2>/dev/null; then
        echo "✅ SnowSQL connection successful!"
    else
        echo "❌ SnowSQL failed - check credentials in ~/.snowsql/config"
    fi
else
    echo "⚠️  SnowSQL not installed, skipping test"
fi
echo ""

# Final summary
echo "========================================"
echo "  Setup Complete!"
echo "========================================"
echo ""
echo "What's installed:"
echo "  ✅ Global MCP config   → ~/.cursor/mcp.json"
echo "  ✅ MCP tools config    → ~/.mcp/snowflake-tools.yaml"
echo "  ✅ MCP credentials     → ~/.snowflake/connections.toml"
echo "  ✅ SnowSQL credentials → ~/.snowsql/config"
echo ""
echo "Usage:"
echo "  MCP:     Works in ANY Cursor project now!"
echo "  SnowSQL: snowsql -c default"
echo ""
echo "Switch environments:"
echo "  MCP:     Select 'snowflake-staging' or 'snowflake-prod' in chat"
echo "  SnowSQL: snowsql -c staging  or  snowsql -c prod"
echo ""
echo "👉 Restart Cursor to load the MCP server."
echo ""

#!/bin/bash
# Snowflake Development Environment Setup Script
# Sets up MCP Server (for Cursor) and SnowSQL (CLI) globally
#
# Usage:
#   ./setup-snowflake-mcp.sh              # Interactive mode (default)
#   ./setup-snowflake-mcp.sh --dry-run    # Preview changes without modifying anything
#   ./setup-snowflake-mcp.sh --check      # Silent check, exit 0 if configured, 1 if not
#   ./setup-snowflake-mcp.sh --force      # Non-interactive, skip existing configs
#   ./setup-snowflake-mcp.sh --backup-dir /path  # Custom backup location

set -e

# =============================================================================
# Configuration
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DEFAULT_BACKUP_DIR="$HOME/.snowflake-backup"

# Files managed by this script
declare -A CONFIG_FILES=(
    ["connections.toml"]="$HOME/.snowflake/connections.toml"
    ["snowflake-tools.yaml"]="$HOME/.mcp/snowflake-tools.yaml"
    ["snowsql-config"]="$HOME/.snowsql/config"
    ["mcp.json"]="$HOME/.cursor/mcp.json"
)

declare -A TEMPLATE_FILES=(
    ["connections.toml"]="$PROJECT_DIR/.snowflake/connections.toml.template"
    ["snowflake-tools.yaml"]="$PROJECT_DIR/.mcp/snowflake-tools.yaml"
    ["snowsql-config"]="$PROJECT_DIR/.snowsql/config.template"
    ["mcp.json"]="$PROJECT_DIR/.cursor/mcp.json"
)

# =============================================================================
# Command-line argument parsing
# =============================================================================
DRY_RUN=false
CHECK_ONLY=false
FORCE_MODE=false
BACKUP_DIR="$DEFAULT_BACKUP_DIR"

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --check)
            CHECK_ONLY=true
            shift
            ;;
        --force)
            FORCE_MODE=true
            shift
            ;;
        --backup-dir)
            BACKUP_DIR="$2"
            shift 2
            ;;
        --help|-h)
            echo "Snowflake Development Environment Setup"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --dry-run         Preview changes without modifying anything"
            echo "  --check           Silent check, exit 0 if configured, exit 1 if not"
            echo "  --force           Non-interactive mode, skip existing configs"
            echo "  --backup-dir PATH Custom backup location (default: ~/.snowflake-backup/)"
            echo "  --help, -h        Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --dry-run              # See what would be changed"
            echo "  $0 --check && echo 'OK'   # Check if already configured"
            echo "  $0 --force                # Automated setup, skip existing"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Run '$0 --help' for usage."
            exit 1
            ;;
    esac
done

# =============================================================================
# Utility Functions
# =============================================================================

# Print colored output
print_header() {
    echo ""
    echo "========================================"
    echo "  $1"
    echo "========================================"
    echo ""
}

print_status() {
    local status="$1"
    local message="$2"
    case "$status" in
        ok)      echo "  [OK]     $message" ;;
        skip)    echo "  [SKIP]   $message" ;;
        create)  echo "  [CREATE] $message" ;;
        update)  echo "  [UPDATE] $message" ;;
        backup)  echo "  [BACKUP] $message" ;;
        warn)    echo "  [WARN]   $message" ;;
        error)   echo "  [ERROR]  $message" ;;
        info)    echo "  [INFO]   $message" ;;
    esac
}

# Create timestamped backup of a file
backup_file() {
    local file="$1"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/$(basename "$file").$timestamp.bak"
    
    mkdir -p "$BACKUP_DIR"
    cp "$file" "$backup_path"
    chmod 0600 "$backup_path"
    echo "$backup_path"
}

# Parse connections.toml and show existing connections
show_existing_connections() {
    local file="$1"
    if [ ! -f "$file" ]; then
        return
    fi
    
    echo "      Existing connections:"
    # Extract connection names (sections in brackets)
    grep '^\[' "$file" 2>/dev/null | sed 's/\[//;s/\]//' | while read -r conn; do
        # Skip comments and empty lines
        [[ -z "$conn" || "$conn" == \#* ]] && continue
        
        # Extract account and role for this connection
        local account=$(awk "/^\[$conn\]/,/^\[/ {if(/^account/) print}" "$file" | head -1 | cut -d'=' -f2 | tr -d ' "' | head -c 30)
        local role=$(awk "/^\[$conn\]/,/^\[/ {if(/^role/) print}" "$file" | head -1 | cut -d'=' -f2 | tr -d ' "')
        
        if [ -n "$account" ]; then
            if [ "$account" = "<YOUR_ACCOUNT_IDENTIFIER>" ]; then
                echo "        - $conn: (not configured - has placeholder)"
            else
                echo "        - $conn: $account (role: ${role:-unknown})"
            fi
        fi
    done
}

# Parse mcp.json and show existing MCP servers
show_existing_mcp_servers() {
    local file="$1"
    if [ ! -f "$file" ]; then
        return
    fi
    
    echo "      Existing MCP servers:"
    if command -v jq &> /dev/null; then
        jq -r '.mcpServers | keys[]' "$file" 2>/dev/null | while read -r server; do
            echo "        - $server"
        done
    else
        # Fallback: grep for server names
        grep -o '"[^"]*":' "$file" 2>/dev/null | grep -v "mcpServers\|command\|args" | tr -d '":' | while read -r server; do
            [ -n "$server" ] && echo "        - $server"
        done
    fi
}

# Check if file has unresolved placeholders
has_placeholders() {
    local file="$1"
    grep -q "<YOUR_" "$file" 2>/dev/null || grep -q "__HOME__" "$file" 2>/dev/null
}

# Check if snowflake-default is already in mcp.json
has_snowflake_mcp() {
    local file="$1"
    grep -q "snowflake-default" "$file" 2>/dev/null
}

# Detect existing configuration status for a file
# Returns: missing, configured, placeholder, or partial
detect_config_status() {
    local file="$1"
    local file_type="$2"
    
    if [ ! -f "$file" ]; then
        echo "missing"
        return
    fi
    
    case "$file_type" in
        connections.toml|snowsql-config)
            if has_placeholders "$file"; then
                echo "placeholder"
            else
                echo "configured"
            fi
            ;;
        mcp.json)
            if has_snowflake_mcp "$file"; then
                echo "configured"
            else
                echo "partial"
            fi
            ;;
        snowflake-tools.yaml)
            echo "configured"
            ;;
        *)
            echo "configured"
            ;;
    esac
}

# =============================================================================
# Analysis Functions
# =============================================================================

# Analyze all configuration files and build a report
analyze_configuration() {
    declare -gA CONFIG_STATUS
    declare -gA CONFIG_ACTION
    
    for key in "${!CONFIG_FILES[@]}"; do
        local file="${CONFIG_FILES[$key]}"
        local status=$(detect_config_status "$file" "$key")
        CONFIG_STATUS[$key]="$status"
        
        # Determine default action based on status
        case "$status" in
            missing)
                CONFIG_ACTION[$key]="create"
                ;;
            configured)
                CONFIG_ACTION[$key]="skip"
                ;;
            placeholder)
                CONFIG_ACTION[$key]="skip"  # Keep but note needs config
                ;;
            partial)
                CONFIG_ACTION[$key]="merge"
                ;;
        esac
    done
}

# =============================================================================
# Dry Run Mode
# =============================================================================

run_dry_run() {
    print_header "SNOWFLAKE SETUP - DRY RUN"
    echo "No changes will be made. This is a preview of what would happen."
    echo ""
    
    analyze_configuration
    
    local has_missing=false
    local has_existing=false
    local has_needs_config=false
    
    # Section: Files to be created
    echo "FILES TO BE CREATED:"
    for key in "${!CONFIG_FILES[@]}"; do
        if [ "${CONFIG_STATUS[$key]}" = "missing" ]; then
            has_missing=true
            print_status "create" "${CONFIG_FILES[$key]}"
            echo "           Source: ${TEMPLATE_FILES[$key]}"
        fi
    done
    if [ "$has_missing" = false ]; then
        echo "  (none)"
    fi
    echo ""
    
    # Section: Files that already exist
    echo "FILES THAT ALREADY EXIST (will be preserved):"
    for key in "${!CONFIG_FILES[@]}"; do
        local status="${CONFIG_STATUS[$key]}"
        if [ "$status" = "configured" ] || [ "$status" = "placeholder" ]; then
            has_existing=true
            print_status "skip" "${CONFIG_FILES[$key]}"
            
            case "$key" in
                connections.toml)
                    show_existing_connections "${CONFIG_FILES[$key]}"
                    ;;
                mcp.json)
                    show_existing_mcp_servers "${CONFIG_FILES[$key]}"
                    ;;
            esac
        fi
    done
    if [ "$has_existing" = false ]; then
        echo "  (none)"
    fi
    echo ""
    
    # Section: Files needing merge
    echo "FILES REQUIRING MERGE:"
    local has_merge=false
    for key in "${!CONFIG_FILES[@]}"; do
        if [ "${CONFIG_STATUS[$key]}" = "partial" ]; then
            has_merge=true
            print_status "update" "${CONFIG_FILES[$key]}"
            echo "           Action: Add snowflake-default server"
            show_existing_mcp_servers "${CONFIG_FILES[$key]}"
        fi
    done
    if [ "$has_merge" = false ]; then
        echo "  (none)"
    fi
    echo ""
    
    # Section: Files needing credential configuration
    echo "FILES REQUIRING CREDENTIALS:"
    for key in "${!CONFIG_FILES[@]}"; do
        local file="${CONFIG_FILES[$key]}"
        if [ -f "$file" ] && has_placeholders "$file"; then
            has_needs_config=true
            print_status "warn" "$file"
            echo "           Status: Has placeholders (<YOUR_ACCOUNT>, etc.)"
        fi
    done
    if [ "$has_needs_config" = false ]; then
        echo "  (none - all configured or will be created fresh)"
    fi
    echo ""
    
    # Section: Summary of actions
    echo "ACTIONS THAT WOULD BE TAKEN:"
    local action_num=1
    
    # Directory creation
    for dir in ~/.snowflake ~/.mcp ~/.snowsql ~/.cursor; do
        if [ ! -d "$dir" ]; then
            echo "  $action_num. Create directory: $dir"
            ((action_num++))
        fi
    done
    
    # File operations
    for key in "${!CONFIG_FILES[@]}"; do
        local action="${CONFIG_ACTION[$key]}"
        local file="${CONFIG_FILES[$key]}"
        case "$action" in
            create)
                echo "  $action_num. Create $file from template"
                ((action_num++))
                ;;
            merge)
                echo "  $action_num. Merge snowflake-default into $file"
                ((action_num++))
                ;;
        esac
    done
    
    if [ $action_num -eq 1 ]; then
        echo "  No changes needed - environment is already configured!"
    fi
    echo ""
    
    echo "========================================"
    echo "Run without --dry-run to execute these changes."
    echo "========================================"
}

# =============================================================================
# Check Mode
# =============================================================================

run_check_mode() {
    analyze_configuration
    
    local all_configured=true
    
    for key in "${!CONFIG_FILES[@]}"; do
        local status="${CONFIG_STATUS[$key]}"
        if [ "$status" = "missing" ]; then
            all_configured=false
            break
        fi
    done
    
    # Also check if credentials are configured
    if [ -f "${CONFIG_FILES[connections.toml]}" ]; then
        if has_placeholders "${CONFIG_FILES[connections.toml]}"; then
            all_configured=false
        fi
    fi
    
    if [ "$all_configured" = true ]; then
        exit 0
    else
        exit 1
    fi
}

# =============================================================================
# Interactive File Handling
# =============================================================================

# Handle a single config file with safety prompts
handle_config_file() {
    local key="$1"
    local file="${CONFIG_FILES[$key]}"
    local template="${TEMPLATE_FILES[$key]}"
    local status="${CONFIG_STATUS[$key]}"
    local dir=$(dirname "$file")
    
    echo ""
    echo "[$key] $file"
    echo "─────────────────────────────────────────────"
    
    # Ensure directory exists
    if [ ! -d "$dir" ]; then
        if [ "$DRY_RUN" = false ]; then
            mkdir -p "$dir"
        fi
        echo "  Created directory: $dir"
    fi
    
    case "$status" in
        missing)
            echo "  Status: MISSING"
            echo "  Action: Will create from template"
            if [ "$DRY_RUN" = false ]; then
                cp "$template" "$file"
                chmod 0600 "$file"
                echo "  ✅ Created $file"
            fi
            return 0  # Needs credential configuration
            ;;
            
        configured)
            echo "  Status: EXISTS and CONFIGURED"
            case "$key" in
                connections.toml)
                    show_existing_connections "$file"
                    ;;
                mcp.json)
                    show_existing_mcp_servers "$file"
                    ;;
            esac
            echo ""
            echo "  ✅ No changes needed (keeping existing configuration)"
            return 1  # Already configured, no action needed
            ;;
            
        placeholder)
            echo "  Status: EXISTS but HAS PLACEHOLDERS"
            case "$key" in
                connections.toml)
                    show_existing_connections "$file"
                    ;;
            esac
            echo ""
            
            if [ "$FORCE_MODE" = true ]; then
                echo "  ✅ Keeping existing file (--force mode)"
                return 0  # Needs credential configuration
            fi
            
            echo "  What would you like to do?"
            echo "    [S] Skip - keep existing file (recommended)"
            echo "    [B] Backup & Replace - save current, use fresh template"
            echo "    [V] View - show current file contents"
            echo ""
            
            while true; do
                read -p "  Choice [S]: " choice
                choice=${choice:-S}
                
                case "${choice^^}" in
                    S)
                        echo "  ✅ Keeping existing file"
                        return 0  # Still needs credential check
                        ;;
                    B)
                        local backup_path=$(backup_file "$file")
                        echo "  📁 Backed up to: $backup_path"
                        cp "$template" "$file"
                        chmod 0600 "$file"
                        echo "  ✅ Replaced with fresh template"
                        return 0  # Needs credential configuration
                        ;;
                    V)
                        echo ""
                        echo "  ─── Current file contents ───"
                        head -50 "$file" | sed 's/^/  │ /'
                        echo "  ─────────────────────────────"
                        echo ""
                        ;;
                    *)
                        echo "  Invalid choice. Please enter S, B, or V."
                        ;;
                esac
            done
            ;;
            
        partial)
            # Special handling for mcp.json merge
            echo "  Status: EXISTS but missing snowflake-default"
            show_existing_mcp_servers "$file"
            echo ""
            
            if [ "$FORCE_MODE" = true ]; then
                echo "  Merging snowflake-default configuration..."
            else
                echo "  The snowflake-default MCP server will be added."
                read -p "  Continue? [Y/n]: " confirm
                confirm=${confirm:-Y}
                if [[ "${confirm^^}" != "Y" ]]; then
                    echo "  ⏭️  Skipped"
                    return 1
                fi
            fi
            
            if [ "$DRY_RUN" = false ]; then
                # Backup first
                local backup_path=$(backup_file "$file")
                echo "  📁 Backed up to: $backup_path"
                
                # Merge using jq if available
                if command -v jq &> /dev/null; then
                    jq -s '.[0] * .[1]' "$file" "$template" > /tmp/mcp_merged.json
                    mv /tmp/mcp_merged.json "$file"
                    echo "  ✅ Merged snowflake-default into mcp.json"
                else
                    echo "  ⚠️  jq not installed. Please add manually:"
                    echo ""
                    cat "$template"
                    echo ""
                fi
            fi
            return 1
            ;;
    esac
}

# =============================================================================
# Tool Installation
# =============================================================================

install_prerequisites() {
    echo "Checking prerequisites..."
    echo ""
    
    # Check/Install uv
    echo "  [1/2] uvx (required for MCP server)"
    if command -v uvx &> /dev/null; then
        echo "        ✅ Installed: $(uvx --version 2>/dev/null || echo 'available')"
    else
        if [ "$DRY_RUN" = true ]; then
            print_status "create" "Would install uv via: curl -LsSf https://astral.sh/uv/install.sh | sh"
        else
            echo "        📦 Installing uv..."
            curl -LsSf https://astral.sh/uv/install.sh | sh
            source "$HOME/.local/bin/env" 2>/dev/null || true
            echo "        ✅ Installed uv"
        fi
    fi
    
    # Check/Install SnowSQL
    echo "  [2/2] SnowSQL (optional CLI)"
    if command -v snowsql &> /dev/null || [ -d "/Applications/SnowSQL.app" ]; then
        echo "        ✅ Installed"
    else
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if [ "$DRY_RUN" = true ]; then
                print_status "info" "Would install SnowSQL via: brew install --cask snowflake-snowsql"
            elif [ "$FORCE_MODE" = false ]; then
                read -p "        Install SnowSQL via Homebrew? [Y/n]: " install_snowsql
                install_snowsql=${install_snowsql:-Y}
                if [[ "${install_snowsql^^}" == "Y" ]] && command -v brew &> /dev/null; then
                    brew install --cask snowflake-snowsql
                    # Add alias for zsh
                    if [[ "$SHELL" == *"zsh"* ]]; then
                        if ! grep -q "alias snowsql=" ~/.zshrc 2>/dev/null; then
                            echo 'alias snowsql=/Applications/SnowSQL.app/Contents/MacOS/snowsql' >> ~/.zshrc
                        fi
                    fi
                    echo "        ✅ Installed SnowSQL"
                fi
            fi
        else
            echo "        ⚠️  Not installed. See: https://docs.snowflake.com/en/user-guide/snowsql-install-config"
        fi
    fi
    echo ""
}

# =============================================================================
# Credential Configuration
# =============================================================================

configure_credentials() {
    local needs_config="$1"
    
    if [ "$needs_config" = false ]; then
        return
    fi
    
    print_header "Configure Credentials"
    
    echo "Your configuration files need Snowflake credentials."
    echo ""
    echo "Required values:"
    echo "  - account:  Your Snowflake account identifier (e.g., xy12345.us-east-1)"
    echo "  - user:     Your Snowflake username"
    echo "  - password: Your PAT token (NOT your regular password)"
    echo ""
    echo "To create a PAT:"
    echo "  1. Log in to Snowflake"
    echo "  2. Click username → My Profile"
    echo "  3. Scroll to 'Programmatic Access Tokens'"
    echo "  4. Generate a new token"
    echo ""
    
    if [ "$FORCE_MODE" = true ]; then
        echo "Running in --force mode. Edit these files manually:"
        echo "  - ~/.snowflake/connections.toml"
        echo "  - ~/.snowsql/config"
        return
    fi
    
    # Edit connections.toml if it has placeholders
    if [ -f ~/.snowflake/connections.toml ] && has_placeholders ~/.snowflake/connections.toml; then
        read -p "Press Enter to edit MCP credentials (~/.snowflake/connections.toml)..."
        ${EDITOR:-nano} ~/.snowflake/connections.toml
        chmod 0600 ~/.snowflake/connections.toml
    fi
    
    # Edit snowsql config if it has placeholders
    if [ -f ~/.snowsql/config ] && has_placeholders ~/.snowsql/config; then
        read -p "Press Enter to edit SnowSQL credentials (~/.snowsql/config)..."
        ${EDITOR:-nano} ~/.snowsql/config
        chmod 0600 ~/.snowsql/config
    fi
}

# =============================================================================
# Post-setup: Replace placeholders and test
# =============================================================================

finalize_setup() {
    # Replace __HOME__ placeholder in mcp.json
    if [ -f ~/.cursor/mcp.json ]; then
        if grep -q "__HOME__" ~/.cursor/mcp.json 2>/dev/null; then
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s|__HOME__|$HOME|g" ~/.cursor/mcp.json
            else
                sed -i "s|__HOME__|$HOME|g" ~/.cursor/mcp.json
            fi
            echo "  ✅ Updated paths in mcp.json"
        fi
    fi
}

test_connections() {
    print_header "Testing Connections"
    
    # Test MCP Server
    echo "Testing Snowflake MCP Server..."
    if command -v uvx &> /dev/null && [ -f ~/.mcp/snowflake-tools.yaml ] && [ -f ~/.snowflake/connections.toml ]; then
        if ! has_placeholders ~/.snowflake/connections.toml; then
            uvx snowflake-labs-mcp --service-config-file ~/.mcp/snowflake-tools.yaml --connection-name default 2>&1 &
            MCP_PID=$!
            sleep 5
            
            if ps -p $MCP_PID > /dev/null 2>&1; then
                echo "  ✅ MCP Server started successfully"
                kill $MCP_PID 2>/dev/null
            else
                echo "  ❌ MCP Server failed to start"
                echo "     Check credentials in ~/.snowflake/connections.toml"
            fi
        else
            echo "  ⏭️  Skipped - credentials not configured"
        fi
    else
        echo "  ⏭️  Skipped - missing dependencies"
    fi
    echo ""
    
    # Test SnowSQL
    echo "Testing SnowSQL..."
    if command -v snowsql &> /dev/null || [ -x "/Applications/SnowSQL.app/Contents/MacOS/snowsql" ]; then
        if [ -f ~/.snowsql/config ] && ! has_placeholders ~/.snowsql/config; then
            local snowsql_cmd="snowsql"
            [ -x "/Applications/SnowSQL.app/Contents/MacOS/snowsql" ] && snowsql_cmd="/Applications/SnowSQL.app/Contents/MacOS/snowsql"
            
            if $snowsql_cmd -c default -q 'SELECT CURRENT_USER();' 2>/dev/null; then
                echo "  ✅ SnowSQL connection successful"
            else
                echo "  ❌ SnowSQL connection failed"
                echo "     Check credentials in ~/.snowsql/config"
            fi
        else
            echo "  ⏭️  Skipped - credentials not configured"
        fi
    else
        echo "  ⏭️  Skipped - SnowSQL not installed"
    fi
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    # Handle special modes
    if [ "$DRY_RUN" = true ]; then
        run_dry_run
        exit 0
    fi
    
    if [ "$CHECK_ONLY" = true ]; then
        run_check_mode
        # exit code set by run_check_mode
    fi
    
    # Interactive/Force mode
    print_header "Snowflake Development Environment"
    
    if [ "$FORCE_MODE" = true ]; then
        echo "Running in non-interactive mode (--force)"
        echo "Existing configurations will be preserved."
    else
        echo "This script will set up:"
        echo "  - Snowflake MCP Server (for Cursor IDE)"
        echo "  - SnowSQL CLI (command-line interface)"
        echo ""
        echo "Safety features:"
        echo "  - Existing configs are preserved by default"
        echo "  - Backups created before any replacements"
        echo "  - Backup location: $BACKUP_DIR"
        echo ""
        echo "Tip: Run with --dry-run first to preview changes."
    fi
    echo ""
    
    # Install prerequisites
    install_prerequisites
    
    # Analyze current state
    analyze_configuration
    
    # Handle each config file
    print_header "Configuration Files"
    
    local needs_credentials=false
    local file_num=1
    local total_files=${#CONFIG_FILES[@]}
    
    for key in connections.toml snowflake-tools.yaml snowsql-config mcp.json; do
        echo ""
        echo "[$file_num/$total_files] Processing: $key"
        
        if handle_config_file "$key"; then
            needs_credentials=true
        fi
        
        ((file_num++))
    done
    
    # Finalize (replace __HOME__ placeholders, etc.)
    echo ""
    echo "Finalizing setup..."
    finalize_setup
    
    # Configure credentials if needed
    if [ "$needs_credentials" = true ]; then
        configure_credentials true
    fi
    
    # Test connections (skip in force mode to avoid hanging)
    if [ "$FORCE_MODE" = false ]; then
        read -p "Test connections now? [Y/n]: " test_now
        test_now=${test_now:-Y}
        if [[ "${test_now^^}" == "Y" ]]; then
            test_connections
        fi
    fi
    
    # Final summary
    print_header "Setup Complete!"
    
    echo "Configuration files:"
    echo "  ~/.cursor/mcp.json           - MCP server config"
    echo "  ~/.mcp/snowflake-tools.yaml  - MCP permissions"
    echo "  ~/.snowflake/connections.toml - MCP credentials"
    echo "  ~/.snowsql/config            - SnowSQL credentials"
    echo ""
    echo "Backups (if any): $BACKUP_DIR"
    echo ""
    echo "Usage:"
    echo "  MCP:     Works in any Cursor project after restart"
    echo "  SnowSQL: snowsql -c default"
    echo ""
    echo "Next steps:"
    echo "  1. Restart Cursor to load the MCP server"
    echo "  2. Open chat and verify with: SHOW DATABASES;"
    echo ""
}

# Run main
main

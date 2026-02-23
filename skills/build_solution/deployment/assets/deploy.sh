#!/bin/bash
###############################################################################
# deploy.sh - Deploy PROJECT_NAME to Snowflake
###############################################################################

set -e
set -o pipefail

# Configuration
CONNECTION_NAME="demo"
ENV_PREFIX=""
ONLY_COMPONENT=""
PROJECT_PREFIX="MY_PROJECT"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

error_exit() { echo -e "${RED}[ERROR] $1${NC}" >&2; exit 1; }

usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
  -c, --connection NAME    Snowflake CLI connection (default: demo)
  -p, --prefix PREFIX      Environment prefix (DEV, PROD)
  --only-sql               Deploy only SQL
  --only-streamlit         Deploy only Streamlit
  -h, --help               Show this help
EOF
    exit 0
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help) usage ;;
        -c|--connection) CONNECTION_NAME="$2"; shift 2 ;;
        -p|--prefix) ENV_PREFIX="$2"; shift 2 ;;
        --only-sql) ONLY_COMPONENT="sql"; shift ;;
        --only-streamlit) ONLY_COMPONENT="streamlit"; shift ;;
        *) error_exit "Unknown option: $1" ;;
    esac
done

SNOW_CONN="-c $CONNECTION_NAME"

# Compute resource names
if [ -n "$ENV_PREFIX" ]; then
    FULL_PREFIX="${ENV_PREFIX}_${PROJECT_PREFIX}"
else
    FULL_PREFIX="${PROJECT_PREFIX}"
fi

DATABASE="${FULL_PREFIX}"
SCHEMA="${PROJECT_PREFIX}"
ROLE="${FULL_PREFIX}_ROLE"
WAREHOUSE="${FULL_PREFIX}_WH"

should_run_step() {
    local step="$1"
    [ -z "$ONLY_COMPONENT" ] && return 0
    [[ "$step" == "$ONLY_COMPONENT" ]]
}

echo "=================================================="
echo "PROJECT_NAME - Deployment"
echo "=================================================="
echo "Database: $DATABASE"
echo ""

# Step 1: Prerequisites
echo "Step 1: Checking prerequisites..."
command -v snow &> /dev/null || error_exit "snow CLI not found"
snow sql $SNOW_CONN -q "SELECT 1" &> /dev/null || error_exit "Connection failed"
echo -e "${GREEN}[OK]${NC} Prerequisites verified"

# Step 2: SQL Setup
if should_run_step "sql"; then
    echo "Step 2: Running SQL setup..."
    # Add SQL execution here
fi

# Step 3: Streamlit
if should_run_step "streamlit"; then
    echo "Step 3: Deploying Streamlit..."
    cd streamlit
    snow streamlit deploy $SNOW_CONN --database $DATABASE --schema $SCHEMA --role $ROLE --replace
    cd ..
fi

echo ""
echo -e "${GREEN}Deployment Complete!${NC}"


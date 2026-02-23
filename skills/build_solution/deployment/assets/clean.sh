#!/bin/bash
###############################################################################
# clean.sh - Remove all PROJECT_NAME resources
###############################################################################

set -e
set -o pipefail

CONNECTION_NAME="demo"
ENV_PREFIX=""
FORCE=false
PROJECT_PREFIX="MY_PROJECT"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

error_exit() { echo -e "${RED}[ERROR] $1${NC}" >&2; exit 1; }

while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--connection) CONNECTION_NAME="$2"; shift 2 ;;
        -p|--prefix) ENV_PREFIX="$2"; shift 2 ;;
        --force|--yes|-y) FORCE=true; shift ;;
        *) error_exit "Unknown option: $1" ;;
    esac
done

SNOW_CONN="-c $CONNECTION_NAME"

if [ -n "$ENV_PREFIX" ]; then
    FULL_PREFIX="${ENV_PREFIX}_${PROJECT_PREFIX}"
else
    FULL_PREFIX="${PROJECT_PREFIX}"
fi

DATABASE="${FULL_PREFIX}"
ROLE="${FULL_PREFIX}_ROLE"
WAREHOUSE="${FULL_PREFIX}_WH"

echo -e "${YELLOW}WARNING: This will delete all resources!${NC}"
echo "  Database: $DATABASE"
echo "  Role: $ROLE"

if [ "$FORCE" = false ]; then
    read -p "Continue? (yes/no): " CONFIRM
    [ "$CONFIRM" != "yes" ] && { echo "Cancelled."; exit 0; }
fi

# Delete in correct order
echo "Dropping warehouse..."
snow sql $SNOW_CONN -q "DROP WAREHOUSE IF EXISTS ${WAREHOUSE};" 2>/dev/null || true

echo "Dropping database..."
snow sql $SNOW_CONN -q "DROP DATABASE IF EXISTS ${DATABASE};" 2>/dev/null || true

echo "Dropping role..."
snow sql $SNOW_CONN -q "DROP ROLE IF EXISTS ${ROLE};" 2>/dev/null || true

echo -e "${GREEN}Cleanup Complete!${NC}"


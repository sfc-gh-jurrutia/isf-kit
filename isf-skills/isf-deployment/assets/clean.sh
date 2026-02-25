#!/bin/bash
###############################################################################
# clean.sh - Remove all ISF solution resources from Snowflake
#
# Deletion order is critical:
#   1. SPCS Services
#   2. Compute Pools
#   3. Image Repositories
#   4. Cortex Objects (agents, search services)
#   5. Warehouse
#   6. Database (cascades schemas, tables, views)
#   7. Role (last)
###############################################################################

set -e
set -o pipefail

CONNECTION_NAME="${SNOWFLAKE_CONNECTION_NAME:-demo}"
FORCE=false
PROJECT_PREFIX="MY_PROJECT"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

[ -f .env ] && export $(grep -v '^#' .env | xargs)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

error_exit() { echo -e "${RED}[ERROR] $1${NC}" >&2; exit 1; }

while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--connection) CONNECTION_NAME="$2"; shift 2 ;;
        --force|--yes|-y) FORCE=true; shift ;;
        -h|--help)
            echo "Usage: $0 [--force] [-c CONNECTION]"
            echo "  --force, -y    Skip confirmation"
            exit 0 ;;
        *) error_exit "Unknown option: $1" ;;
    esac
done

SNOW="-c $CONNECTION_NAME"
DATABASE="${PROJECT_PREFIX}"
ROLE="${PROJECT_PREFIX}_ROLE"
WAREHOUSE="${PROJECT_PREFIX}_WH"
SERVICE="${PROJECT_PREFIX}_SERVICE"
POOL="${PROJECT_PREFIX}_POOL"
REPO="${PROJECT_PREFIX}_REPO"

echo -e "${YELLOW}[WARN] This will delete ALL resources for ${PROJECT_PREFIX}${NC}"
echo ""
echo "  Service:        ${SERVICE}"
echo "  Compute Pool:   ${POOL}"
echo "  Image Repo:     ${REPO}"
echo "  Warehouse:      ${WAREHOUSE}"
echo "  Database:        ${DATABASE} (all schemas, tables, views)"
echo "  Role:           ${ROLE}"
echo ""

if [ "$FORCE" = false ]; then
    read -p "Type '${PROJECT_PREFIX}' to confirm deletion: " CONFIRM
    [ "$CONFIRM" != "${PROJECT_PREFIX}" ] && { echo "Cancelled."; exit 0; }
fi

echo ""

# 1. SPCS Services
echo "Dropping SPCS service..."
snow sql $SNOW -q "DROP SERVICE IF EXISTS ${DATABASE}.PUBLIC.${SERVICE};" 2>/dev/null || true

# 2. Compute Pools
echo "Dropping compute pool..."
snow sql $SNOW -q "ALTER COMPUTE POOL IF EXISTS ${DATABASE}.PUBLIC.${POOL} STOP ALL;" 2>/dev/null || true
snow sql $SNOW -q "DROP COMPUTE POOL IF EXISTS ${DATABASE}.PUBLIC.${POOL};" 2>/dev/null || true

# 3. Image Repositories
echo "Dropping image repository..."
snow sql $SNOW -q "DROP IMAGE REPOSITORY IF EXISTS ${DATABASE}.PUBLIC.${REPO};" 2>/dev/null || true

# 4. Cortex Objects
echo "Dropping Cortex objects..."
snow sql $SNOW -q "DROP AGENT IF EXISTS ${DATABASE}.PUBLIC.${PROJECT_PREFIX}_AGENT;" 2>/dev/null || true
snow sql $SNOW -q "DROP CORTEX SEARCH SERVICE IF EXISTS ${DATABASE}.PUBLIC.${PROJECT_PREFIX}_SEARCH;" 2>/dev/null || true

# 5. Warehouse
echo "Dropping warehouse..."
snow sql $SNOW -q "DROP WAREHOUSE IF EXISTS ${WAREHOUSE};" 2>/dev/null || true

# 6. Database (cascades everything)
echo "Dropping database..."
snow sql $SNOW -q "DROP DATABASE IF EXISTS ${DATABASE};" 2>/dev/null || true

# 7. Role (last)
echo "Dropping role..."
snow sql $SNOW -q "DROP ROLE IF EXISTS ${ROLE};" 2>/dev/null || true

echo ""
echo -e "${GREEN}[OK] Cleanup complete. All ${PROJECT_PREFIX} resources removed.${NC}"

#!/bin/bash
###############################################################################
# deploy.sh - Deploy ISF solution to Snowflake
#
# Stages: setup -> migrate -> data -> app (SPCS)
# Usage: ./deploy.sh or make deploy
###############################################################################

set -e
set -o pipefail

# Configuration (override via .env or CLI flags)
CONNECTION_NAME="${SNOWFLAKE_CONNECTION_NAME:-demo}"
PROJECT_PREFIX="MY_PROJECT"
ONLY_STAGE=""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Load .env if present
[ -f .env ] && export $(grep -v '^#' .env | xargs)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

error_exit() { echo -e "${RED}[ERROR] $1${NC}" >&2; exit 1; }

usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Stages (run all by default):
  --only-db          Setup + migrations only
  --only-data        Load seed data only
  --only-app         Build and deploy SPCS only

Options:
  -c, --connection NAME    Snowflake CLI connection (default: demo)
  -h, --help               Show this help
EOF
    exit 0
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help) usage ;;
        -c|--connection) CONNECTION_NAME="$2"; shift 2 ;;
        --only-db) ONLY_STAGE="db"; shift ;;
        --only-data) ONLY_STAGE="data"; shift ;;
        --only-app) ONLY_STAGE="app"; shift ;;
        *) error_exit "Unknown option: $1" ;;
    esac
done

SNOW="-c $CONNECTION_NAME"
DATABASE="${PROJECT_PREFIX}"
ROLE="${PROJECT_PREFIX}_ROLE"
WAREHOUSE="${PROJECT_PREFIX}_WH"

should_run() {
    [ -z "$ONLY_STAGE" ] && return 0
    [[ "$1" == "$ONLY_STAGE" ]]
}

echo "=================================================="
echo "${PROJECT_PREFIX} - ISF Solution Deployment"
echo "=================================================="
echo "Connection: $CONNECTION_NAME"
echo "Database:   $DATABASE"
echo ""

# Prerequisites
echo "Checking prerequisites..."
command -v snow &> /dev/null || error_exit "snow CLI not found. Install: pip install snowflake-cli"
snow sql $SNOW -q "SELECT 1" &> /dev/null || error_exit "Snowflake connection failed"
echo -e "${GREEN}[OK]${NC} Prerequisites verified"
echo ""

# Stage 1: Setup + Migrations
if should_run "db"; then
    echo "Stage 1: Infrastructure setup..."
    if [ -f deploy/setup.sql ]; then
        snow sql $SNOW -f deploy/setup.sql
        echo -e "${GREEN}[OK]${NC} Infrastructure created"
    else
        echo -e "${YELLOW}[WARN]${NC} deploy/setup.sql not found, skipping"
    fi

    echo "Stage 2: Running migrations..."
    if [ -d src/database/migrations ] && ls src/database/migrations/V*.sql 1>/dev/null 2>&1; then
        for migration in src/database/migrations/V*.sql; do
            echo "  Running $(basename $migration)..."
            snow sql $SNOW -f "$migration"
        done
        echo -e "${GREEN}[OK]${NC} Migrations complete"
    else
        echo -e "${YELLOW}[WARN]${NC} No migration files found"
    fi
    echo ""
fi

# Stage 2: Load Seed Data
if should_run "data"; then
    echo "Stage 3: Loading seed data..."
    if [ -d src/data_engine/output ] && ls src/data_engine/output/*.csv 1>/dev/null 2>&1; then
        snow sql $SNOW -q "CREATE STAGE IF NOT EXISTS ${DATABASE}.RAW.SEED_DATA;"

        for csv in src/data_engine/output/*.csv; do
            TABLE_NAME=$(basename "$csv" .csv | tr '[:lower:]' '[:upper:]')
            echo "  Loading ${TABLE_NAME}..."
            snow stage copy "$csv" "@${DATABASE}.RAW.SEED_DATA/" $SNOW
        done

        if [ -f src/data_engine/loaders/load_seeds.sql ]; then
            snow sql $SNOW -f src/data_engine/loaders/load_seeds.sql
        fi

        echo -e "${GREEN}[OK]${NC} Seed data loaded"
    else
        echo -e "${YELLOW}[WARN]${NC} No seed data found in src/data_engine/output/"
    fi
    echo ""
fi

# Stage 3: Deploy SPCS App
if should_run "app"; then
    echo "Stage 4: Deploying to SPCS..."
    if [ -f deploy/spcs/Dockerfile ]; then
        REPO="${DATABASE}_REPO"
        IMAGE="${PROJECT_PREFIX}_APP"
        POOL="${PROJECT_PREFIX}_POOL"
        SERVICE="${PROJECT_PREFIX}_SERVICE"

        echo "  Creating image repository..."
        snow sql $SNOW -q "CREATE IMAGE REPOSITORY IF NOT EXISTS ${DATABASE}.PUBLIC.${REPO};"

        REGISTRY=$(snow spcs image-repository url "${DATABASE}.PUBLIC.${REPO}" $SNOW 2>/dev/null | tail -1)
        echo "  Registry: ${REGISTRY}"

        echo "  Building Docker image..."
        docker build -t "${REGISTRY}/${IMAGE}:latest" -f deploy/spcs/Dockerfile .

        echo "  Pushing image..."
        docker push "${REGISTRY}/${IMAGE}:latest"

        echo "  Creating compute pool..."
        snow spcs compute-pool create "${DATABASE}.PUBLIC.${POOL}" \
            --min-nodes 1 --max-nodes 1 \
            --instance-family CPU_X64_XS \
            --auto-suspend-secs 300 \
            --if-not-exists $SNOW 2>/dev/null || true

        echo "  Creating service..."
        snow spcs service create "${DATABASE}.PUBLIC.${SERVICE}" \
            --compute-pool "${DATABASE}.PUBLIC.${POOL}" \
            --spec-path deploy/spcs/service-spec.yaml \
            $SNOW 2>/dev/null || true

        echo "  Waiting for service..."
        for i in $(seq 1 30); do
            STATUS=$(snow spcs service status "${DATABASE}.PUBLIC.${SERVICE}" $SNOW 2>/dev/null | grep -o 'READY\|PENDING\|FAILED' | head -1)
            [ "$STATUS" = "READY" ] && break
            [ "$STATUS" = "FAILED" ] && error_exit "Service failed to start. Check logs."
            echo "    Status: ${STATUS:-PENDING} (${i}/30)"
            sleep 10
        done

        echo -e "${GREEN}[OK]${NC} SPCS deployment complete"
        echo "  Service: ${SERVICE}"
        snow spcs service endpoint "${DATABASE}.PUBLIC.${SERVICE}" $SNOW 2>/dev/null || true
    else
        echo -e "${YELLOW}[WARN]${NC} deploy/spcs/Dockerfile not found, skipping SPCS"
    fi
    echo ""
fi

echo "=================================================="
echo -e "${GREEN}Deployment Complete${NC}"
echo "=================================================="

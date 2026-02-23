#!/bin/bash
# =============================================================================
# CI Test Cycle Template
# =============================================================================
# Automated test cycle for Snowflake demo projects.
# Copy to your project root and customize:
#   - MIN_EXPECTED_ROWS: minimum output rows for your project
#   - TIMEOUT_SECONDS: max time for main workflow
#   - Step 5 output table: replace DB.SCHEMA.OUTPUT_TABLE with your table
# =============================================================================

set -e
set -o pipefail

# ---------------------------------------------------------------------------
# Configuration — customize these for your project
# ---------------------------------------------------------------------------
CONNECTION_NAME="${SNOWFLAKE_CONNECTION:-demo}"
MIN_EXPECTED_ROWS=10    # customize per project
TIMEOUT_SECONDS=600

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Resolve script directory and cd to it
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# ---------------------------------------------------------------------------
# Step 1: Clean
# ---------------------------------------------------------------------------
echo "========================================="
echo "Step 1: Clean"
echo "========================================="
./clean.sh -c "$CONNECTION_NAME" --force

# ---------------------------------------------------------------------------
# Step 2: Deploy
# ---------------------------------------------------------------------------
echo "========================================="
echo "Step 2: Deploy"
echo "========================================="
./deploy.sh -c "$CONNECTION_NAME"

# ---------------------------------------------------------------------------
# Step 3: Test queries
# ---------------------------------------------------------------------------
echo "========================================="
echo "Step 3: Test queries"
echo "========================================="
./run.sh -c "$CONNECTION_NAME" test || { echo -e "${RED}Query validation failed${NC}"; exit 1; }

# ---------------------------------------------------------------------------
# Step 4: Run main workflow
# ---------------------------------------------------------------------------
echo "========================================="
echo "Step 4: Run main workflow"
echo "========================================="
if ! timeout "$TIMEOUT_SECONDS" ./run.sh -c "$CONNECTION_NAME" main; then
    if [ $? -eq 124 ]; then
        echo -e "${RED}Main workflow timed out after ${TIMEOUT_SECONDS}s${NC}"
    else
        echo -e "${RED}Main workflow failed${NC}"
    fi
    exit 1
fi

# ---------------------------------------------------------------------------
# Step 5: Verify outputs
# ---------------------------------------------------------------------------
echo "========================================="
echo "Step 5: Verify outputs"
echo "========================================="
# Replace DB.SCHEMA.OUTPUT_TABLE with your project's actual output table
ROW_COUNT=$(snow sql -c "$CONNECTION_NAME" -q "SELECT COUNT(*) FROM DB.SCHEMA.OUTPUT_TABLE;" -o tsv | tail -1)

if [ "$ROW_COUNT" -ge "$MIN_EXPECTED_ROWS" ]; then
    echo -e "${GREEN}PASSED${NC} — ${ROW_COUNT} rows (minimum: ${MIN_EXPECTED_ROWS})"
    exit 0
else
    echo -e "${RED}FAILED${NC} — ${ROW_COUNT} rows (minimum: ${MIN_EXPECTED_ROWS})"
    exit 1
fi

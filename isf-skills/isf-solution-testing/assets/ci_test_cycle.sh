#!/bin/bash
###############################################################################
# ci_test_cycle.sh - Automated test cycle for CI/CD pipelines
###############################################################################

set -e
set -o pipefail

# Configuration
CONNECTION_NAME="${SNOWFLAKE_CONNECTION:-demo}"
MIN_EXPECTED_ROWS=10
TIMEOUT_SECONDS=600

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "=== CI Test Cycle Started ==="
echo "Connection: $CONNECTION_NAME"
echo "Timestamp: $(date)"

# Step 1: Clean
echo ""
echo "Step 1: Cleaning previous deployment..."
./clean.sh -c $CONNECTION_NAME --force
echo "✓ Cleanup complete"

# Step 2: Deploy
echo ""
echo "Step 2: Deploying..."
./deploy.sh -c $CONNECTION_NAME
echo "✓ Deployment complete"

# Step 3: Test queries
echo ""
echo "Step 3: Validating queries..."
./run.sh -c $CONNECTION_NAME test || {
    echo "✗ Query validation failed"
    exit 1
}
echo "✓ All queries validated"

# Step 4: Run main workflow
echo ""
echo "Step 4: Executing main workflow..."
timeout $TIMEOUT_SECONDS ./run.sh -c $CONNECTION_NAME main || {
    echo "✗ Workflow execution failed or timed out"
    exit 1
}
echo "✓ Workflow execution complete"

# Step 5: Verify outputs
echo ""
echo "Step 5: Verifying outputs..."

# Replace with your project's output table
OUTPUT_COUNT=$(snow sql -c $CONNECTION_NAME -q "
    SELECT COUNT(*) FROM DB.SCHEMA.OUTPUT_TABLE;
" -o tsv 2>/dev/null | tail -1)

if [ "$OUTPUT_COUNT" -ge "$MIN_EXPECTED_ROWS" ]; then
    echo -e "${GREEN}✓ Test cycle PASSED${NC}"
    echo "  Output rows: $OUTPUT_COUNT (expected >= $MIN_EXPECTED_ROWS)"
    exit 0
else
    echo -e "${RED}✗ Test cycle FAILED${NC}"
    echo "  Output rows: $OUTPUT_COUNT (expected >= $MIN_EXPECTED_ROWS)"
    exit 1
fi


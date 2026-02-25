#!/bin/bash
###############################################################################
# run.sh - Runtime operations for ISF solution
#
# Commands: status, url, test, logs
###############################################################################

set -e
set -o pipefail

CONNECTION_NAME="${SNOWFLAKE_CONNECTION_NAME:-demo}"
COMMAND=""
PROJECT_PREFIX="MY_PROJECT"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

[ -f .env ] && export $(grep -v '^#' .env | xargs)

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

error_exit() { echo -e "${RED}[ERROR] $1${NC}" >&2; exit 1; }

usage() {
    cat << EOF
Usage: $0 COMMAND [OPTIONS]

Commands:
  status     Check all resource status (database, service, compute pool)
  url        Get SPCS service endpoint URL
  test       Run validation tests
  logs       Get SPCS container logs

Options:
  -c, --connection NAME    Snowflake CLI connection
  -h, --help               Show this help
EOF
    exit 0
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help) usage ;;
        -c|--connection) CONNECTION_NAME="$2"; shift 2 ;;
        status|url|test|logs) COMMAND="$1"; shift ;;
        *) error_exit "Unknown: $1" ;;
    esac
done

[ -z "$COMMAND" ] && usage

SNOW="-c $CONNECTION_NAME"
DATABASE="${PROJECT_PREFIX}"
SERVICE="${PROJECT_PREFIX}_SERVICE"
POOL="${PROJECT_PREFIX}_POOL"

cmd_status() {
    echo "ISF Solution Status"
    echo "==================="
    echo ""

    echo "Database:"
    snow sql $SNOW -q "SELECT CURRENT_DATABASE(), CURRENT_SCHEMA();" 2>/dev/null || echo "  [ERROR] Not connected"
    echo ""

    echo "Schemas:"
    snow sql $SNOW -q "SHOW SCHEMAS IN DATABASE ${DATABASE};" 2>/dev/null || echo "  [ERROR] Database not found"
    echo ""

    echo "Compute Pool:"
    snow spcs compute-pool status "${DATABASE}.PUBLIC.${POOL}" $SNOW 2>/dev/null || echo "  [WARN] Pool not found"
    echo ""

    echo "Service:"
    snow spcs service status "${DATABASE}.PUBLIC.${SERVICE}" $SNOW 2>/dev/null || echo "  [WARN] Service not found"
}

cmd_url() {
    echo "Service Endpoint:"
    snow spcs service endpoint "${DATABASE}.PUBLIC.${SERVICE}" $SNOW 2>/dev/null || echo "  [ERROR] Service not found or not ready"
}

cmd_test() {
    echo "Running validation tests..."
    echo ""

    echo "1. Connection test..."
    snow sql $SNOW -q "SELECT 1;" &>/dev/null && echo -e "  ${GREEN}[OK]${NC} Connected" || echo -e "  ${RED}[ERROR]${NC} Connection failed"

    echo "2. Database exists..."
    snow sql $SNOW -q "SHOW DATABASES LIKE '${DATABASE}';" &>/dev/null && echo -e "  ${GREEN}[OK]${NC} Database found" || echo -e "  ${RED}[ERROR]${NC} Database not found"

    echo "3. Tables populated..."
    snow sql $SNOW -q "SELECT TABLE_NAME, ROW_COUNT FROM ${DATABASE}.INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA NOT IN ('INFORMATION_SCHEMA', 'PUBLIC') ORDER BY TABLE_SCHEMA, TABLE_NAME;" 2>/dev/null || echo -e "  ${RED}[ERROR]${NC} Cannot query tables"

    echo "4. Service health..."
    ENDPOINT=$(snow spcs service endpoint "${DATABASE}.PUBLIC.${SERVICE}" $SNOW 2>/dev/null | tail -1)
    if [ -n "$ENDPOINT" ]; then
        curl -sf "${ENDPOINT}/health" &>/dev/null && echo -e "  ${GREEN}[OK]${NC} Health check passed" || echo -e "  ${RED}[ERROR]${NC} Health check failed"
    else
        echo "  [WARN] No service endpoint found"
    fi
}

cmd_logs() {
    echo "SPCS Service Logs:"
    snow sql $SNOW -q "SELECT SYSTEM\$GET_SERVICE_LOGS('${DATABASE}.PUBLIC.${SERVICE}', '0', 'app');" 2>/dev/null || echo "  [ERROR] Cannot retrieve logs"
}

case $COMMAND in
    status) cmd_status ;;
    url) cmd_url ;;
    test) cmd_test ;;
    logs) cmd_logs ;;
esac

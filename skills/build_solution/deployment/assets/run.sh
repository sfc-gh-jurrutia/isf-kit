#!/bin/bash
###############################################################################
# run.sh - Runtime operations for PROJECT_NAME
#
# Commands: main, test, status, streamlit
###############################################################################

set -e
set -o pipefail

CONNECTION_NAME="demo"
ENV_PREFIX=""
COMMAND=""
PROJECT_PREFIX="MY_PROJECT"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

error_exit() { echo -e "${RED}[ERROR] $1${NC}" >&2; exit 1; }

usage() {
    cat << EOF
Usage: $0 COMMAND [OPTIONS]

Commands:
  main       Execute main workflow
  test       Run query test suite
  status     Check resource status
  streamlit  Get Streamlit URL

Options:
  -c, --connection NAME    Snowflake CLI connection
EOF
    exit 0
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help) usage ;;
        -c|--connection) CONNECTION_NAME="$2"; shift 2 ;;
        main|test|status|streamlit) COMMAND="$1"; shift ;;
        *) error_exit "Unknown: $1" ;;
    esac
done

[ -z "$COMMAND" ] && usage

SNOW_CONN="-c $CONNECTION_NAME"
DATABASE="${PROJECT_PREFIX}"
SCHEMA="${PROJECT_PREFIX}"
ROLE="${PROJECT_PREFIX}_ROLE"

cmd_main() {
    echo "Executing main workflow..."
    # Add notebook execution here
}

cmd_test() {
    echo "Running query tests..."
    # Add test execution here
}

cmd_status() {
    echo "Checking status..."
    snow sql $SNOW_CONN -q "SHOW DATABASES LIKE '${DATABASE}';"
}

cmd_streamlit() {
    URL=$(snow streamlit get-url APP_NAME $SNOW_CONN --database $DATABASE --schema $SCHEMA 2>/dev/null) || true
    echo "Streamlit URL: ${URL:-Not found}"
}

case $COMMAND in
    main) cmd_main ;;
    test) cmd_test ;;
    status) cmd_status ;;
    streamlit) cmd_streamlit ;;
esac


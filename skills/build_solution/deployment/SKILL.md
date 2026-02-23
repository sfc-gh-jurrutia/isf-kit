---
name: snowflake-deployment
description: Create deploy.sh, run.sh, clean.sh scripts and DDL for Snowflake projects. Use when: (1) setting up project infrastructure, (2) creating deployment shell scripts, (3) writing SQL DDL statements, (4) implementing component-only deployments, (5) fixing CHECK constraint errors, or (6) establishing clean teardown procedures.
parent_skill: build_solution
---

# Snowflake Deployment Scripts

## Three-Script Model

**CRITICAL: All scripts MUST be in PROJECT ROOT (not in scripts/ subdirectory)**

| Script | Purpose | Location |
|--------|---------|----------|
| `deploy.sh` | Infrastructure setup (DB, roles, tables, apps) | PROJECT ROOT |
| `run.sh` | Runtime operations (execute, status, URLs, test) | PROJECT ROOT |
| `clean.sh` | Complete teardown | PROJECT ROOT |

### Default Behavior

- `./deploy.sh` (no arguments) MUST run ALL deployment steps
- `./run.sh main` runs the primary workflow
- `./clean.sh` prompts for confirmation then removes everything

## Required Script Header

```bash
#!/bin/bash
set -e
set -o pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

error_exit() { echo -e "${RED}[ERROR] $1${NC}" >&2; exit 1; }
```

## Configuration Pattern

```bash
CONNECTION_NAME="demo"
ENV_PREFIX=""
PROJECT_PREFIX="MY_PROJECT"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

SNOW_CONN="-c $CONNECTION_NAME"

if [ -n "$ENV_PREFIX" ]; then
    FULL_PREFIX="${ENV_PREFIX}_${PROJECT_PREFIX}"
else
    FULL_PREFIX="${PROJECT_PREFIX}"
fi

DATABASE="${FULL_PREFIX}"
SCHEMA="${PROJECT_PREFIX}"
ROLE="${FULL_PREFIX}_ROLE"
WAREHOUSE="${FULL_PREFIX}_WH"
```

## Key Patterns

### Component-Only Deployment (--only-*)

```bash
should_run_step() {
    local step_name="$1"
    [ -z "$ONLY_COMPONENT" ] && return 0
    case "$ONLY_COMPONENT" in
        sql) [[ "$step_name" =~ sql ]] ;;
        react) [[ "$step_name" == "react" ]] ;;
        *) return 1 ;;
    esac
}
```

### External Dataset Management (Sparse Checkout)

```bash
# Download specific directory without full repo history
git clone --depth 1 --filter=blob:none --sparse https://github.com/user/repo.git temp_clone
cd temp_clone
git sparse-checkout set path/to/data
mv path/to/data ../data/
cd .. && rm -rf temp_clone
```

### Network Access (Egress)

Avoid network rules unless required (e.g., PyPI, external APIs).

```sql
-- 1. Create Network Rule (ACCOUNTADMIN)
CREATE OR REPLACE NETWORK RULE PROJECT_EGRESS_RULE
    TYPE = HOST_PORT
    MODE = EGRESS
    VALUE_LIST = ('pypi.org:443', 'files.pythonhosted.org:443');

-- 2. Create Integration
CREATE OR REPLACE EXTERNAL ACCESS INTEGRATION PROJECT_EXTERNAL_ACCESS
    ALLOWED_NETWORK_RULES = (PROJECT_EGRESS_RULE)
    ENABLED = TRUE;

-- 3. Grant Usage
GRANT USAGE ON INTEGRATION PROJECT_EXTERNAL_ACCESS TO ROLE PROJECT_ROLE;
```

### SQL with Session Variables

```bash
{
    echo "SET FULL_PREFIX = '${FULL_PREFIX}';"
    echo "SET PROJECT_ROLE = '${ROLE}';"
    cat sql/01_setup.sql
} | snow sql $SNOW_CONN -i
```

### clean.sh Deletion Order (CRITICAL)

```bash
# Must delete in this order:
# 1. Compute Pools
# 2. Warehouses
# 3. External Access Integrations
# 4. Network Rules
# 5. Database (cascades)
# 6. Role (last)

snow sql $SNOW_CONN -q "DROP COMPUTE POOL IF EXISTS ${POOL};" 2>/dev/null || true
snow sql $SNOW_CONN -q "DROP DATABASE IF EXISTS ${DATABASE};" 2>/dev/null || true
snow sql $SNOW_CONN -q "DROP ROLE IF EXISTS ${ROLE};" 2>/dev/null || true
```

### run.sh Commands

```bash
case $COMMAND in
    main) cmd_main ;;      # Execute workflow
    test) cmd_test ;;      # Run query tests
    status) cmd_status ;;  # Check resources
    url) cmd_url ;;        # Get service URL
esac
```

## DDL Guidelines

### Unsupported: CHECK Constraints

```sql
-- WRONG - Will fail with Error 000002
CONSTRAINT CHK_STATUS CHECK (status IN ('ACTIVE', 'INACTIVE'))

-- CORRECT - Document in comments, enforce in application
status VARCHAR(20)  -- Valid: ACTIVE, INACTIVE (app-enforced)
```

### Constraint Support

| Constraint | Enforced |
|------------|----------|
| NOT NULL | ✅ Yes |
| DEFAULT | ✅ Yes |
| PRIMARY KEY | ❌ Metadata only |
| FOREIGN KEY | ❌ Metadata only |
| UNIQUE (RELY) | ✅ Yes |
| CHECK | ❌ Not supported |

### Database Creation

```sql
CREATE DATABASE IF NOT EXISTS MY_DB;
DROP SCHEMA IF EXISTS MY_DB.PUBLIC;  -- Remove auto-created schema
```

## Detailed Guides

For implementation details, see:
- [references/ddl.md](references/ddl.md) - Full DDL guidelines


# Full Test Cycle Guide

## Step-by-Step Execution

### Step 1: Clean Up

```bash
# Non-interactive (recommended for test cycles)
./clean.sh --force

# Interactive (prompts for confirmation)
./clean.sh
```

**Expected**: Each resource shows `[OK]` or `[WARN]` (acceptable for non-existent resources).

### Step 2: Deploy

```bash
# Full deployment
./deploy.sh

# Component-only (faster iteration)
./deploy.sh --only-sql
./deploy.sh --only-data
./deploy.sh --only-notebook
./deploy.sh --only-streamlit
```

**Expected**: All steps complete with `[OK]` status.

### Step 3: Test Queries

```bash
./run.sh test
```

**Expected**: All registered queries pass. If any fail, fix before proceeding.

### Step 4: Run Main Workflow

```bash
./run.sh main
```

**Expected**: Notebook executes successfully, outputs generated.

### Step 5: Verify

```bash
./run.sh status
./run.sh streamlit
```

## Quick Diagnostic Commands

```bash
# Check connection
snow sql -c CONNECTION -q "SELECT CURRENT_USER(), CURRENT_ROLE();"

# Check compute pool
snow sql -q "SHOW COMPUTE POOLS LIKE '%PROJECT_NAME%';"

# Check table row counts
snow sql -q "
    SELECT table_name, row_count 
    FROM information_schema.tables 
    WHERE table_schema = 'SCHEMA';
"

# Check stage contents
snow sql -q "LIST @STAGE_NAME;"

# Check apps
snow sql -q "SHOW STREAMLITS IN SCHEMA DB.SCHEMA;"
snow sql -q "SHOW NOTEBOOKS IN SCHEMA DB.SCHEMA;"
```

## CI/CD Integration

```bash
#!/bin/bash
# ci_test_cycle.sh

set -e
set -o pipefail

CONNECTION="${SNOWFLAKE_CONNECTION:-demo}"
TIMEOUT=600

./clean.sh -c $CONNECTION --force
./deploy.sh -c $CONNECTION
./run.sh -c $CONNECTION test || exit 1
timeout $TIMEOUT ./run.sh -c $CONNECTION main || exit 1

# Verify outputs
COUNT=$(snow sql -c $CONNECTION -q "SELECT COUNT(*) FROM OUTPUT_TABLE" -o tsv | tail -1)
[ "$COUNT" -gt 0 ] || exit 1

echo "Test cycle PASSED: $COUNT rows"
```


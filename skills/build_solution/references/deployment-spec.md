# Deployment Specification

> Load this reference during Step 2 (Generate Specification) and Step 8 (Deploy) to ensure deployment follows the three-script model.

## Three-Script Model

Every solution project must have exactly three scripts in the **project root**:

```
project-root/
├── deploy.sh        # Creates all Snowflake objects
├── run.sh           # Starts the application
├── clean.sh         # Drops all created objects
├── README.md
├── sql/
│   ├── 01_setup.sql
│   ├── 02_raw.sql
│   ├── 03_atomic.sql
│   ├── 04_data_mart.sql
│   └── 05_cortex.sql
├── data/
│   └── seed/        # Pre-generated synthetic data
├── app/             # Application code
└── ...
```

### deploy.sh

```bash
#!/bin/bash
set -euo pipefail

# Connection from environment
CONNECTION="${SNOWFLAKE_CONNECTION_NAME:-demo}"

echo "=== Deploying {PROJECT_NAME} ==="
echo "Connection: ${CONNECTION}"

# Execute SQL files in order
for sql_file in sql/01_setup.sql sql/02_raw.sql sql/03_atomic.sql sql/04_data_mart.sql sql/05_cortex.sql; do
    echo "Running ${sql_file}..."
    snow sql -f "${sql_file}" -c "${CONNECTION}"
done

# Load seed data
echo "Loading seed data..."
snow sql -f sql/load_seeds.sql -c "${CONNECTION}"

echo "=== Deployment complete ==="
```

**Requirements:**
- Idempotent — safe to run multiple times (`CREATE OR REPLACE`)
- Uses `SNOWFLAKE_CONNECTION_NAME` env var
- SQL files numbered for execution order
- Prints progress to stdout
- Fails fast on errors (`set -euo pipefail`)

### run.sh

```bash
#!/bin/bash
set -euo pipefail

CONNECTION="${SNOWFLAKE_CONNECTION_NAME:-demo}"

echo "=== Starting {PROJECT_NAME} ==="

# Start React+FastAPI
cd react && ./start.sh
```

### clean.sh

```bash
#!/bin/bash
set -euo pipefail

CONNECTION="${SNOWFLAKE_CONNECTION_NAME:-demo}"

echo "=== Cleaning {PROJECT_NAME} ==="
echo "This will drop ALL objects created by deploy.sh"
read -p "Continue? (y/N) " confirm
if [[ "${confirm}" != "y" ]]; then
    echo "Aborted."
    exit 0
fi

snow sql -q "DROP DATABASE IF EXISTS {PROJECT_DATABASE}" -c "${CONNECTION}"
echo "=== Clean complete ==="
```

**Requirements:**
- Confirmation prompt before destructive action
- Drops in reverse dependency order
- Removes everything `deploy.sh` created

## Connection Profile Pattern

```python
# Python — always use this pattern
import os

connection_name = os.getenv("SNOWFLAKE_CONNECTION_NAME", "demo")
```

```bash
# Bash — always use this pattern
CONNECTION="${SNOWFLAKE_CONNECTION_NAME:-demo}"
```

```sql
-- SQL files should NOT contain connection info
-- Connection is handled by the caller (deploy.sh via snow cli)
```

### Account URL Format

When constructing URLs for REST API calls:

```python
# Snowflake account URL format
# ORGNAME_ACCOUNT → orgname-account (underscores to hyphens)
account_url = f"https://{org}-{account}.snowflakecomputing.com"
```

## SPCS Readiness (When Applicable)

For solutions that deploy to Snowpark Container Services:

### Service Spec

```yaml
spec:
  containers:
    - name: app
      image: /{DB}/{SCHEMA}/{IMAGE_REPO}/{IMAGE_NAME}:latest
      resources:
        requests:
          cpu: "0.5"
          memory: "1Gi"
        limits:
          cpu: "1"
          memory: "2Gi"
      readinessProbe:
        port: 8080
        path: /health
      env:
        SNOWFLAKE_CONNECTION_NAME: demo
  endpoints:
    - name: app
      port: 8080
      public: true
```

### Service DDL

```sql
CREATE SERVICE {SERVICE_NAME}
    IN COMPUTE POOL {POOL_NAME}
    FROM @{STAGE}/{SPEC_FILE}
    MIN_INSTANCES = 1
    MAX_INSTANCES = 1
    AUTO_SUSPEND_SECS = 300;

-- Compute pool (if needed)
CREATE COMPUTE POOL IF NOT EXISTS {POOL_NAME}
    MIN_NODES = 1
    MAX_NODES = 1
    INSTANCE_FAMILY = CPU_X64_XS
    AUTO_SUSPEND_SECS = 300;
```

### SPCS Gotchas

1. `CPU_X64_XS` is the smallest instance family — start here for solutions
2. `AUTO_SUSPEND_SECS = 300` (5 min) — balances cost and responsiveness
3. Readiness probe **must** be on port 8080 path `/health`
4. Image repo must exist before pushing: `CREATE IMAGE REPOSITORY IF NOT EXISTS`
5. Service logs: `SELECT SYSTEM$GET_SERVICE_LOGS('{SERVICE_NAME}', '0', 'app')`

## Python Environment

```
# requirements.txt constraints for Snowflake compatibility
python_requires = ">=3.10,<3.12"

# Core Snowflake packages
snowflake-snowpark-python>=1.0.0
snowflake-connector-python>=3.0.0

# HTTP client (NOT requests)
httpx>=0.24.0

# Web framework
fastapi>=0.100.0
uvicorn>=0.23.0

# Data
pandas>=2.0.0
```

## Deployment Checklist

Before marking deployment ready in spec:

- [ ] `deploy.sh` in project root, idempotent, uses `SNOWFLAKE_CONNECTION_NAME`
- [ ] `run.sh` in project root, starts application
- [ ] `clean.sh` in project root, drops all objects with confirmation
- [ ] SQL files numbered for execution order
- [ ] Seed data pre-generated and committed in `data/seed/`
- [ ] Connection uses env var pattern (never hardcoded)
- [ ] Python version `>=3.10,<3.12`
- [ ] HTTP client is `httpx` (not `requests`)
- [ ] SPCS spec has readiness probe on 8080/health (if containerized)
- [ ] Account URL uses hyphens not underscores
- [ ] No `ACCOUNTADMIN` role in any script

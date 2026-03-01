---
name: isf-deployment
description: >
  Deploy ISF solutions to Snowflake using schemachange migrations, seed data
  loading, and SPCS container deployment. Use when: (1) running initial
  infrastructure setup, (2) executing database migrations, (3) loading seed
  data, (4) deploying React+FastAPI to SPCS, (5) tearing down environments,
  or (6) troubleshooting deployment failures.
parent_skill: isf-solution-engine
---

# ISF Deployment

## Quick Start

### What Does This Skill Do?

Deploys an ISF solution to Snowflake in four stages:
1. **Setup** — Run `deploy/setup.sql` to create database, schemas, roles, grants
2. **Migrate** — Run schemachange to apply versioned DDL from `src/database/migrations/`
3. **Load Data** — Load pre-generated seed data from `src/data_engine/output/`
4. **Deploy App** — Build Docker image, push to SPCS, create service

### Input

- Scaffolded project following ISF project structure (from `isf-solution-planning`)
- Migration files in `src/database/migrations/` (from `isf-data-architecture`)
- Seed data in `src/data_engine/output/` (from `isf-data-generation`)
- React+FastAPI app in `src/ui/` and `api/` (from `isf-solution-react-app`)
- `.env` with connection configuration

### Orchestration

The `Makefile` is the primary interface. Each target maps to a deployment stage:

```makefile
make deploy          # Full deployment: setup + migrate + data + app
make deploy-db       # Setup + schemachange migrations only
make deploy-data     # Load seed data only
make deploy-app      # Build Docker + push to SPCS only
make clean           # Full teardown (with confirmation)
make status          # Check all resource status
make test            # Run all tests
```

## References

| File | Purpose | When Loaded |
|------|---------|-------------|
| `references/ddl.md` | DDL constraints (CHECK unsupported, PK/FK metadata-only) | When generating or reviewing DDL |
| `references/nginx-spcs-pattern.md` | Multi-process SPCS: nginx + uvicorn + supervisord | When app needs WebSocket or multi-service container |
| `assets/deploy.sh` | Deploy script template (copied into project) | Project scaffold |
| `assets/run.sh` | Runtime operations template | Project scaffold |
| `assets/clean.sh` | Teardown template with correct deletion order | Project scaffold |

**When copying shell assets:** Replace `PROJECT_PREFIX="MY_PROJECT"` with the actual project name in all three scripts.

## Core Workflow

```
1. VALIDATE PREREQUISITES
   └── Verify snow CLI installed
   └── Test Snowflake connection
   └── Verify project structure exists

   ⚠️ STOP: Confirm target environment before deploying.

2. SETUP INFRASTRUCTURE
   └── Run deploy/setup.sql (database, schemas, roles, warehouse, grants)
   └── Verify objects created

3. RUN MIGRATIONS
   └── Execute schemachange against src/database/migrations/
   └── Verify migration history (SCHEMACHANGE.CHANGE_HISTORY)

4. LOAD SEED DATA
   └── Stage CSV files from src/data_engine/output/
   └── COPY INTO target tables
   └── Verify row counts

5. DEPLOY CORTEX OBJECTS (if applicable)
   └── Execute src/database/cortex/agent.sql
   └── Deploy semantic model from src/database/cortex/semantic_model.yaml
   └── Create search service from src/database/cortex/search_service.sql

6. DEPLOY APP TO SPCS
   └── Create image repository
   └── Build Docker image (multi-stage: React frontend + FastAPI backend)
   └── Push image to Snowflake registry
   └── Create compute pool
   └── Create service from deploy/spcs/service-spec.yaml
   └── Wait for READY status

   ⚠️ STOP: Present deployment summary and service URL.

7. VALIDATE
   └── Health check: curl {endpoint}/health
   └── Frontend loads: curl {endpoint}
   └── Cortex connectivity (if applicable)
```

## Stage 1: Setup Infrastructure

Run the one-time provisioning SQL:

```bash
snow sql -f deploy/setup.sql -c ${CONNECTION}
```

The `deploy/setup.sql` should create:
- Database with project name
- RAW, ATOMIC, and DATA_MART schemas
- Project role with appropriate grants
- Warehouse for the project
- Drop the auto-created PUBLIC schema

## Stage 2: Schemachange Migrations

```bash
schemachange -f src/database/migrations/ \
  -a ${SNOWFLAKE_ACCOUNT} \
  -u ${SNOWFLAKE_USER} \
  -r ${SNOWFLAKE_ROLE} \
  -w ${SNOWFLAKE_WAREHOUSE} \
  -d ${SNOWFLAKE_DATABASE}
```

Migrations follow the versioning convention from `isf-data-architecture`:

| Version | Purpose |
|---------|---------|
| `V1.0.0__` | Initial schemas, roles |
| `V1.1.0__` | RAW layer tables |
| `V1.2.0__` | ATOMIC layer tables |
| `V1.3.0__` | DATA_MART views |
| `V1.4.0__` | Cortex objects |

## Stage 3: Load Seed Data

```bash
# Stage files
snow stage create @{DATABASE}.RAW.SEED_DATA --if-not-exists -c ${CONNECTION}
snow stage copy src/data_engine/output/*.csv @{DATABASE}.RAW.SEED_DATA -c ${CONNECTION}

# Load into tables
snow sql -f src/data_engine/loaders/load_seeds.sql -c ${CONNECTION}
```

The load script uses COPY INTO with error handling:

```sql
COPY INTO RAW.{TABLE_NAME}
FROM @RAW.SEED_DATA/{table_name}.csv
FILE_FORMAT = (TYPE = CSV SKIP_HEADER = 1 FIELD_OPTIONALLY_ENCLOSED_BY = '"')
ON_ERROR = 'ABORT_STATEMENT';
```

## Stage 4: App Deployment

### SPCS Deployment (React+FastAPI)

### Dockerfile (multi-stage)

```dockerfile
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY src/ui/package*.json ./
RUN npm ci
COPY src/ui/ ./
RUN npm run build

FROM python:3.11-slim AS backend
WORKDIR /app
RUN apt-get update && apt-get install -y nginx supervisor && rm -rf /var/lib/apt/lists/*
COPY api/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY api/ ./
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html
COPY deploy/spcs/nginx.conf /etc/nginx/nginx.conf
COPY deploy/spcs/supervisord.conf /etc/supervisor/conf.d/app.conf
EXPOSE 8080
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/app.conf"]
```

### Supervisord Pattern (Recommended)

Use supervisord to run nginx (static files + reverse proxy) and uvicorn (API) in a single container. This is the proven SPCS pattern — nginx handles static file serving and proxies `/api/*` to the Python backend.

**`deploy/spcs/supervisord.conf`:**

```ini
[supervisord]
nodaemon=true
logfile=/dev/stdout
logfile_maxbytes=0

[program:nginx]
command=/usr/sbin/nginx -g "daemon off;"
priority=10
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:uvicorn]
command=uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
directory=/app
priority=20
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
```

**`deploy/spcs/nginx.conf`:**

```nginx
events { worker_connections 1024; }
http {
    include /etc/nginx/mime.types;
    server {
        listen 8080;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location /api/ {
            proxy_pass http://127.0.0.1:8000/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_buffering off;
        }

        location /health {
            return 200 '{"status": "healthy"}';
            add_header Content-Type application/json;
        }

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### Service Spec (`deploy/spcs/service-spec.yaml`)

```yaml
spec:
  containers:
    - name: app
      image: /{DATABASE}/{SCHEMA}/{REPO}/{IMAGE}:latest
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
        SNOWFLAKE_DATABASE: "{DATABASE}"
        SNOWFLAKE_SCHEMA: "{SCHEMA}"
        SNOWFLAKE_WAREHOUSE: "{WAREHOUSE}"
  endpoints:
    - name: app
      port: 8080
      public: true
```

### Deployment Commands

```bash
# Create image repo
snow sql -q "CREATE IMAGE REPOSITORY IF NOT EXISTS {REPO}" -c ${CONNECTION}

# Get registry URL
REGISTRY=$(snow spcs image-repository url {REPO} -c ${CONNECTION})

# Build and push
docker build -t ${REGISTRY}/{IMAGE}:latest -f deploy/spcs/Dockerfile .
docker push ${REGISTRY}/{IMAGE}:latest

# Create compute pool
snow spcs compute-pool create {POOL} \
  --min-nodes 1 --max-nodes 1 \
  --instance-family CPU_X64_XS \
  --auto-suspend-secs 300 \
  --if-not-exists -c ${CONNECTION}

# Create service
snow spcs service create {SERVICE} \
  --compute-pool {POOL} \
  --spec-path deploy/spcs/service-spec.yaml \
  -c ${CONNECTION}

# Wait for ready
snow spcs service status {SERVICE} -c ${CONNECTION}
```

## Teardown

**Deletion order is critical** — delete in reverse dependency:

1. SPCS Services
2. Compute Pools
3. Image Repositories
5. Cortex objects (agents, search services)
6. Warehouse
7. Database (cascades schemas, tables, views)
8. Role (last)

See `assets/clean.sh` for the template with correct ordering.

## Network Egress (When Required)

For SPCS containers that need external access (PyPI, external APIs):

```sql
CREATE OR REPLACE NETWORK RULE {PROJECT}_EGRESS_RULE
    TYPE = HOST_PORT
    MODE = EGRESS
    VALUE_LIST = ('pypi.org:443', 'files.pythonhosted.org:443');

CREATE OR REPLACE EXTERNAL ACCESS INTEGRATION {PROJECT}_EXTERNAL_ACCESS
    ALLOWED_NETWORK_RULES = ({PROJECT}_EGRESS_RULE)
    ENABLED = TRUE;

GRANT USAGE ON INTEGRATION {PROJECT}_EXTERNAL_ACCESS TO ROLE {PROJECT}_ROLE;
```

Reference the integration in the service creation SQL.

## SPCS Environment Auto-Detection

When the backend needs to run in both local development and SPCS, use environment detection to switch connection strategies:

```python
import os
from pathlib import Path

def is_spcs_environment() -> bool:
    """Detect whether running inside an SPCS container."""
    return (
        Path("/snowflake/session/token").exists() or
        os.getenv("SNOWFLAKE_HOST") is not None
    )

def get_session():
    if is_spcs_environment():
        from snowflake.snowpark import Session
        return Session.builder.getOrCreate()
    else:
        import subprocess
        # Fallback: use snow CLI for local development
        result = subprocess.run(
            ["snow", "sql", "-q", query, "-c", connection, "--format", "json"],
            capture_output=True, text=True
        )
        return json.loads(result.stdout)
```

For SPCS OAuth token refresh on expiration (error code `390114`):

```python
def get_oauth_token() -> str:
    with open("/snowflake/session/token") as f:
        return f.read().strip()
```

## Grant Access SQL

Generate a consumer role for the deployed application:

```sql
-- deploy/grant_access.sql
CREATE ROLE IF NOT EXISTS {PROJECT}_CONSUMER_ROLE;

GRANT USAGE ON DATABASE {DATABASE} TO ROLE {PROJECT}_CONSUMER_ROLE;
GRANT USAGE ON SCHEMA {DATABASE}.{DATA_MART} TO ROLE {PROJECT}_CONSUMER_ROLE;
GRANT SELECT ON ALL TABLES IN SCHEMA {DATABASE}.{DATA_MART} TO ROLE {PROJECT}_CONSUMER_ROLE;
GRANT SELECT ON ALL VIEWS IN SCHEMA {DATABASE}.{DATA_MART} TO ROLE {PROJECT}_CONSUMER_ROLE;

GRANT USAGE ON WAREHOUSE {WAREHOUSE} TO ROLE {PROJECT}_CONSUMER_ROLE;

-- Cortex service access
GRANT USAGE ON CORTEX SEARCH SERVICE {DATABASE}.{SCHEMA}.{SEARCH_SVC} TO ROLE {PROJECT}_CONSUMER_ROLE;

-- SPCS endpoint access (React path)
GRANT USAGE ON SERVICE {DATABASE}.{SCHEMA}.{SERVICE}!ALL_ENDPOINTS_USAGE TO ROLE {PROJECT}_CONSUMER_ROLE;

-- Assign to users
GRANT ROLE {PROJECT}_CONSUMER_ROLE TO ROLE SYSADMIN;
```

## Compute Pool Lifecycle

```bash
# Resume a suspended pool
snow spcs compute-pool resume {POOL} -c ${CONNECTION}

# Check pool status
snow spcs compute-pool status {POOL} -c ${CONNECTION}

# Suspend to save costs
snow spcs compute-pool suspend {POOL} -c ${CONNECTION}
```

Auto-suspend is configured at creation (`--auto-suspend-secs 300`). For demo environments, consider shorter timeouts.

## Pre-Flight Checklist

- [ ] `.env` configured with connection details
- [ ] `deploy/setup.sql` creates database, schemas, roles, warehouse
- [ ] `src/database/migrations/` has versioned DDL files
- [ ] `src/data_engine/output/` has seed CSVs with manifest.json
- [ ] `deploy/spcs/Dockerfile` builds successfully locally
- [ ] `deploy/spcs/service-spec.yaml` has correct image path
- [ ] Readiness probe configured on port 8080, path /health
- [ ] No hardcoded credentials in any file
- [ ] Makefile targets configured for the project

## Troubleshooting

| Issue | Check | Fix |
|-------|-------|-----|
| Connection failed | `snow connection test -c {conn}` | Verify .env, check network |
| Migration failed | Check SCHEMACHANGE.CHANGE_HISTORY | Fix SQL, re-run schemachange |
| COPY INTO failed | Check file format, column count | Verify CSV headers match table |
| Docker build fails | `docker build .` locally | Fix Dockerfile, check dependencies |
| Service stuck PENDING | `snow spcs compute-pool status {pool}` | Check pool capacity, image exists |
| Container crash loop | `snow spcs service logs {service}` | Check CMD, env vars, port |
| Health check failing | `curl {endpoint}/health` | Verify FastAPI health endpoint |
| Cortex 404 | Check endpoint path | Use `/agents/` not `/cortex-agents/` |

## Contract

**Inputs:**
- Migration files in `src/database/migrations/` (from `isf-data-architecture`)
- Seed data in `src/data_engine/output/` (from `isf-data-generation`)
- Cortex objects in `src/database/cortex/` (from Cortex skills)
- App code: `src/ui/` + `api/` (from `isf-solution-react-app`)
- `.env` with connection configuration

**Outputs:**
- Running SPCS service in Snowflake
- Service URL / Snowsight access (consumed by `isf-solution-testing`)

## Next Skill

After deployment is verified (health endpoint returns 200):

**Continue to** `../isf-solution-testing/SKILL.md` to run the 8-layer validation cycle.

If deployment fails, **Load** `../isf-diagnostics/SKILL.md` for troubleshooting.

If running the full ISF pipeline via `isf-solution-engine`, return to the engine for Phase 7.

### Quality Chain After Deployment

```
1. isf-solution-testing              → 8-layer test cycle
2. isf-solution-reflection-persona   → STAR journey audit
3. isf-solution-prepublication-checklist → Ship / No Ship gate
4. isf-solution-package              → Presentations and deliverables
```

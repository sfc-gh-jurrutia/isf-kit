---
name: build-deploy
description: "Deploy React+FastAPI solution to Snowpark Container Services. Use after implementation complete."
parent_skill: build_solution
---

# Deploy - SPCS Deployment

> Deploy React+FastAPI solution to Snowpark Container Services

## When to Load

After `004_implement/SKILL.md` has generated working React+FastAPI app.

## Prerequisites

- `react/` directory with frontend/ and backend/
- Working local build (npm run build passes)
- Snowflake connection configured
- ACCOUNTADMIN or role with SPCS privileges

## Workflow

### Step 1: Validate Local Build

**Execute** validation:

```bash
cd react/frontend && npm run build
cd react/backend && python -m pytest
```

**If validation fails:**
- Return to `004_implement/SKILL.md`
- Fix issues before continuing

**Verify project structure:**

```
react/
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
├── backend/
│   ├── requirements.txt
│   ├── api/
│   │   └── database.py    # Uses connection_name= pattern
│   └── main.py
├── Dockerfile             # Will be generated
└── spec.yaml              # Will be generated
```

**Next:** Continue to Step 2.

### Step 2: Generate SPCS Artifacts

**Load** `references/constraints.md` for SPCS requirements.

**Generate files:**

**1. `react/Dockerfile`** (multi-stage build):

```dockerfile
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim AS backend
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist ./static
EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

**2. `react/spec.yaml`** (SPCS service specification):

```yaml
spec:
  containers:
    - name: {service_name}
      image: /{database}/{schema}/{repo_name}/{image_name}:latest
      env:
        SNOWFLAKE_ACCOUNT: "{{SNOWFLAKE_ACCOUNT}}"
        SNOWFLAKE_USER: "{{SNOWFLAKE_USER}}"
        SNOWFLAKE_ROLE: "{{SNOWFLAKE_ROLE}}"
        SNOWFLAKE_WAREHOUSE: "{{SNOWFLAKE_WAREHOUSE}}"
        SNOWFLAKE_DATABASE: "{{SNOWFLAKE_DATABASE}}"
        SNOWFLAKE_SCHEMA: "{{SNOWFLAKE_SCHEMA}}"
      readinessProbe:
        port: 8080
        path: /health
  endpoints:
    - name: app
      port: 8080
      public: true
```

**3. `sql/99_spcs_deploy.sql`**:

```sql
-- Image Repository
CREATE IMAGE REPOSITORY IF NOT EXISTS {repo_name};

-- Compute Pool
CREATE COMPUTE POOL IF NOT EXISTS {pool_name}
  MIN_NODES = 1
  MAX_NODES = 2
  INSTANCE_FAMILY = CPU_X64_XS
  AUTO_SUSPEND_SECS = 300;

-- Grant permissions
GRANT USAGE ON COMPUTE POOL {pool_name} TO ROLE {role};

-- Service (created after image push)
-- CREATE SERVICE {service_name}
--   IN COMPUTE POOL {pool_name}
--   FROM SPECIFICATION_FILE = 'spec.yaml'
--   EXTERNAL_ACCESS_INTEGRATIONS = (...)
--   QUERY_WAREHOUSE = {warehouse};
```

**⚠️ MANDATORY STOPPING POINT**: Present deployment plan to user.

**Log**: Record `approval` — append to `specs/{solution}/decision-log.jsonl`: step "Deploy, Step 2: Deployment Plan", value_selected (Yes/No), alternatives ["Yes", "No"], rationale.

```
SPCS Deployment Plan:

1. Create image repository: {repo_name}
2. Build and push Docker image
3. Create compute pool: {pool_name}
4. Deploy service: {service_name}

Estimated compute pool credits: ~0.5/hour (CPU_X64_XS)
Auto-suspend after 5 minutes of inactivity.

Proceed with deployment? [Yes/No]
```

### Step 3: Deploy to SPCS

**Execute** deployment sequence:

**3.1 Get registry URL:**

```bash
snow spcs image-repository url {repo_name}
```

**3.2 Build and push image:**

```bash
cd react
docker build -t {registry_url}/{image_name}:latest .
docker push {registry_url}/{image_name}:latest
```

**3.3 Create compute pool:**

```bash
snow spcs compute-pool create {pool_name} \
  --min-nodes 1 \
  --max-nodes 2 \
  --instance-family CPU_X64_XS \
  --auto-suspend-secs 300 \
  --if-not-exists
```

**3.4 Create service:**

```bash
snow spcs service create {service_name} \
  --compute-pool {pool_name} \
  --spec-path react/spec.yaml
```

**Monitor** until READY:

```bash
snow spcs service status {service_name}
```

### Step 4: Validate Deployment

**Execute** health checks:

1. Get endpoint URL:
   ```bash
   snow spcs service endpoint {service_name}
   ```

2. Verify health endpoint responds:
   ```bash
   curl -s {endpoint_url}/health
   ```

3. Verify frontend loads:
   ```bash
   curl -s {endpoint_url} | head -20
   ```

4. Test Cortex connectivity (if applicable):
   ```bash
   curl -s {endpoint_url}/api/health/cortex
   ```

**Output:**

```
✅ Solution deployed to SPCS

Service: {service_name}
URL: {endpoint_url}

Status: READY
Compute Pool: {pool_name} (auto-suspend: 5min)

Access commands:
  snow spcs service status {service_name}
  snow spcs service logs {service_name}
  snow spcs service describe {service_name}

Management:
  Suspend: snow spcs compute-pool suspend {pool_name}
  Resume: snow spcs compute-pool resume {pool_name}
  Delete: snow spcs service drop {service_name}
```

## Stopping Points

- ✋ **Required** after Step 2 (deployment plan approval)

## Troubleshooting

**Service stuck in PENDING:**
- Check compute pool status: `snow spcs compute-pool status {pool_name}`
- Verify image pushed successfully: `snow spcs image-repository list-images {repo_name}`
- Check pool has available capacity

**Container fails to start:**
- Check logs: `snow spcs service logs {service_name}`
- Verify environment variables set correctly
- Check Dockerfile CMD is correct

**Connection refused:**
- Verify port 8080 exposed in Dockerfile
- Check readinessProbe path in spec.yaml
- Ensure health endpoint implemented

**Cortex calls failing:**
- Verify external access integration configured
- Check role has CORTEX usage grants
- Verify warehouse is running

## Next Skill

After successful deployment → Workflow complete.

**Final output:**
- specs/{solution}/spec.md
- specs/{solution}/prompt_plan.md  
- react/ with deployed app
- SPCS service running

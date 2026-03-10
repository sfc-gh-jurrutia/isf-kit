# SPCS Connectivity

Loaded from SKILL.md when deploying to SPCS (Stage 6). Follow these steps in order for a successful SPCS deployment with container-to-Snowflake connectivity.

## Step 1: External Access Integration

SPCS containers have no outbound network by default. Create a network rule and External Access Integration to enable the container to reach the Snowflake API:

```sql
CREATE OR REPLACE NETWORK RULE {DB}.{SCHEMA}.{PROJECT}_SF_EGRESS_RULE
    TYPE = HOST_PORT
    MODE = EGRESS
    VALUE_LIST = ('{account-identifier}.snowflakecomputing.com:443');

CREATE OR REPLACE EXTERNAL ACCESS INTEGRATION {PROJECT}_SF_ACCESS
    ALLOWED_NETWORK_RULES = ({DB}.{SCHEMA}.{PROJECT}_SF_EGRESS_RULE)
    ENABLED = TRUE;

GRANT USAGE ON INTEGRATION {PROJECT}_SF_ACCESS TO ROLE {SERVICE_ROLE};
```

Add these to `deploy/setup.sql` so they run as part of standard infrastructure provisioning.

### External API Egress (if needed)

If the container also needs to reach external services (PyPI, third-party APIs), add those hosts to a separate network rule:

```sql
CREATE OR REPLACE NETWORK RULE {DB}.{SCHEMA}.{PROJECT}_EXTERNAL_EGRESS_RULE
    TYPE = HOST_PORT
    MODE = EGRESS
    VALUE_LIST = ('pypi.org:443', 'files.pythonhosted.org:443');

CREATE OR REPLACE EXTERNAL ACCESS INTEGRATION {PROJECT}_EXTERNAL_ACCESS
    ALLOWED_NETWORK_RULES = ({DB}.{SCHEMA}.{PROJECT}_EXTERNAL_EGRESS_RULE)
    ENABLED = TRUE;

GRANT USAGE ON INTEGRATION {PROJECT}_EXTERNAL_ACCESS TO ROLE {SERVICE_ROLE};
```

## Step 2: Service Role Grants

The SPCS-mounted OAuth token (`/snowflake/session/token`) uses the service owner role. That role must have privileges on all objects the container connects to:

```sql
GRANT USAGE ON DATABASE {DATABASE} TO ROLE {SERVICE_ROLE};
GRANT USAGE ON SCHEMA {DATABASE}.{SCHEMA} TO ROLE {SERVICE_ROLE};
GRANT USAGE ON WAREHOUSE {WAREHOUSE} TO ROLE {SERVICE_ROLE};
GRANT SELECT ON ALL TABLES IN SCHEMA {DATABASE}.{SCHEMA} TO ROLE {SERVICE_ROLE};
GRANT SELECT ON ALL VIEWS IN SCHEMA {DATABASE}.{SCHEMA} TO ROLE {SERVICE_ROLE};

-- If multiple schemas (common: DATA_MART, CORTEX, RAW, ATOMIC)
GRANT USAGE ON SCHEMA {DATABASE}.DATA_MART TO ROLE {SERVICE_ROLE};
GRANT SELECT ON ALL TABLES IN SCHEMA {DATABASE}.DATA_MART TO ROLE {SERVICE_ROLE};
GRANT SELECT ON ALL VIEWS IN SCHEMA {DATABASE}.DATA_MART TO ROLE {SERVICE_ROLE};
GRANT USAGE ON SCHEMA {DATABASE}.CORTEX TO ROLE {SERVICE_ROLE};
```

Add these to `deploy/setup.sql` alongside the EAI creation.

## Step 3: Service Spec Environment Variables

SPCS auto-injects these -- do NOT set them in the service spec:

| Variable | Auto-Injected Value |
|----------|-------------------|
| `SNOWFLAKE_HOST` | Internal hostname for the account |
| `SNOWFLAKE_ACCOUNT` | Account identifier (org-account format, e.g., `SFSENORTHAMERICA-JURRUTIA_AWS1`) |
| `SNOWFLAKE_PORT` | Port number |

You MUST set these (not auto-injected, or auto-injected value may not match your data location):

| Variable | Example | Why |
|----------|---------|-----|
| `SNOWFLAKE_DATABASE` | `MY_PROJECT` | Auto-injected value matches where the *service* lives, which may differ from where data lives |
| `SNOWFLAKE_SCHEMA` | `CORTEX` | Same as above -- set explicitly to your data/Cortex schema |
| `SNOWFLAKE_WAREHOUSE` | `MY_PROJECT_WH` | Not auto-injected at all -- queries fail without it |

Do NOT override `SNOWFLAKE_HOST` or `SNOWFLAKE_ACCOUNT` in the service spec -- the auto-injected values are correct for container-to-Snowflake connectivity.

## Step 4: Python Connection Pattern

```python
import os
from pathlib import Path
import snowflake.connector

SPCS_TOKEN_PATH = "/snowflake/session/token"

def get_snowflake_connection():
    if Path(SPCS_TOKEN_PATH).exists():
        token = Path(SPCS_TOKEN_PATH).read_text().strip()
        return snowflake.connector.connect(
            host=os.getenv("SNOWFLAKE_HOST"),
            account=os.getenv("SNOWFLAKE_ACCOUNT"),
            authenticator="oauth",
            token=token,
            database=os.getenv("SNOWFLAKE_DATABASE"),
            schema=os.getenv("SNOWFLAKE_SCHEMA"),
            warehouse=os.getenv("SNOWFLAKE_WAREHOUSE"),
            client_session_keep_alive=True,
        )
    # Local dev fallback
    return snowflake.connector.connect(
        connection_name=os.getenv("SNOWFLAKE_CONNECTION_NAME", "default")
    )
```

Do NOT pass a `role` parameter -- the SPCS OAuth token uses the service owner role automatically. Passing a role causes authentication failures.

For token refresh on expiration (error code `390114`):

```python
def get_oauth_token() -> str:
    return Path(SPCS_TOKEN_PATH).read_text().strip()
```

## Step 5: Docker Build

SPCS requires linux/amd64 architecture. Always specify the platform:

```bash
docker build --platform linux/amd64 -t ${REGISTRY}/{IMAGE}:latest -f deploy/spcs/Dockerfile .
docker push ${REGISTRY}/{IMAGE}:latest
```

## Step 6: Service Creation

Create the service with `EXTERNAL_ACCESS_INTEGRATIONS`:

```sql
CREATE SERVICE {DB}.{SCHEMA}.{SERVICE_NAME}
    IN COMPUTE POOL {COMPUTE_POOL}
    FROM SPECIFICATION $$
spec:
  containers:
    - name: app
      image: /{DB}/{SCHEMA}/{REPO}/{IMAGE}:latest
      env:
        SNOWFLAKE_DATABASE: "{DATABASE}"
        SNOWFLAKE_SCHEMA: "{SCHEMA}"
        SNOWFLAKE_WAREHOUSE: "{WAREHOUSE}"
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
  endpoints:
    - name: app
      port: 8080
      public: true
$$
    EXTERNAL_ACCESS_INTEGRATIONS = ({PROJECT}_SF_ACCESS)
    QUERY_WAREHOUSE = {WAREHOUSE}
    MIN_INSTANCES = 1
    MAX_INSTANCES = 1;
```

Or via snow CLI:

```bash
snow spcs service create {SERVICE} \
  --compute-pool {POOL} \
  --spec-path deploy/spcs/service-spec.yaml \
  --external-access-integrations {PROJECT}_SF_ACCESS \
  -c ${CONNECTION}
```

Grant endpoint access to consumer roles:

```sql
GRANT USAGE ON SERVICE {DB}.{SCHEMA}.{SERVICE}!ALL_ENDPOINTS_USAGE TO ROLE {CONSUMER_ROLE};
```

## Step 7: Verification

```bash
# Check service status
snow spcs service status {SERVICE} -c ${CONNECTION}

# Test health endpoint
curl -sf https://{endpoint}/health

# Test Snowflake connectivity from inside the container
curl -sf https://{endpoint}/api/debug/connection
```

## Pre-Deploy Checklist

- [ ] Network rule created for `{account-identifier}.snowflakecomputing.com:443`
- [ ] External Access Integration created and granted to service role
- [ ] Service role granted USAGE on database, schemas, and warehouse
- [ ] Service role granted SELECT on required tables/views
- [ ] Service spec has `SNOWFLAKE_DATABASE`, `SNOWFLAKE_SCHEMA`, `SNOWFLAKE_WAREHOUSE` env vars
- [ ] Service spec does NOT set `SNOWFLAKE_HOST` or `SNOWFLAKE_ACCOUNT`
- [ ] Docker image built with `--platform linux/amd64`
- [ ] `EXTERNAL_ACCESS_INTEGRATIONS` included in service creation
- [ ] Endpoint grant issued for consumer roles

---

## Troubleshooting: DNS + OAuth Cascade

These three errors occur in sequence. Fix them top-down -- each masks the next.

### Error 1: DNS Resolution Failure

**Symptom:** `Failed to resolve '.snowflakecomputing.com' ([Errno -2] Name or service not known)`

**Cause:** No network rule / EAI. The container cannot resolve the Snowflake hostname.

**Fix:** Create network rule + EAI (Step 1), then recreate the service with `EXTERNAL_ACCESS_INTEGRATIONS`.

### Error 2: Service Endpoint Not Found

**Symptom:** `Could not find the service associated with endpoint <hash>-<account>.`

**Cause:** The service is not READY -- usually because the container crashed on startup due to the DNS error above.

**Fix:**
1. Resolve Error 1 first
2. Verify compute pool is ACTIVE: `snow spcs compute-pool status {POOL}`
3. Verify service reaches READY: `snow spcs service status {SERVICE}`
4. Verify endpoint is `public: true` in the service spec
5. Verify endpoint grant: `GRANT USAGE ON SERVICE {DB}.{SCHEMA}.{SERVICE}!ALL_ENDPOINTS_USAGE TO ROLE {ROLE}`

### Error 3: OAuth Token Unauthorized

**Symptom:** `Client is unauthorized to use Snowpark Container Services OAuth token.`

**Cause:** The service owner role lacks grants on the objects being accessed. The token exists (`/snowflake/session/token`) but the role can't exercise it.

**Fix:** Grant the service role privileges (Step 2). Also verify:
- `SNOWFLAKE_ACCOUNT` uses org-account format (auto-injected -- do not override)
- No `role` parameter passed in the Python connection

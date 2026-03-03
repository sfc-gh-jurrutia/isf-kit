---
title: Backend Verification Checklist
impact: HIGH
impactDescription: Prevents the most common backend performance and reliability gaps
tags: backend, checklist, performance, snowflake, spcs
---

## Backend Verification Checklist

Run this checklist after implementing the backend (Workflow Step 4). Every item must pass before presenting the backend architecture for review.

| # | Check | Pass criteria | Detailed rule |
|---|-------|---------------|---------------|
| 1 | **Connection pool** | `snowflake_conn.py` imported; `get_connection()` / `return_connection()` used in try/finally — never `snowflake.connector.connect()` per request | `sf-connection-pool.md` |
| 2 | **Persistent HTTP client** | Single `httpx.AsyncClient` reused via `_get_http_client()` — never `httpx.AsyncClient()` created per request | `sf-httpx-reuse.md` |
| 3 | **TTL cache on read endpoints** | All GET data endpoints use `cache_get()` / `cache_set()` from `backend_patterns.py` with appropriate TTLs (30-300s) | `sf-ttl-cache.md` |
| 4 | **No agent bypass** | Zero occurrences of `SNOWFLAKE.CORTEX.AGENT` or `CORTEX.COMPLETE` in API endpoints; all chat goes through `cortex_agent_service.py` REST proxy | `sf-no-sql-agent.md` |
| 5 | **`X-Accel-Buffering: no`** | SSE `StreamingResponse` includes `"X-Accel-Buffering": "no"` header (required for nginx / SPCS proxy) | — |
| 6 | **Health + warmup endpoints** | `/health` returns `{"status": "healthy"}`; `/api/agent/warmup` exercises pool (`SELECT 1`) and HTTP client | — |
| 7 | **Cached auth headers** | All Cortex API calls use `get_auth_headers_cached()` — never raw `get_auth_headers()` in endpoint handlers | — |
| 8 | **Lifespan cleanup** | `main.py` lifespan calls `close_pool()` and `await client.aclose()` on shutdown | — |

### Quick verification commands

```bash
# Check 1: No per-request connections
rg "snowflake\.connector\.connect\(" --glob "*.py" api/

# Check 2: No per-request HTTP clients
rg "httpx\.(Async)?Client\(" --glob "*.py" api/app/routers/

# Check 4: No agent bypass (SQL agent calls or raw COMPLETE in API)
rg -i "SNOWFLAKE\.CORTEX\.AGENT" --glob "*.py" --glob "*.sql"
rg -i "CORTEX\.COMPLETE" --glob "*.py" api/app/

# Check 7: No raw get_auth_headers() in handlers
rg "get_auth_headers\(\)" --glob "*.py" api/app/routers/
```

Items 1-4 have dedicated rule files with full incorrect/correct examples. Items 5-8 are verified by inspecting the `main.py` and `cortex_agent_service.py` templates.

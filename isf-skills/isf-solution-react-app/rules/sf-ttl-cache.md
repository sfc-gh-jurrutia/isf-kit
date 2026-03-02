---
title: Server-Side TTL Cache for Data Endpoints
impact: HIGH
impactDescription: Eliminates redundant Snowflake queries on refresh/multi-user
tags: cache, performance, snowflake, ttl
---

## Server-Side TTL Cache for Data Endpoints

Cache query results server-side with a time-to-live (TTL) to avoid re-executing identical Snowflake queries.

**Why it matters**: Without caching, every page load fires all API calls against Snowflake. For a dashboard with 15 endpoints, that's 15 queries per user per refresh. With TTL caching, subsequent requests within the TTL window return instantly from memory.

**Incorrect (no caching):**

```python
from snowflake_conn import get_connection, return_connection

@router.get("/api/entities")
async def list_entities():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM entities ORDER BY updated_at DESC")
        return cursor.fetchall()
    finally:
        return_connection(conn)
```

**Correct (TTL cache):**

```python
import time
import threading
from typing import Any, Optional

_cache: dict[str, dict] = {}   # key -> {"value": ..., "expires_at": float}
_cache_lock = threading.Lock()


def cache_get(key: str) -> Optional[Any]:
    with _cache_lock:
        entry = _cache.get(key)
        if entry and time.time() < entry["expires_at"]:
            return entry["value"]
        _cache.pop(key, None)
        return None


def cache_set(key: str, value: Any, ttl: int) -> None:
    with _cache_lock:
        _cache[key] = {"value": value, "expires_at": time.time() + ttl}


def cache_clear(prefix: str = "") -> int:
    """Remove entries whose key starts with prefix. Returns count removed."""
    with _cache_lock:
        keys = [k for k in _cache if k.startswith(prefix)] if prefix else list(_cache)
        for k in keys:
            del _cache[k]
        return len(keys)


# Usage in an endpoint
@router.get("/api/entities")
async def list_entities():
    cached = cache_get("entities:list")
    if cached is not None:
        return cached

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM entities ORDER BY updated_at DESC")
        rows = cursor.fetchall()
    finally:
        return_connection(conn)

    cache_set("entities:list", rows, ttl=30)
    return rows
```

**Recommended TTLs:**

| Endpoint Type | TTL | Rationale |
|---|---|---|
| List endpoints (all entities) | 30s | Data changes frequently |
| Detail bundles | 60s | Per-entity, less volatile |
| ML explanations | 120s | Expensive to compute, rarely changes |
| Agent metadata | 300s | Changes only on redeploy |

**Thread safety**: Always use `threading.Lock()` — FastAPI serves requests concurrently via thread pool.

**Cache invalidation**: For MVP, TTL-based expiry is sufficient. For production, add a `cache_clear(prefix)` function callable from admin endpoints.

---
title: Thread-Safe Snowflake Connection Pool
impact: HIGH
impactDescription: Concurrent query support + 50-200ms saved per request
tags: snowflake, connection, pool, performance, spcs
---

## Thread-Safe Snowflake Connection Pool

Use the `snowflake_conn.py` template module instead of creating connections per request.

**Why it matters**: Creating a Snowflake connection involves SSL handshake, authentication, and session setup (50-200ms). A dashboard with 10 concurrent API calls needs 10 connections served simultaneously — a singleton blocks them all behind one connection.

**Incorrect (connection per request):**

```python
from fastapi import APIRouter
import snowflake.connector

router = APIRouter()

@router.get("/api/metrics")
async def get_metrics():
    conn = snowflake.connector.connect(connection_name="default")
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM metrics")
        return cursor.fetchall()
    finally:
        conn.close()  # connection discarded — 50-200ms wasted next call
```

**Incorrect (singleton — no concurrency):**

```python
import snowflake.connector
from typing import Optional

_connection: Optional[snowflake.connector.SnowflakeConnection] = None

def get_connection() -> snowflake.connector.SnowflakeConnection:
    global _connection
    if _connection is None or _connection.is_closed():
        _connection = snowflake.connector.connect(connection_name="default")
    return _connection

# Every endpoint shares one connection — concurrent requests serialize on it,
# and if two threads use the same cursor simultaneously, results corrupt.
@router.get("/api/metrics")
async def get_metrics():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM metrics")
    return cursor.fetchall()
```

**Correct (thread-safe pool from `snowflake_conn.py` template):**

```python
import os
import time
import threading
import snowflake.connector
from typing import Optional, List

_POOL_SIZE = int(os.getenv("SF_POOL_SIZE", "8"))
_IDLE_CHECK_SECONDS = 120

_pool: List[dict] = []          # [{"conn": <SnowflakeConnection>, "last_used": <float>}]
_lock = threading.Lock()
_initialized = False


def _make_connection() -> snowflake.connector.SnowflakeConnection:
    token_path = "/snowflake/session/token"
    if os.path.exists(token_path):
        with open(token_path) as f:
            token = f.read().strip()
        return snowflake.connector.connect(
            host=os.getenv("SNOWFLAKE_HOST"),
            account=os.getenv("SNOWFLAKE_ACCOUNT"),
            token=token,
            authenticator="oauth",
            client_session_keep_alive=True,
        )
    return snowflake.connector.connect(
        connection_name="default",
        client_session_keep_alive=True,
    )


def _health_check(entry: dict) -> bool:
    """Only probe connections idle longer than _IDLE_CHECK_SECONDS."""
    if time.time() - entry["last_used"] < _IDLE_CHECK_SECONDS:
        return True
    try:
        entry["conn"].cursor().execute("SELECT 1")
        return True
    except Exception:
        return False


def get_connection() -> snowflake.connector.SnowflakeConnection:
    with _lock:
        while _pool:
            entry = _pool.pop()
            if _health_check(entry):
                return entry["conn"]
            try:
                entry["conn"].close()
            except Exception:
                pass
    return _make_connection()


def return_connection(conn: snowflake.connector.SnowflakeConnection) -> None:
    with _lock:
        if len(_pool) < _POOL_SIZE:
            _pool.append({"conn": conn, "last_used": time.time()})
        else:
            try:
                conn.close()
            except Exception:
                pass
```

**Key features:**
- `_POOL_SIZE = 8` connections (configurable via `SF_POOL_SIZE` env var)
- `threading.Lock()` for thread safety
- Lazy health check: only `SELECT 1` on connections idle >2 minutes
- `client_session_keep_alive=True` for SPCS long-lived containers
- SPCS auto-detection via `/snowflake/session/token`
- Always return connections via `return_connection()` in a `finally` block

**Usage in endpoints:**

```python
from snowflake_conn import get_connection, return_connection

@router.get("/api/metrics")
async def get_metrics():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM metrics LIMIT 100")
        return cursor.fetchall()
    finally:
        return_connection(conn)
```

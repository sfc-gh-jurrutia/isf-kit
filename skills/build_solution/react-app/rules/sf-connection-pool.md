---
title: Reuse Snowflake Connections
impact: HIGH
impactDescription: 50-200ms saved per request
tags: snowflake, connection, pool, performance
---

## Reuse Snowflake Connections

Maintain a connection pool instead of creating new Snowflake connections per request.

**Why it matters**: Creating a Snowflake connection involves SSL handshake, authentication, and session setup—typically 50-200ms overhead. For a dashboard with 10 API calls, this adds 0.5-2 seconds of latency.

**Incorrect (connection per request):**

```python
from fastapi import APIRouter
import snowflake.connector

router = APIRouter()

@router.get("/api/metrics")
async def get_metrics():
    # Creates new connection every request - 50-200ms overhead
    conn = snowflake.connector.connect(
        connection_name="default"
    )
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM metrics")
        return cursor.fetchall()
    finally:
        conn.close()  # Connection discarded
```

**Correct (connection pool):**

```python
from fastapi import APIRouter, Depends
import snowflake.connector
from contextlib import asynccontextmanager
from typing import Optional

class SnowflakePool:
    def __init__(self, connection_name: str = "default"):
        self.connection_name = connection_name
        self._connection: Optional[snowflake.connector.SnowflakeConnection] = None
    
    def get_connection(self) -> snowflake.connector.SnowflakeConnection:
        if self._connection is None or self._connection.is_closed():
            self._connection = snowflake.connector.connect(
                connection_name=self.connection_name
            )
        return self._connection
    
    def close(self):
        if self._connection and not self._connection.is_closed():
            self._connection.close()
            self._connection = None

# Singleton pool
_pool: Optional[SnowflakePool] = None

def get_pool() -> SnowflakePool:
    global _pool
    if _pool is None:
        _pool = SnowflakePool()
    return _pool

# FastAPI lifespan for cleanup
@asynccontextmanager
async def lifespan(app):
    yield
    if _pool:
        _pool.close()

# Usage in endpoint
@router.get("/api/metrics")
async def get_metrics(pool: SnowflakePool = Depends(get_pool)):
    conn = pool.get_connection()  # Reuses existing connection
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM metrics")
    return cursor.fetchall()
```

**For high-concurrency apps:**

Use `snowflake-connector-python`'s built-in connection pooling:

```python
import snowflake.connector
from snowflake.connector import pooling

# Create connection pool
pool = pooling.ConnectionPool(
    connection_name="default",
    pool_size=5,
    max_overflow=10,
)

def get_connection():
    return pool.getconn()

def return_connection(conn):
    pool.putconn(conn)
```

**Snowflake-specific notes**:
- Default session timeout is 4 hours; connections auto-reconnect
- Use `conn.is_closed()` to check connection state before reuse
- Set `CLIENT_SESSION_KEEP_ALIVE=true` for long-running apps

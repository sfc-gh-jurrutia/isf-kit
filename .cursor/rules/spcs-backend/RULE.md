---
description: FastAPI backend patterns for SPCS with dual database connections
globs: ["backend/**/*.py"]
---

# SPCS Backend Rules (FastAPI)

This rule enforces patterns for the FastAPI backend running in Snowpark Container Services (SPCS).

## Dual Database Connection Pattern

The backend maintains connections to TWO distinct data zones:

| Zone | Database | Library | Connection Type | Use Case |
|------|----------|---------|-----------------|----------|
| Zone A | Snowflake Postgres | `asyncpg` | Async | App state, CRUD, sessions |
| Zone B | Snowflake OLAP | `snowflake-snowpark-python` | Sync (blocking) | Analytics, Cortex AI |

## Connection Setup Pattern

### Zone A: Postgres (Async)

```python
# backend/db/postgres.py
from asyncpg import create_pool
from contextlib import asynccontextmanager

class PostgresPool:
    def __init__(self):
        self.pool = None

    async def init(self, dsn: str):
        self.pool = await create_pool(
            dsn,
            min_size=5,
            max_size=20,
            command_timeout=60
        )

    async def close(self):
        if self.pool:
            await self.pool.close()

    @asynccontextmanager
    async def connection(self):
        async with self.pool.acquire() as conn:
            yield conn

postgres = PostgresPool()
```

### Zone B: Snowpark (Sync with Threadpool)

```python
# backend/db/snowpark.py
from snowflake.snowpark import Session
from functools import lru_cache

@lru_cache(maxsize=1)
def get_snowpark_session() -> Session:
    """
    Returns a cached Snowpark session.
    Snowpark sessions are NOT async - use run_in_threadpool for all operations.
    """
    return Session.builder.configs({
        "account": os.environ["SNOWFLAKE_ACCOUNT"],
        "user": os.environ["SNOWFLAKE_USER"],
        "password": os.environ["SNOWFLAKE_PASSWORD"],
        "warehouse": os.environ["SNOWFLAKE_WAREHOUSE"],
        "database": os.environ["SNOWFLAKE_DATABASE"],
        "schema": os.environ["SNOWFLAKE_SCHEMA"],
    }).create()
```

## Critical Pattern: run_in_threadpool for Snowpark

Snowpark operations are **blocking**. Running them directly in async endpoints will block the event loop.

**ALWAYS** wrap Snowpark calls with `run_in_threadpool`:

```python
# backend/api/analytics.py
from fastapi import APIRouter
from fastapi.concurrency import run_in_threadpool
from backend.db.snowpark import get_snowpark_session

router = APIRouter()

@router.get("/analytics/summary")
async def get_analytics_summary(start_date: str, end_date: str):
    # CORRECT: Snowpark call wrapped in threadpool
    result = await run_in_threadpool(
        _fetch_summary_sync,
        start_date,
        end_date
    )
    return result

def _fetch_summary_sync(start_date: str, end_date: str) -> dict:
    """Synchronous function for Snowpark operations."""
    session = get_snowpark_session()
    df = session.sql(f"""
        SELECT 
            COUNT(*) as total_records,
            SUM(amount) as total_amount
        FROM analytics.fact_transactions
        WHERE transaction_date BETWEEN '{start_date}' AND '{end_date}'
    """)
    return df.to_pandas().to_dict(orient="records")[0]
```

## Anti-Patterns to AVOID

### ❌ DO NOT: Call Snowpark directly in async functions

```python
# BAD - blocks the event loop!
@router.get("/data")
async def get_data():
    session = get_snowpark_session()
    df = session.table("my_table")  # BLOCKING CALL
    return df.to_pandas().to_dict()
```

### ❌ DO NOT: Mix Postgres and Snowpark in same transaction

```python
# BAD - these are separate systems, no shared transactions
async def bad_operation():
    async with postgres.connection() as pg_conn:
        await pg_conn.execute("INSERT INTO logs ...")
        # Can't rollback Snowpark if this fails
        session = get_snowpark_session()
        session.sql("INSERT INTO warehouse ...").collect()
```

### ✅ DO: Use separate, independent operations

```python
# GOOD - explicit separation
async def good_operation(data: dict):
    # Step 1: Zone A (Postgres) - transactional
    async with postgres.connection() as conn:
        await conn.execute("INSERT INTO app_state ...")
    
    # Step 2: Zone B (OLAP) - analytical, fire-and-forget or with retry
    try:
        await run_in_threadpool(_write_to_warehouse, data)
    except Exception as e:
        # Log and continue - OLAP writes can be eventually consistent
        logger.warning(f"OLAP write deferred: {e}")
```

## API Endpoint Patterns

### CRUD Operations → Zone A (Postgres)

```python
@router.post("/users")
async def create_user(user: UserCreate):
    async with postgres.connection() as conn:
        row = await conn.fetchrow(
            "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
            user.name, user.email
        )
        return dict(row)
```

### Analytics Queries → Zone B (Snowpark)

```python
@router.get("/reports/sales")
async def get_sales_report(year: int):
    return await run_in_threadpool(_generate_sales_report, year)

def _generate_sales_report(year: int) -> list[dict]:
    session = get_snowpark_session()
    df = session.sql(f"""
        SELECT region, SUM(revenue) as total_revenue
        FROM analytics.sales
        WHERE YEAR(sale_date) = {year}
        GROUP BY region
    """)
    return df.to_pandas().to_dict(orient="records")
```

## Dependency Injection Pattern

```python
# backend/core/dependencies.py
from fastapi import Depends
from fastapi.concurrency import run_in_threadpool
from typing import Annotated

async def get_postgres():
    async with postgres.connection() as conn:
        yield conn

async def get_snowpark():
    """Yields a callable that wraps sync Snowpark ops in threadpool."""
    session = get_snowpark_session()
    
    async def execute_snowpark(func, *args, **kwargs):
        return await run_in_threadpool(func, session, *args, **kwargs)
    
    yield execute_snowpark

PostgresConn = Annotated[asyncpg.Connection, Depends(get_postgres)]
SnowparkExecutor = Annotated[callable, Depends(get_snowpark)]
```

## Environment Variables (SPCS)

In SPCS, credentials are injected via environment:

```python
# Required environment variables
POSTGRES_DSN = os.environ["POSTGRES_DSN"]  # Zone A
SNOWFLAKE_ACCOUNT = os.environ["SNOWFLAKE_ACCOUNT"]  # Zone B
SNOWFLAKE_USER = os.environ["SNOWFLAKE_USER"]
SNOWFLAKE_PASSWORD = os.environ["SNOWFLAKE_PASSWORD"]
SNOWFLAKE_WAREHOUSE = os.environ["SNOWFLAKE_WAREHOUSE"]
SNOWFLAKE_DATABASE = os.environ["SNOWFLAKE_DATABASE"]
SNOWFLAKE_SCHEMA = os.environ["SNOWFLAKE_SCHEMA"]
```

"""
FastAPI Application Skeleton for ISF Solutions

Wires together the three backend template modules:
  - snowflake_conn: Thread-safe connection pool
  - backend_patterns: TTL cache, row serialization, metadata introspection
  - cortex_agent_service: Cortex Agent REST API proxy with SSE streaming

Provides:
  - Lifespan management (pool + HTTP client cleanup on shutdown)
  - CORS middleware pre-configured for Vite dev proxy
  - /health liveness probe
  - /api/agent/warmup readiness probe (pool + HTTP client verification)
  - Cortex Agent router mounted at /api/agent

Usage:
    Copy this file to api/app/main.py and add domain-specific routers.

    uvicorn main:app --host 0.0.0.0 --port 8000
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from snowflake_conn import get_connection, return_connection, close_pool
from cortex_agent_service import router as agent_router, _get_http_client

logger = logging.getLogger(__name__)

# ============================================================================
# Lifespan
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up — connection pool and HTTP client will be created on first use")
    yield
    close_pool()
    client = _get_http_client()
    if client and not client.is_closed:
        await client.aclose()
    logger.info("Shutdown complete — pool closed, HTTP client closed")


# ============================================================================
# App
# ============================================================================

app = FastAPI(
    title="ISF Solution API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Cortex Agent router
# ============================================================================

app.include_router(agent_router, prefix="/api/agent")


# ============================================================================
# Health & Warmup
# ============================================================================

@app.get("/health")
def health():
    """Liveness probe. Returns 200 if the process is up."""
    return {"status": "healthy"}


@app.get("/api/agent/warmup")
def warmup():
    """
    Readiness probe. Exercises the Snowflake connection pool and
    pre-initializes the HTTP client so the first real request is fast.
    """
    conn = None
    try:
        conn = get_connection()
        conn.cursor().execute("SELECT 1")
        _get_http_client()
        return {"status": "warm"}
    except Exception as e:
        logger.warning("Warmup check failed: %s", e)
        return {"status": "cold", "error": str(e)}
    finally:
        return_connection(conn)


# ============================================================================
# Domain routers — add your solution-specific endpoints below
# ============================================================================

# Example:
#
# from routers import entities
# app.include_router(entities.router, prefix="/api")
#
# See backend_patterns.py for detail-bundle, TTL cache, and serialization
# helpers to use inside your domain routers.

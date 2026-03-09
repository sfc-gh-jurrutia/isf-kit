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
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Load api/.env for local dev; SPCS container env vars take precedence.
load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=False)

from app.snowflake_conn import get_connection, return_connection, close_pool
from app.cortex_agent_service import router as agent_router, _get_http_client

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

@app.get("/")
def root():
    """Informational root route.

    In SPCS, nginx serves the React SPA at / and proxies /api/* to FastAPI.
    In local dev, Vite serves the frontend on :3000 and proxies /api/* to :8000.
    If you see this JSON response, you're hitting FastAPI directly — the frontend
    is served by nginx (SPCS) or Vite (local dev), not by FastAPI.
    """
    return {
        "service": "ISF Solution API",
        "docs": "/docs",
        "health": "/health",
        "note": "Frontend is served by nginx (SPCS) or Vite dev server (local). Hit port 8080 (SPCS) or 3000 (local) for the UI.",
    }


@app.get("/health")
def health():
    """Liveness probe. Returns 200 if the process is up."""
    return {"status": "healthy"}


def _ready_errors() -> list[str]:
    """Collect dependency-aware readiness failures."""
    errors: list[str] = []

    if not os.getenv("CORTEX_AGENT_DATABASE"):
        errors.append("missing CORTEX_AGENT_DATABASE")
    if not os.getenv("CORTEX_AGENT_SCHEMA"):
        errors.append("missing CORTEX_AGENT_SCHEMA")

    persona_envs = [key for key in os.environ if key.startswith("CORTEX_AGENT_PERSONA_")]
    if not persona_envs and not os.getenv("CORTEX_AGENT_NAME"):
        errors.append("missing CORTEX_AGENT_PERSONA_{PERSONA} mappings or CORTEX_AGENT_NAME")

    is_spcs = Path("/snowflake/session/token").exists()
    if is_spcs:
        for key in ("SNOWFLAKE_DATABASE", "SNOWFLAKE_SCHEMA", "SNOWFLAKE_WAREHOUSE"):
            if not os.getenv(key):
                errors.append(f"missing {key}")
    elif not os.getenv("SNOWFLAKE_CONNECTION_NAME"):
        errors.append("missing SNOWFLAKE_CONNECTION_NAME for local development")

    conn = None
    try:
        conn = get_connection()
        conn.cursor().execute("SELECT 1")
    except Exception as exc:
        errors.append(f"snowflake: {exc}")
    finally:
        return_connection(conn)

    try:
        _get_http_client()
    except Exception as exc:
        errors.append(f"http_client: {exc}")

    return errors


@app.get("/ready")
def ready():
    """
    Dependency-aware readiness probe.

    Returns 200 only when the runtime env contract is present and the app can
    successfully exercise the Snowflake pool and HTTP client.
    """
    errors = _ready_errors()
    if errors:
        return JSONResponse(status_code=503, content={"status": "not_ready", "errors": errors})
    return {"status": "ready"}


@app.get("/api/agent/warmup")
def warmup():
    """
    Readiness probe. Exercises the Snowflake connection pool and
    pre-initializes the HTTP client so the first real request is fast.
    """
    errors = _ready_errors()
    if errors:
        logger.warning("Warmup check failed: %s", errors)
        return JSONResponse(status_code=503, content={"status": "cold", "errors": errors})
    return {"status": "warm"}


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

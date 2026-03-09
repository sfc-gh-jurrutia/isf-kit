"""
Backend Patterns - Industry-agnostic utilities for ISF solution backends

Reusable building blocks extracted from production ISF deployments:
  - Thread-safe TTL cache
  - Row serialization (datetime, NaN handling)
  - Agent metadata introspection via DESCRIBE AGENT
  - Recommended TTL constants
  - Documented endpoint patterns (detail bundle, health, warmup)

These are meant to be imported directly or copy-adapted per project.

Usage:
    from backend_patterns import cache_get, cache_set, serialize_row, TTL_DETAIL
"""

import math
import time
import logging
import threading
from datetime import date, datetime
from typing import Any, Optional

logger = logging.getLogger(__name__)

# ============================================================================
# Recommended TTL constants (seconds)
# ============================================================================

TTL_LIST = 30        # List endpoints (e.g., all entities)
TTL_DETAIL = 60      # Detail/bundle endpoints
TTL_ML = 120         # ML explanations (expensive to compute)
TTL_METADATA = 300   # Agent metadata (rarely changes)

# ============================================================================
# Thread-safe TTL cache
# ============================================================================

_cache: dict[str, tuple[float, Any]] = {}
_cache_lock = threading.Lock()


def cache_get(key: str, ttl: int = 60) -> Optional[Any]:
    """
    Retrieve a value from the TTL cache.

    Returns the cached value if it exists and was written within the last
    *ttl* seconds; otherwise returns None.
    """
    with _cache_lock:
        entry = _cache.get(key)
        if entry and (time.time() - entry[0]) < ttl:
            return entry[1]
        return None


def cache_set(key: str, value: Any) -> None:
    """Store a value in the TTL cache with the current timestamp."""
    with _cache_lock:
        _cache[key] = (time.time(), value)


def cache_invalidate(key: str) -> None:
    """Remove a specific key from the cache."""
    with _cache_lock:
        _cache.pop(key, None)


def cache_clear() -> None:
    """Flush the entire cache."""
    with _cache_lock:
        _cache.clear()


# ============================================================================
# Row serialization
# ============================================================================

def serialize_row(columns: list[str], row: tuple | list) -> dict[str, Any]:
    """
    Convert a DB cursor row into a JSON-safe dictionary.

    Handles:
      - datetime/date  -> ISO-8601 string
      - float NaN/Inf  -> 0
      - None           -> None (passed through)
    """
    result: dict[str, Any] = {}
    for col, val in zip(columns, row):
        if isinstance(val, (datetime, date)):
            result[col] = val.isoformat()
        elif isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
            result[col] = 0
        else:
            result[col] = val
    return result


# ============================================================================
# Agent metadata introspection
# ============================================================================

def get_agent_metadata(agent_name: str, database: str, schema: str) -> dict:
    """
    Run DESCRIBE AGENT and parse into structured metadata.

    Requires an active Snowflake connection from the pool. Returns a dict
    with keys: name, description, model, tools, dataSources, routingStrategy.
    """
    from app.snowflake_conn import get_connection, return_connection

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(f"DESCRIBE AGENT {database}.{schema}.{agent_name}")
        rows = cursor.fetchall()
        columns = [desc[0].lower() for desc in cursor.description]

        metadata: dict[str, Any] = {
            "name": agent_name,
            "description": "",
            "model": "",
            "tools": [],
            "dataSources": [],
            "routingStrategy": "",
        }

        for row in rows:
            row_dict = dict(zip(columns, row))
            prop = row_dict.get("property", "")
            value = row_dict.get("value", "")

            if prop == "DESCRIPTION":
                metadata["description"] = value
            elif prop == "MODEL":
                metadata["model"] = value
            elif prop == "ROUTING_STRATEGY":
                metadata["routingStrategy"] = value
            elif prop in ("TOOL", "TOOLS"):
                metadata["tools"].append(value)
            elif prop in ("DATA_SOURCE", "DATA_SOURCES"):
                metadata["dataSources"].append(value)

        return metadata
    finally:
        return_connection(conn)


# ============================================================================
# Endpoint patterns (documented examples — not runnable as-is)
# ============================================================================

# ---------------------------------------------------------------------------
# Pattern: Detail bundle — single connection, multiple queries, one response
# ---------------------------------------------------------------------------
#
# @app.get("/api/{entity_type}/{entity_id}/detail-bundle")
# def get_detail_bundle(entity_id: str):
#     """
#     Fetch all data needed to render an entity detail page in a single
#     round-trip from the frontend. Uses the TTL cache to avoid redundant
#     Snowflake queries for recently-viewed entities.
#     """
#     cached = cache_get(f"bundle:{entity_id}", ttl=TTL_DETAIL)
#     if cached:
#         return cached
#
#     conn = get_connection()
#     result = {}
#     try:
#         cursor = conn.cursor()
#
#         # Query 1: entity header
#         cursor.execute("SELECT ... WHERE id = %s", (entity_id,))
#         result["header"] = serialize_row(
#             [d[0] for d in cursor.description], cursor.fetchone()
#         )
#
#         # Query 2: related metrics
#         cursor.execute("SELECT ... WHERE entity_id = %s", (entity_id,))
#         cols = [d[0] for d in cursor.description]
#         result["metrics"] = [serialize_row(cols, r) for r in cursor.fetchall()]
#
#         # Query N: ...additional queries as needed...
#
#         cache_set(f"bundle:{entity_id}", result)
#     finally:
#         return_connection(conn)
#
#     return result

# ---------------------------------------------------------------------------
# Pattern: Health and warmup endpoints
# ---------------------------------------------------------------------------
#
# @app.get("/health")
# def health():
#     """
#     Liveness probe.  Returns 200 if the process is up.
#     Kubernetes / SPCS uses this to decide whether to restart the container.
#     """
#     return {"status": "healthy"}
#
#
# @app.get("/api/agent/warmup")
# def warmup():
#     """
#     Readiness probe.  Verifies the Snowflake connection pool can issue a
#     query.  Called by load balancers before routing traffic to this replica.
#     """
#     conn = get_connection()
#     try:
#         conn.cursor().execute("SELECT 1")
#         return {"status": "warm", "pool_size": len(_pool)}
#     except Exception as e:
#         return {"status": "cold", "error": str(e)}
#     finally:
#         return_connection(conn)

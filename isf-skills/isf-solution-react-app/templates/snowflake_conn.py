"""
Snowflake Connection Pool - Thread-safe connection management

Provides a lightweight connection pool for Snowflake that works in both
SPCS (Snowpark Container Services) and local development environments.

Pool pattern:
    Connections are pre-created up to _POOL_SIZE and stored in a list
    guarded by a threading.Lock. get_connection() pops a connection off
    the pool (or creates a new one if the pool is empty). When done,
    call return_connection(conn) to push it back. A lazy health check
    runs SELECT 1 only when a connection has been idle longer than
    _HEALTH_CHECK_INTERVAL seconds, avoiding unnecessary round-trips.

Auth detection:
    If /snowflake/session/token exists (SPCS environment), the pool
    uses OAuth with the token read from that file. Otherwise it falls
    back to connection_name-based auth from ~/.snowflake/connections.toml.

Usage:
    from app.snowflake_conn import get_connection, return_connection

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT CURRENT_WAREHOUSE()")
        result = cursor.fetchone()
    finally:
        return_connection(conn)
"""

import os
import time
import logging
import threading
from pathlib import Path
from typing import Optional

import snowflake.connector

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Pool configuration
# ---------------------------------------------------------------------------

_POOL_SIZE = 8
_HEALTH_CHECK_INTERVAL = 120  # seconds idle before we verify with SELECT 1

_pool: list[snowflake.connector.SnowflakeConnection] = []
_pool_lock = threading.Lock()
_last_returned: dict[int, float] = {}  # id(conn) -> timestamp of last return

# ---------------------------------------------------------------------------
# Environment / defaults
# ---------------------------------------------------------------------------

_SPCS_TOKEN_PATH = "/snowflake/session/token"

SNOWFLAKE_HOST = os.getenv("SNOWFLAKE_HOST", "")
SNOWFLAKE_ACCOUNT = os.getenv("SNOWFLAKE_ACCOUNT", "")
SNOWFLAKE_DATABASE = os.getenv("SNOWFLAKE_DATABASE", "MY_DB")
SNOWFLAKE_SCHEMA = os.getenv("SNOWFLAKE_SCHEMA", "PUBLIC")
SNOWFLAKE_WAREHOUSE = os.getenv("SNOWFLAKE_WAREHOUSE", "COMPUTE_WH")
SNOWFLAKE_CONNECTION_NAME = os.getenv("SNOWFLAKE_CONNECTION_NAME", "default")

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _is_spcs() -> bool:
    """Detect if running inside Snowpark Container Services."""
    return Path(_SPCS_TOKEN_PATH).exists()


def _read_spcs_token() -> str:
    """Read the OAuth token mounted by SPCS."""
    return Path(_SPCS_TOKEN_PATH).read_text().strip()


def _create_connection() -> snowflake.connector.SnowflakeConnection:
    """
    Create a single Snowflake connection using the appropriate auth method.

    SPCS: reads the mounted OAuth token and connects with authenticator="oauth".
    Local: delegates to connection_name in ~/.snowflake/connections.toml.
    """
    if _is_spcs():
        token = _read_spcs_token()
        conn = snowflake.connector.connect(
            host=SNOWFLAKE_HOST,
            account=SNOWFLAKE_ACCOUNT,
            token=token,
            authenticator="oauth",
            database=SNOWFLAKE_DATABASE,
            schema=SNOWFLAKE_SCHEMA,
            warehouse=SNOWFLAKE_WAREHOUSE,
            client_session_keep_alive=True,
        )
        logger.info("Created SPCS connection (OAuth)")
    else:
        conn = snowflake.connector.connect(
            connection_name=SNOWFLAKE_CONNECTION_NAME,
            database=SNOWFLAKE_DATABASE,
            schema=SNOWFLAKE_SCHEMA,
            warehouse=SNOWFLAKE_WAREHOUSE,
            client_session_keep_alive=True,
        )
        logger.info("Created local connection via connections.toml (%s)", SNOWFLAKE_CONNECTION_NAME)

    return conn


def _is_healthy(conn: snowflake.connector.SnowflakeConnection) -> bool:
    """
    Lazy health check: only probe connections that have been idle longer
    than _HEALTH_CHECK_INTERVAL. Recently-returned connections are assumed
    healthy, saving a round-trip.
    """
    idle_since = _last_returned.get(id(conn), 0)
    if (time.time() - idle_since) < _HEALTH_CHECK_INTERVAL:
        return True
    try:
        conn.cursor().execute("SELECT 1")
        return True
    except Exception:
        logger.warning("Connection health check failed, discarding")
        try:
            conn.close()
        except Exception:
            pass
        return False


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_connection() -> snowflake.connector.SnowflakeConnection:
    """
    Acquire a Snowflake connection from the pool.

    Pops the most-recently-returned connection and verifies it with a lazy
    health check. If the pool is empty, creates a fresh connection.

    Always pair with return_connection() in a try/finally block.
    """
    with _pool_lock:
        while _pool:
            conn = _pool.pop()
            if _is_healthy(conn):
                return conn
    return _create_connection()


def return_connection(conn: Optional[snowflake.connector.SnowflakeConnection]) -> None:
    """
    Return a connection to the pool for reuse.

    If the pool is already at capacity the connection is closed instead.
    Passing None is a safe no-op.
    """
    if conn is None:
        return
    with _pool_lock:
        if len(_pool) < _POOL_SIZE:
            _last_returned[id(conn)] = time.time()
            _pool.append(conn)
        else:
            try:
                conn.close()
            except Exception:
                pass


def close_pool() -> None:
    """Close all connections in the pool (call on shutdown)."""
    with _pool_lock:
        for conn in _pool:
            try:
                conn.close()
            except Exception:
                pass
        _pool.clear()
        _last_returned.clear()
        logger.info("Connection pool closed")

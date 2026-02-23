"""Snowflake connectivity service template.

Copy into your project's backend/services/ directory and customize the
connection name to match your Snowflake CLI profile.

Usage:
    service = SnowflakeService()
    rows = service.execute_query("SELECT * FROM RAW.MY_TABLE LIMIT 10")
"""

import os
from contextlib import contextmanager
from typing import Any

import snowflake.connector
from snowflake.connector import DictCursor


class SnowflakeService:
    """Wraps Snowflake connectivity for demo backends.

    Always connects via connection_name (CLI profile). Never hardcode credentials.
    """

    def __init__(self, connection_name: str | None = None) -> None:
        self.connection_name = connection_name or os.getenv(
            "SNOWFLAKE_CONNECTION_NAME", "demo"
        )

    @contextmanager
    def get_connection(self):
        """Yield a Snowflake connection, closing it on exit."""
        conn = snowflake.connector.connect(connection_name=self.connection_name)
        try:
            yield conn
        finally:
            conn.close()

    def execute_query(self, sql: str, params: dict | None = None) -> list[dict]:
        """Execute SQL and return results as a list of dicts."""
        with self.get_connection() as conn:
            cursor = conn.cursor(DictCursor)
            try:
                cursor.execute(sql, params)
                return cursor.fetchall()
            finally:
                cursor.close()

    def execute_scalar(self, sql: str, params: dict | None = None) -> Any:
        """Execute SQL and return the first column of the first row, or None."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                cursor.execute(sql, params)
                row = cursor.fetchone()
                return row[0] if row else None
            finally:
                cursor.close()

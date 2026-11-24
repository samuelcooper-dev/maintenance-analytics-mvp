"""
Central Neon/PostgreSQL connection for TrueSignal.

All backend modules import get_conn() or get_db() from here.
DATABASE_URL is loaded from .env (or the real environment in production).

Uses a ThreadedConnectionPool so connections are reused across requests
instead of opening a new TCP+TLS handshake on every API call.
"""
import os
from contextlib import contextmanager

import psycopg2
import psycopg2.extras
import psycopg2.pool
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set. Add it to .env")

# Lazy-initialized connection pool (created on first use)
_pool = None


def _get_pool():
    """Get or create the connection pool. Lazy initialization prevents startup crashes."""
    global _pool
    if _pool is None:
        try:
            _pool = psycopg2.pool.ThreadedConnectionPool(
                2, 10,  # min 2, max 10 connections
                DATABASE_URL,
                cursor_factory=psycopg2.extras.RealDictCursor,
            )
        except psycopg2.OperationalError as e:
            # More helpful error message for quota issues
            if "exceeded the data transfer quota" in str(e):
                raise RuntimeError(
                    "Neon database has exceeded data transfer quota. "
                    "Check your Neon dashboard and consider upgrading your plan or waiting for quota reset."
                ) from e
            raise
    return _pool


class _PooledConnection:
    """Wraps a psycopg2 connection so conn.close() returns it to the pool."""
    def __init__(self, conn):
        self._conn = conn

    def close(self):
        try:
            if not self._conn.closed:
                self._conn.rollback()  # clean state before returning
        except (psycopg2.OperationalError, psycopg2.InterfaceError) as e:
            # Connection already closed or invalid - safe to ignore
            pass
        _get_pool().putconn(self._conn)

    def __getattr__(self, name):
        return getattr(self._conn, name)


def _get_live_conn():
    """Get a connection from the pool, replacing it if Neon has closed it."""
    pool = _get_pool()
    conn = pool.getconn()
    try:
        conn.cursor().execute("SELECT 1")
    except (psycopg2.OperationalError, psycopg2.InterfaceError):
        # Stale connection — discard and open a fresh one
        try:
            pool.putconn(conn, close=True)
        except (psycopg2.OperationalError, psycopg2.InterfaceError):
            # Already closed, safe to ignore
            pass
        conn = psycopg2.connect(
            DATABASE_URL,
            cursor_factory=psycopg2.extras.RealDictCursor,
        )
    return conn


def get_conn():
    """Get a pooled connection. Call conn.close() to return it to the pool."""
    return _PooledConnection(_get_live_conn())


@contextmanager
def get_db():
    """
    Context manager: commits on clean exit, rolls back on exception,
    always returns connection to pool.

    Usage:
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT 1")
    """
    conn = _get_live_conn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        try:
            conn.rollback()  # ensure clean state
        except (psycopg2.OperationalError, psycopg2.InterfaceError):
            # Connection already closed, safe to ignore
            pass
        _get_pool().putconn(conn)

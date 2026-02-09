"""Shared database utilities and definitions for Twilightio."""

from __future__ import annotations

import logging
import sqlite3
import threading
from contextlib import contextmanager
from typing import Any, Dict, Generator, Iterable, Optional, Sequence

# Configure logging once for all database modules
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api.database")


class DatabaseError(Exception):
    """Raised when a database operation fails."""


class SQLQueries:
    """Constants for SQL queries to improve maintainability."""

    # User queries
    CREATE_USER = (
        "INSERT INTO users (google_id, email, name, avatar_url) VALUES (?, ?, ?, ?)"
    )

    GET_USER_BY_GOOGLE_ID = (
        "SELECT id, google_id, email, name, avatar_url, created_at, last_login "
        "FROM users WHERE google_id = ?"
    )

    GET_USER_BY_ID = (
        "SELECT id, google_id, username, email, name, avatar_url, password_hash, "
        "created_at, last_login "
        "FROM users WHERE id = ?"
    )

    UPSERT_USER = (
        "INSERT INTO users (google_id, email, name, avatar_url) "
        "VALUES (?, ?, ?, ?) "
        "ON CONFLICT(google_id) DO UPDATE SET "
        "  email=COALESCE(excluded.email, users.email), "
        "  name=COALESCE(excluded.name, users.name), "
        "  avatar_url=COALESCE(excluded.avatar_url, users.avatar_url), "
        "  last_login=CURRENT_TIMESTAMP"
    )

    # Goals queries
    GET_GOALS_BY_USER = (
        "SELECT id, user_id, title, description, frequency_per_week, frequency_type, "
        "       target_count, custom_days, completed, streak, period_start, "
        "       last_completed_date, created_at, updated_at "
        "FROM goals WHERE user_id = ? ORDER BY created_at DESC"
    )

    GET_GOAL_BY_ID = (
        "SELECT id, user_id, title, description, frequency_per_week, frequency_type, "
        "       target_count, custom_days, completed, streak, period_start, "
        "       last_completed_date, created_at, updated_at "
        "FROM goals WHERE id = ? AND user_id = ?"
    )

    # Mood entries queries
    GET_USER_ENTRY_DATES = (
        "SELECT DISTINCT date FROM mood_entries WHERE user_id = ? ORDER BY date DESC"
    )

    GET_MOOD_STATISTICS = (
        "SELECT "
        "  COUNT(*) as total_entries, "
        "  AVG(mood) as average_mood, "
        "  MIN(mood) as lowest_mood, "
        "  MAX(mood) as highest_mood, "
        "  MIN(date) as first_entry_date, "
        "  MAX(date) as last_entry_date "
        "FROM mood_entries WHERE user_id = ?"
    )


# Module-level write lock shared across all instances within a process.
# Serializes write transactions to prevent intra-process contention
# (e.g. DaylioImportService's ThreadPoolExecutor running alongside requests).
_write_lock = threading.Lock()


class DatabaseConnectionMixin:
    """Provides connection helpers shared across database mixins."""

    db_path: str

    def _connect(self) -> sqlite3.Connection:
        """Create a SQLite connection with safe defaults and timeout."""
        try:
            # Add connection timeout to prevent indefinite blocking
            conn = sqlite3.connect(self.db_path, timeout=30.0)
            conn.execute("PRAGMA foreign_keys=ON")
            # Set busy timeout for when database is locked by another process
            conn.execute("PRAGMA busy_timeout=30000")
            # WAL allows concurrent reads while a write is in progress
            conn.execute("PRAGMA journal_mode=WAL")
            return conn
        except sqlite3.Error as exc:  # pragma: no cover - rare failure
            logger.error("Failed to connect to database: %s", exc)
            raise DatabaseError(f"Database connection failed: {exc}") from exc

    @contextmanager
    def _conn(self) -> Generator[sqlite3.Connection, None, None]:
        """Context manager providing a connection with row_factory pre-set."""
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            yield conn

    def _query(
        self,
        sql: str,
        params: Sequence[Any] = (),
        *,
        commit: bool = False,
    ) -> sqlite3.Cursor:
        """Execute SQL and return the cursor.

        Automatically sets ``row_factory = sqlite3.Row`` on the connection so
        that rows are returned as dict-like ``sqlite3.Row`` objects.

        Args:
            sql: The SQL statement to execute.
            params: Positional bind parameters.
            commit: When ``True`` the transaction is committed after execution.
        """
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(sql, params)
            if commit:
                conn.commit()
            return cursor

    @contextmanager
    def _write_transaction(self) -> Generator[sqlite3.Connection, None, None]:
        """Context manager for serialized write transactions.

        Acquires the module-level write lock, then opens a connection with
        ``BEGIN IMMEDIATE`` so SQLite's reserved lock is taken upfront.
        Commits on clean exit, rolls back on exception.
        """
        with _write_lock:
            conn = self._connect()
            conn.row_factory = sqlite3.Row
            try:
                conn.execute("BEGIN IMMEDIATE")
                yield conn
                conn.commit()
            except Exception:
                conn.rollback()
                raise
            finally:
                conn.close()


__all__ = [
    "DatabaseConnectionMixin",
    "DatabaseError",
    "SQLQueries",
    "logger",
]

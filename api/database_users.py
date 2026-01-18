"""User management helpers."""

from __future__ import annotations

import sqlite3
from typing import Dict, Optional

try:  # pragma: no cover - support script imports
    from .database_common import DatabaseConnectionMixin, SQLQueries
except ImportError:  # pragma: no cover
    from database_common import DatabaseConnectionMixin, SQLQueries  # type: ignore


class UsersMixin(DatabaseConnectionMixin):
    """CRUD helpers for user records."""

    def create_user(
        self,
        google_id: str,
        email: str,
        name: str,
        avatar_url: Optional[str] = None,
    ) -> int:
        with self._connect() as conn:
            cursor = conn.execute(
                SQLQueries.CREATE_USER,
                (google_id, email, name, avatar_url),
            )
            conn.commit()
            return int(cursor.lastrowid or 0)

    def get_user_by_google_id(self, google_id: str) -> Optional[Dict]:
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(SQLQueries.GET_USER_BY_GOOGLE_ID, (google_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def get_user_by_id(self, user_id: int) -> Optional[Dict]:
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(SQLQueries.GET_USER_BY_ID, (user_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def update_user_last_login(self, user_id: int) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                UPDATE users
                   SET last_login = CURRENT_TIMESTAMP
                 WHERE id = ?
                """,
                (user_id,),
            )
            conn.commit()

    def upsert_user_by_google_id(
        self,
        google_id: str,
        email: Optional[str],
        name: Optional[str],
        avatar_url: Optional[str] = None,
    ) -> Optional[Dict]:
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            conn.execute("BEGIN IMMEDIATE")
            try:
                try:
                    cursor = conn.execute(
                        SQLQueries.UPSERT_USER
                        + " RETURNING id, google_id, email, name, avatar_url, created_at, last_login",
                        (google_id, email, name, avatar_url),
                    )
                    row = cursor.fetchone()
                except sqlite3.OperationalError:
                    conn.execute(
                        SQLQueries.UPSERT_USER,
                        (google_id, email, name, avatar_url),
                    )
                    row = conn.execute(
                        SQLQueries.GET_USER_BY_GOOGLE_ID,
                        (google_id,),
                    ).fetchone()
                conn.commit()
                return dict(row) if row else None
            except Exception:
                conn.rollback()
                raise

    def delete_user_data(self, user_id: int) -> None:
        """Permanently delete all data for a user."""
        with self._connect() as conn:
            # Enable foreign keys just in case
            conn.execute("PRAGMA foreign_keys = ON")

            # Manual cleanup if cascades miss something (or for safety)
            tables = [
                "mood_entry_selections", # No user_id, linked to entry
                "mood_entries",
                "goals",
                "groups",
                "user_settings",
                "achievement_unlocks"
            ]

            # Selections are tough without CASCADE.
            # If we delete entries, selection links should die if CASCADE is on.
            # Let's trust FK CASCADE for entry->selection.

            # Direct user_id tables:
            direct_tables = ["mood_entries", "goals", "groups", "user_settings", "achievement_unlocks", "important_days"]
            for table in direct_tables:
                try:
                    conn.execute(f"DELETE FROM {table} WHERE user_id = ?", (user_id,))
                except Exception:
                    pass

            # Finally delete user
            conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
            conn.commit()

    def get_user_by_username(self, username: str) -> Optional[Dict]:
        """Get user by username."""
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                "SELECT * FROM users WHERE username = ?",
                (username,),
            )
            row = cursor.fetchone()
            return dict(row) if row else None

    def create_user_with_password(
        self, username: str, password_hash: str, email: str, name: str
    ) -> int:
        """Create a new user with username and password."""
        with self._connect() as conn:
            cursor = conn.execute(
                """
                INSERT INTO users (username, password_hash, email, name)
                VALUES (?, ?, ?, ?)
                """,
                (username, password_hash, email, name),
            )
            conn.commit()
            return int(cursor.lastrowid or 0)

    def update_password(self, user_id: int, password_hash: str) -> None:
        """Update user password."""
        with self._connect() as conn:
            conn.execute(
                """
                UPDATE users
                SET password_hash = ?
                WHERE id = ?
                """,
                (password_hash, user_id),
            )
            conn.commit()


__all__ = ["UsersMixin"]

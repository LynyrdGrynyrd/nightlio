"""User management helpers."""

from __future__ import annotations

import sqlite3
from typing import Dict, Optional

from api.database_common import DatabaseConnectionMixin, SQLQueries


class UsersMixin(DatabaseConnectionMixin):
    """CRUD helpers for user records."""

    def create_user(
        self,
        google_id: str,
        email: str,
        name: str,
        avatar_url: Optional[str] = None,
    ) -> int:
        cursor = self._query(
            SQLQueries.CREATE_USER,
            (google_id, email, name, avatar_url),
            commit=True,
        )
        return int(cursor.lastrowid or 0)

    def get_user_by_google_id(self, google_id: str) -> Optional[Dict]:
        row = self._query(SQLQueries.GET_USER_BY_GOOGLE_ID, (google_id,)).fetchone()
        return dict(row) if row else None

    def get_user_by_id(self, user_id: int) -> Optional[Dict]:
        row = self._query(SQLQueries.GET_USER_BY_ID, (user_id,)).fetchone()
        return dict(row) if row else None

    def update_user_last_login(self, user_id: int) -> None:
        self._query(
            """
            UPDATE users
               SET last_login = CURRENT_TIMESTAMP
             WHERE id = ?
            """,
            (user_id,),
            commit=True,
        )

    def upsert_user_by_google_id(
        self,
        google_id: str,
        email: Optional[str],
        name: Optional[str],
        avatar_url: Optional[str] = None,
    ) -> Optional[Dict]:
        with self._write_transaction() as conn:
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
            return dict(row) if row else None

    # Whitelist of tables that have a user_id column for safe deletion
    _USER_DATA_TABLES = frozenset({
        "mood_entries",
        "goals",
        "groups",
        "user_settings",
        "achievement_unlocks",
        "important_days",
        "scale_definitions",
        "push_subscriptions",
        "password_reset_tokens",
        "email_verification_tokens",
    })

    def delete_user_data(self, user_id: int) -> None:
        """Permanently delete all data for a user."""
        with self._write_transaction() as conn:
            # Delete from whitelisted tables only (prevents SQL injection)
            for table in self._USER_DATA_TABLES:
                try:
                    # Table name is from a hardcoded frozenset, safe to use in query
                    conn.execute(f"DELETE FROM {table} WHERE user_id = ?", (user_id,))
                except sqlite3.OperationalError:
                    # Table might not exist in all deployments
                    pass

            # Finally delete user
            conn.execute("DELETE FROM users WHERE id = ?", (user_id,))

    def get_user_by_username(self, username: str) -> Optional[Dict]:
        """Get user by username."""
        row = self._query(
            "SELECT * FROM users WHERE username = ?",
            (username,),
        ).fetchone()
        return dict(row) if row else None

    def create_user_with_password(
        self, username: str, password_hash: str, email: str, name: str
    ) -> int:
        """Create a new user with username and password."""
        cursor = self._query(
            """
            INSERT INTO users (username, password_hash, email, name)
            VALUES (?, ?, ?, ?)
            """,
            (username, password_hash, email, name),
            commit=True,
        )
        return int(cursor.lastrowid or 0)

    def update_password(self, user_id: int, password_hash: str) -> None:
        """Update user password."""
        self._query(
            """
            UPDATE users
            SET password_hash = ?
            WHERE id = ?
            """,
            (password_hash, user_id),
            commit=True,
        )


__all__ = ["UsersMixin"]

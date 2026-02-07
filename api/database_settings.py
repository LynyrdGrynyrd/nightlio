"""Settings database mixin."""

from __future__ import annotations

import sqlite3
from typing import Dict, Optional
from werkzeug.security import generate_password_hash, check_password_hash

try:  # pragma: no cover
    from .database_common import DatabaseConnectionMixin, logger
except ImportError:  # pragma: no cover
    from database_common import DatabaseConnectionMixin, logger  # type: ignore


class SettingsMixin(DatabaseConnectionMixin):
    """Mixin for user settings and security."""

    def _create_settings_table(self, conn: sqlite3.Connection) -> None:
        """Create table for user settings."""
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS user_settings (
                    user_id INTEGER PRIMARY KEY,
                    pin_hash TEXT,
                    lock_timeout_seconds INTEGER DEFAULT 60,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
                """
            )
            logger.info("User settings table ready")
        except sqlite3.Error as exc:
            logger.warning("User settings table creation failed: %s", exc)

    def get_user_settings(self, user_id: int) -> Dict:
        """Get settings for a user. Create defaults if not exists."""
        with self._connect() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                "SELECT * FROM user_settings WHERE user_id = ?", (user_id,)
            )
            row = cursor.fetchone()

            if not row:
                conn.execute(
                    "INSERT INTO user_settings (user_id) VALUES (?)", (user_id,)
                )
                conn.commit()
                # recursive call to get new row
                return self.get_user_settings(user_id)
            
            return dict(row)

    def set_user_pin(self, user_id: int, pin: str) -> None:
        """Set a 4+ digit PIN."""
        pin_hash = generate_password_hash(pin)
        with self._connect() as conn:
            self._ensure_settings_exist(conn, user_id)
            conn.execute(
                """
                UPDATE user_settings
                SET pin_hash = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
                """,
                (pin_hash, user_id),
            )
            conn.commit()

    def verify_user_pin(self, user_id: int, pin: str) -> bool:
        """Verify the PIN."""
        with self._connect() as conn:
            cursor = conn.execute(
                "SELECT pin_hash FROM user_settings WHERE user_id = ?", (user_id,)
            )
            row = cursor.fetchone()
            if not row or not row[0]:
                return False
            return check_password_hash(row[0], pin)
            
    def remove_user_pin(self, user_id: int) -> None:
        with self._connect() as conn:
            conn.execute(
                "UPDATE user_settings SET pin_hash = NULL WHERE user_id = ?",
                (user_id,)
            )
            conn.commit()

    def update_lock_timeout(self, user_id: int, seconds: int) -> None:
        with self._connect() as conn:
            self._ensure_settings_exist(conn, user_id)
            conn.execute(
                "UPDATE user_settings SET lock_timeout_seconds = ? WHERE user_id = ?",
                (seconds, user_id)
            )
            conn.commit()

    def _ensure_settings_exist(self, conn, user_id):
        cursor = conn.execute("SELECT 1 FROM user_settings WHERE user_id = ?", (user_id,))
        if not cursor.fetchone():
            conn.execute("INSERT INTO user_settings (user_id) VALUES (?)", (user_id,))
            # Note: commit is handled by caller

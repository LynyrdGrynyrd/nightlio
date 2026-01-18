"""Service for tracking and managing failed login attempts."""

from __future__ import annotations

import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional

try:
    from ..database_common import DatabaseConnectionMixin, logger
except ImportError:
    from database_common import DatabaseConnectionMixin, logger  # type: ignore


class LoginAttemptService(DatabaseConnectionMixin):
    """Manages failed login attempts and account lockouts."""

    # Configuration constants
    MAX_FAILED_ATTEMPTS = 5  # Lock after 5 failed attempts
    LOCKOUT_DURATION_MINUTES = 15  # Lock for 15 minutes
    ATTEMPT_WINDOW_MINUTES = 30  # Consider attempts in last 30 minutes

    def __init__(self, db_path: str):
        """Initialize the service with database path."""
        self.db_path = db_path

    def record_login_attempt(
        self,
        username: str,
        success: bool,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> None:
        """Record a login attempt (successful or failed)."""
        try:
            with self._connect() as conn:
                conn.execute(
                    """
                    INSERT INTO failed_login_attempts
                    (username, success, ip_address, user_agent, attempted_at)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (username, 1 if success else 0, ip_address, user_agent, datetime.now(timezone.utc)),
                )
                conn.commit()
        except Exception as e:
            logger.error(f"Failed to record login attempt: {e}")

    def is_account_locked(self, username: str) -> Dict[str, any]:
        """
        Check if account is locked due to too many failed attempts.

        Returns:
            Dict with:
                - locked: bool - Whether account is locked
                - remaining_lockout_seconds: int - Seconds until unlock (if locked)
                - failed_attempts: int - Number of recent failed attempts
        """
        try:
            with self._connect() as conn:
                conn.row_factory = sqlite3.Row

                # Get recent failed attempts (within attempt window)
                cutoff_time = datetime.now(timezone.utc) - timedelta(
                    minutes=self.ATTEMPT_WINDOW_MINUTES
                )

                cursor = conn.execute(
                    """
                    SELECT attempted_at, success
                    FROM failed_login_attempts
                    WHERE username = ?
                      AND attempted_at > ?
                    ORDER BY attempted_at DESC
                    """,
                    (username.lower(), cutoff_time),
                )

                attempts = cursor.fetchall()

                # Count consecutive failed attempts (stop at first success)
                consecutive_failures = 0
                most_recent_failure = None

                for attempt in attempts:
                    if attempt["success"]:
                        break  # Stop counting at first successful login
                    consecutive_failures += 1
                    if most_recent_failure is None:
                        most_recent_failure = datetime.fromisoformat(
                            attempt["attempted_at"].replace("Z", "+00:00")
                        )

                # Check if locked
                if consecutive_failures >= self.MAX_FAILED_ATTEMPTS:
                    if most_recent_failure:
                        unlock_time = most_recent_failure + timedelta(
                            minutes=self.LOCKOUT_DURATION_MINUTES
                        )
                        now = datetime.now(timezone.utc)

                        if now < unlock_time:
                            remaining_seconds = int((unlock_time - now).total_seconds())
                            return {
                                "locked": True,
                                "remaining_lockout_seconds": remaining_seconds,
                                "failed_attempts": consecutive_failures,
                            }

                return {
                    "locked": False,
                    "remaining_lockout_seconds": 0,
                    "failed_attempts": consecutive_failures,
                }

        except Exception as e:
            logger.error(f"Failed to check account lock status: {e}")
            # On error, allow login (fail open for availability)
            return {
                "locked": False,
                "remaining_lockout_seconds": 0,
                "failed_attempts": 0,
            }

    def cleanup_old_attempts(self, days: int = 30) -> int:
        """
        Clean up login attempts older than specified days.

        Args:
            days: Number of days to keep (default 30)

        Returns:
            Number of records deleted
        """
        try:
            with self._connect() as conn:
                cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
                cursor = conn.execute(
                    """
                    DELETE FROM failed_login_attempts
                    WHERE attempted_at < ?
                    """,
                    (cutoff_date,),
                )
                deleted_count = cursor.rowcount
                conn.commit()
                logger.info(f"Cleaned up {deleted_count} old login attempt records")
                return deleted_count
        except Exception as e:
            logger.error(f"Failed to cleanup old login attempts: {e}")
            return 0


__all__ = ["LoginAttemptService"]

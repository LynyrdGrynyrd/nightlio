"""Password reset and email verification token storage."""

from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional

from api.database_common import DatabaseConnectionMixin, logger


class PasswordResetMixin(DatabaseConnectionMixin):
    """Token storage for password reset and email verification."""

    # ------------------------------------------------------------------
    # Password reset tokens
    # ------------------------------------------------------------------

    def create_password_reset_token(self, user_id: int) -> str:
        """Generate a cryptographic token, store its SHA-256 hash, return raw token."""
        raw_token = secrets.token_urlsafe(48)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        expires_at = (
            datetime.now(timezone.utc) + timedelta(hours=1)
        ).isoformat()

        # Invalidate any existing unused tokens for this user
        self._query(
            "UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0",
            (user_id,),
            commit=True,
        )

        self._query(
            """
            INSERT INTO password_reset_tokens (token_hash, user_id, expires_at, used)
            VALUES (?, ?, ?, 0)
            """,
            (token_hash, user_id, expires_at),
            commit=True,
        )
        return raw_token

    def validate_password_reset_token(self, raw_token: str) -> Optional[Dict]:
        """Validate token, return {user_id, token_id} if valid, None otherwise.

        Uses hash comparison so the raw token is never stored.
        """
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        row = self._query(
            """
            SELECT id, user_id, expires_at, used
            FROM password_reset_tokens
            WHERE token_hash = ?
            """,
            (token_hash,),
        ).fetchone()

        if not row:
            return None

        record = dict(row)
        if record["used"]:
            return None

        expires_str = record["expires_at"]
        if isinstance(expires_str, str):
            expires_at = datetime.fromisoformat(
                expires_str.replace("Z", "+00:00")
            )
        else:
            expires_at = expires_str

        if datetime.now(timezone.utc) > expires_at:
            return None

        return {"user_id": record["user_id"], "token_id": record["id"]}

    def mark_password_reset_token_used(self, token_id: int) -> None:
        """Mark a token as used so it cannot be reused."""
        self._query(
            "UPDATE password_reset_tokens SET used = 1 WHERE id = ?",
            (token_id,),
            commit=True,
        )

    # ------------------------------------------------------------------
    # Email verification tokens
    # ------------------------------------------------------------------

    def create_email_verification_token(self, user_id: int) -> str:
        """Generate a verification token, store hash, return raw token."""
        raw_token = secrets.token_urlsafe(48)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        expires_at = (
            datetime.now(timezone.utc) + timedelta(hours=24)
        ).isoformat()

        # Invalidate old unused tokens for this user
        self._query(
            "UPDATE email_verification_tokens SET used = 1 WHERE user_id = ? AND used = 0",
            (user_id,),
            commit=True,
        )

        self._query(
            """
            INSERT INTO email_verification_tokens (token_hash, user_id, expires_at, used)
            VALUES (?, ?, ?, 0)
            """,
            (token_hash, user_id, expires_at),
            commit=True,
        )
        return raw_token

    def validate_email_verification_token(self, raw_token: str) -> Optional[Dict]:
        """Validate email verification token."""
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        row = self._query(
            """
            SELECT id, user_id, expires_at, used
            FROM email_verification_tokens
            WHERE token_hash = ?
            """,
            (token_hash,),
        ).fetchone()

        if not row:
            return None

        record = dict(row)
        if record["used"]:
            return None

        expires_str = record["expires_at"]
        if isinstance(expires_str, str):
            expires_at = datetime.fromisoformat(
                expires_str.replace("Z", "+00:00")
            )
        else:
            expires_at = expires_str

        if datetime.now(timezone.utc) > expires_at:
            return None

        return {"user_id": record["user_id"], "token_id": record["id"]}

    def mark_email_verification_token_used(self, token_id: int) -> None:
        self._query(
            "UPDATE email_verification_tokens SET used = 1 WHERE id = ?",
            (token_id,),
            commit=True,
        )

    # ------------------------------------------------------------------
    # Email verification status
    # ------------------------------------------------------------------

    def set_email_verified(self, user_id: int) -> None:
        self._query(
            "UPDATE users SET email_verified = 1 WHERE id = ?",
            (user_id,),
            commit=True,
        )

    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email address (for password reset lookup)."""
        row = self._query(
            "SELECT id, username, email, email_verified, password_hash FROM users WHERE email = ?",
            (email,),
        ).fetchone()
        return dict(row) if row else None


__all__ = ["PasswordResetMixin"]

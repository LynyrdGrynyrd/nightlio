"""Password reset business logic."""

from __future__ import annotations

import logging
from typing import Dict

from api.database import MoodDatabase
from api.services.email_service import EmailService
from api.utils.password_utils import hash_password
from api.utils.password_validation import validate_password_strength

logger = logging.getLogger(__name__)


class PasswordResetService:
    def __init__(self, db: MoodDatabase, email_service: EmailService):
        self._db = db
        self._email = email_service

    def request_reset(self, email: str) -> None:
        """Request a password reset for the given email.

        SECURITY: Always completes silently to prevent user enumeration.
        Only actually sends an email if the user exists and has a password.
        """
        if not email or not email.strip():
            return

        user = self._db.get_user_by_email(email.strip().lower())
        if not user:
            logger.info("Password reset requested for unknown email (suppressed)")
            return

        # Only password-based accounts can reset (not OAuth-only)
        if not user.get("password_hash"):
            logger.info("Password reset requested for OAuth-only account (suppressed)")
            return

        if not self._email.is_enabled:
            logger.warning("Password reset requested but email provider is disabled")
            return

        raw_token = self._db.create_password_reset_token(user["id"])
        username = user.get("username") or user.get("email", "there")
        self._email.send_password_reset(
            to=user["email"],
            token=raw_token,
            username=username,
        )

    def reset_password(self, token: str, new_password: str) -> Dict:
        """Validate token and reset the password.

        Returns dict with ``success`` (bool) and optional ``error`` (str).
        """
        validation = validate_password_strength(new_password)
        if not validation["valid"]:
            return {"success": False, "error": validation["errors"][0]}

        token_data = self._db.validate_password_reset_token(token)
        if not token_data:
            return {"success": False, "error": "Invalid or expired reset link"}

        user = self._db.get_user_by_id(token_data["user_id"])
        if not user:
            return {"success": False, "error": "Invalid or expired reset link"}

        new_hash = hash_password(new_password)
        self._db.update_password(token_data["user_id"], new_hash)
        self._db.mark_password_reset_token_used(token_data["token_id"])

        logger.info("Password reset completed for user_id=%d", token_data["user_id"])
        return {"success": True}

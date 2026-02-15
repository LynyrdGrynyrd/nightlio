"""Password reset routes."""

from flask import Blueprint, request, current_app
from api.services.password_reset_service import PasswordResetService
from api.utils.rate_limiter import rate_limit
from api.utils.responses import success_response, error_response


def create_password_reset_routes(
    password_reset_service: PasswordResetService,
) -> Blueprint:
    bp = Blueprint("password_reset", __name__)

    @bp.route("/auth/forgot-password", methods=["POST"])
    @rate_limit(max_requests=5, window_minutes=15)
    def forgot_password():
        """Request a password reset email.

        SECURITY: Always returns 200 to prevent email enumeration.
        """
        data = request.get_json(silent=True) or {}
        email = (data.get("email") or "").strip().lower()

        if email:
            try:
                password_reset_service.request_reset(email)
            except Exception as exc:
                current_app.logger.error("Password reset request error: %s", exc)

        # Always return success regardless of whether the email exists
        return success_response(
            message="If an account with that email exists, a reset link has been sent."
        )

    @bp.route("/auth/reset-password", methods=["POST"])
    @rate_limit(max_requests=10, window_minutes=15)
    def reset_password():
        """Reset password with a valid token."""
        data = request.get_json(silent=True) or {}
        token = (data.get("token") or "").strip()
        new_password = data.get("password", "")

        if not token or not new_password:
            return error_response("Token and new password are required", status=400)

        result = password_reset_service.reset_password(token, new_password)

        if result["success"]:
            return success_response(message="Password has been reset successfully.")
        else:
            return error_response(result["error"], status=400)

    return bp

from flask import Blueprint, request, jsonify, current_app
import os
import requests
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from api.services.user_service import UserService
from api.services.login_attempt_service import LoginAttemptService
from api.utils.rate_limiter import rate_limit
from api.config import get_config
from api.utils.auth_middleware import require_auth, get_current_user_id
from api.utils.password_utils import hash_password, verify_password
from api.utils.password_validation import validate_password_strength, validate_username


def create_auth_routes(user_service: UserService, login_attempt_service: LoginAttemptService = None, email_service=None, db=None):
    auth_bp = Blueprint("auth", __name__)

    @auth_bp.route("/auth/google", methods=["POST"])
    @rate_limit(max_requests=30, window_minutes=1)  # SECURITY: Prevent auth brute-force
    def google_auth():
        """Handle Google OAuth token verification"""
        try:
            data = request.json
            google_token = data.get("token")

            if not google_token:
                return jsonify({"error": "Google token is required"}), 400

            # Verify Google token
            google_user_info = verify_google_token(google_token)

            if not google_user_info:
                return jsonify({"error": "Invalid Google token"}), 401

            # Get or create user
            user = user_service.get_or_create_user(
                google_id=google_user_info["sub"],
                email=google_user_info["email"],
                name=google_user_info["name"],
                avatar_url=google_user_info.get("picture"),
            )

            # Generate JWT token
            jwt_token = generate_jwt_token(user["id"])

            return jsonify(
                {
                    "token": jwt_token,
                    "user": {
                        "id": user["id"],
                        "name": user["name"],
                        "email": user["email"],
                        "avatar_url": user["avatar_url"],
                        "email_verified": bool(user.get("email_verified")),
                    },
                }
            )

        except Exception as e:
            current_app.logger.error(f"Google auth error: {str(e)}")
            return jsonify({"error": "Authentication failed"}), 500

    @auth_bp.route("/auth/verify", methods=["POST"])
    def verify_token():
        """Verify JWT token and return user info"""
        try:
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return jsonify({"error": "Authorization header required"}), 401

            token = auth_header.split(" ")[1]
            payload = jwt.decode(
                token, current_app.config["JWT_SECRET_KEY"], algorithms=["HS256"]
            )

            user = user_service.get_user_by_id(payload["user_id"])
            if not user:
                return jsonify({"error": "User not found"}), 404

            return jsonify(
                {
                    "user": {
                        "id": user["id"],
                        "name": user["name"],
                        "email": user["email"],
                        "avatar_url": user["avatar_url"],
                        "email_verified": bool(user.get("email_verified")),
                    }
                }
            )

        except JWTError as e:
            if "expired" in str(e).lower():
                return jsonify({"error": "Token expired"}), 401
            else:
                return jsonify({"error": "Invalid token"}), 401
        except Exception as e:
            current_app.logger.error(f"Token verification error: {str(e)}")
            return jsonify({"error": "Token verification failed"}), 500

    @auth_bp.route("/auth/local/login", methods=["POST"])
    @rate_limit(max_requests=30, window_minutes=1)
    def local_login():
        """Local self-host login: ensure a single default user and issue JWT."""
        try:
            cfg = get_config()
            local_login_enabled = bool(
                current_app.config.get("ENABLE_LOCAL_LOGIN", cfg.ENABLE_LOCAL_LOGIN)
            )
            if not local_login_enabled:
                return jsonify({"error": "Local login is disabled"}), 403

            default_user_id = cfg.DEFAULT_SELF_HOST_ID

            # Use friendlier display for the self-hosted user
            default_name = os.getenv("SELFHOST_USER_NAME") or "Me"
            default_email = (
                os.getenv("SELFHOST_USER_EMAIL") or f"{default_user_id}@localhost"
            )

            user = user_service.ensure_local_user(
                default_user_id, default_name, default_email
            )

            token = generate_jwt_token(user["id"])

            return (
                jsonify(
                    {
                        "token": token,
                        "user": {
                            "id": user["id"],
                            "name": user["name"],
                            "email": user.get("email"),
                            "avatar_url": user.get("avatar_url"),
                            "email_verified": bool(user.get("email_verified")),
                        },
                    }
                ),
                200,
            )
        except Exception as e:
            current_app.logger.error(f"Local login error: {e}")
            return jsonify({"error": "Authentication failed"}), 500

    @auth_bp.route("/auth/login", methods=["POST"])
    @rate_limit(max_requests=30, window_minutes=1)
    def username_password_login():
        """Login with username and password."""
        try:
            data = request.json
            username = data.get("username", "").lower().strip()  # Normalize username
            password = data.get("password")

            if not username or not password:
                return jsonify({"error": "Username and password are required"}), 400

            # Check if account is locked (if login_attempt_service is available)
            if login_attempt_service:
                lock_status = login_attempt_service.is_account_locked(username)
                if lock_status["locked"]:
                    minutes_left = lock_status["remaining_lockout_seconds"] // 60
                    seconds_left = lock_status["remaining_lockout_seconds"] % 60
                    return jsonify({
                        "error": f"Account temporarily locked due to too many failed login attempts. Try again in {minutes_left}m {seconds_left}s."
                    }), 429

            # Get IP address and user agent for logging
            ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
            user_agent = request.headers.get('User-Agent', '')

            # Get user by username
            user = user_service.get_user_by_username(username)
            if not user:
                if login_attempt_service:
                    login_attempt_service.record_login_attempt(username, False, ip_address, user_agent)
                return jsonify({"error": "Invalid username or password"}), 401

            # Verify password
            if not user.get("password_hash"):
                if login_attempt_service:
                    login_attempt_service.record_login_attempt(username, False, ip_address, user_agent)
                return jsonify({"error": "Invalid username or password"}), 401

            if not verify_password(password, user["password_hash"]):
                if login_attempt_service:
                    login_attempt_service.record_login_attempt(username, False, ip_address, user_agent)
                return jsonify({"error": "Invalid username or password"}), 401

            # Successful login - record it
            if login_attempt_service:
                login_attempt_service.record_login_attempt(username, True, ip_address, user_agent)

            # Generate JWT token
            jwt_token = generate_jwt_token(user["id"])

            return jsonify(
                {
                    "token": jwt_token,
                    "user": {
                        "id": user["id"],
                        "name": user["name"],
                        "email": user["email"],
                        "avatar_url": user.get("avatar_url"),
                        "email_verified": bool(user.get("email_verified")),
                    },
                }
            )

        except Exception as e:
            current_app.logger.error(f"Username/password login error: {str(e)}")
            return jsonify({"error": "Authentication failed"}), 500

    @auth_bp.route("/auth/register", methods=["POST"])
    @rate_limit(max_requests=10, window_minutes=1)
    def register():
        """Register a new user with username and password."""
        try:
            cfg = get_config()
            if not cfg.ENABLE_REGISTRATION:
                return jsonify({"error": "Registration is disabled"}), 403

            data = request.json
            username = data.get("username", "").lower().strip()  # Normalize username
            password = data.get("password", "")
            email = data.get("email", "")
            name = data.get("name", username)

            if not username or not password:
                return jsonify({"error": "Username and password are required"}), 400

            # Validate username
            username_validation = validate_username(username)
            if not username_validation["valid"]:
                return jsonify({"error": username_validation["errors"][0]}), 400

            # Validate password strength
            password_validation = validate_password_strength(password)
            if not password_validation["valid"]:
                return jsonify({
                    "error": "Password does not meet requirements",
                    "details": password_validation["errors"]
                }), 400

            # Check if username already exists
            existing_user = user_service.get_user_by_username(username)
            if existing_user:
                return jsonify({"error": "Username already exists"}), 409

            # Hash password
            password_hash = hash_password(password)

            # Create user
            user = user_service.create_user_with_password(
                username=username,
                password_hash=password_hash,
                email=email,
                name=name,
            )

            # Generate JWT token
            jwt_token = generate_jwt_token(user["id"])

            return (
                jsonify(
                    {
                        "token": jwt_token,
                        "user": {
                            "id": user["id"],
                            "name": user["name"],
                            "email": user["email"],
                            "avatar_url": user.get("avatar_url"),
                            "email_verified": bool(user.get("email_verified")),
                        },
                    }
                ),
                201,
            )

        except Exception as e:
            current_app.logger.error(f"Registration error: {str(e)}")
            return jsonify({"error": "Registration failed"}), 500

    @auth_bp.route("/auth/user", methods=["DELETE"])
    @require_auth
    def delete_account():
        """Permanently delete user account and data."""
        try:
            user_id = get_current_user_id()
            user_service.delete_user_data(user_id)
            return jsonify({"message": "Account deleted successfully"}), 200
        except Exception as e:
            current_app.logger.error(f"Account deletion failed: {e}")
            return jsonify({"error": "Deletion failed"}), 500

    @auth_bp.route("/auth/change-password", methods=["POST"])
    @require_auth
    @rate_limit(max_requests=10, window_minutes=1)
    def change_password():
        """Change user password (requires current password)."""
        try:
            user_id = get_current_user_id()
            data = request.json
            current_password = data.get("current_password")
            new_password = data.get("new_password")

            if not current_password or not new_password:
                return jsonify({"error": "Current and new passwords are required"}), 400

            # Get user
            user = user_service.get_user_by_id(user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404

            # Check if user has a password (OAuth users don't)
            if not user.get("password_hash"):
                return jsonify({
                    "error": "Cannot change password for OAuth accounts"
                }), 400

            # Verify current password
            if not verify_password(current_password, user["password_hash"]):
                return jsonify({"error": "Current password is incorrect"}), 401

            # Validate new password strength
            password_validation = validate_password_strength(new_password)
            if not password_validation["valid"]:
                return jsonify({
                    "error": "New password does not meet requirements",
                    "details": password_validation["errors"]
                }), 400

            # Check that new password is different from current
            if verify_password(new_password, user["password_hash"]):
                return jsonify({
                    "error": "New password must be different from current password"
                }), 400

            # Update password
            new_password_hash = hash_password(new_password)
            user_service.update_password(user_id, new_password_hash)

            return jsonify({"message": "Password changed successfully"}), 200

        except Exception as e:
            current_app.logger.error(f"Password change failed: {e}")
            return jsonify({"error": "Password change failed"}), 500

    def verify_google_token(token: str) -> dict:
        """Verify Google OAuth token and return user info"""
        try:
            # Verify token with Google
            response = requests.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={token}", timeout=10
            )

            if response.status_code != 200:
                current_app.logger.error(
                    f"Google token verification failed with status {response.status_code}"
                )
                return None

            user_info = response.json()

            # Verify the token is for our app
            expected_client_id = current_app.config["GOOGLE_CLIENT_ID"]
            actual_client_id = user_info.get("aud")

            if actual_client_id != expected_client_id:
                current_app.logger.warning("Google token audience mismatch")
                return None

            return user_info

        except Exception as e:
            current_app.logger.error(f"Google token verification error: {str(e)}")
            return None

    @auth_bp.route("/auth/send-verification", methods=["POST"])
    @require_auth
    @rate_limit(max_requests=3, window_minutes=15)
    def send_verification():
        """Send email verification link to the authenticated user."""
        user_id = get_current_user_id()
        user = user_service.get_user_by_id(user_id)

        if not user or not user.get("email"):
            return jsonify({"error": "No email associated with this account"}), 400

        if user.get("email_verified"):
            return jsonify({"message": "Email already verified"}), 200

        if not email_service or not email_service.is_enabled:
            return jsonify({"error": "Email service is not configured"}), 503

        raw_token = db.create_email_verification_token(user_id)
        username = user.get("username") or user.get("name", "there")
        email_service.send_email_verification(user["email"], raw_token, username)

        return jsonify({"message": "Verification email sent"}), 200

    @auth_bp.route("/auth/verify-email", methods=["GET"])
    def verify_email():
        """Verify email address via token link."""
        token = request.args.get("token", "").strip()
        if not token:
            return jsonify({"error": "Token is required"}), 400

        if not db:
            return jsonify({"error": "Service unavailable"}), 503

        token_data = db.validate_email_verification_token(token)
        if not token_data:
            return jsonify({"error": "Invalid or expired verification link"}), 400

        db.set_email_verified(token_data["user_id"])
        db.mark_email_verification_token_used(token_data["token_id"])

        return jsonify({"message": "Email verified successfully"}), 200

    def generate_jwt_token(user_id: int) -> str:
        """Generate JWT token for user"""
        payload = {
            "user_id": user_id,
            "exp": datetime.now(timezone.utc)
            + timedelta(seconds=current_app.config["JWT_ACCESS_TOKEN_EXPIRES"]),
            "iat": datetime.now(timezone.utc),
        }

        return jwt.encode(
            payload, current_app.config["JWT_SECRET_KEY"], algorithm="HS256"
        )

    return auth_bp

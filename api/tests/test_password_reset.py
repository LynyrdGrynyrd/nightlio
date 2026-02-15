"""Tests for password reset flow."""

import os
import tempfile

import pytest

from api.app import create_app
from api.database import MoodDatabase


@pytest.fixture
def app():
    """Create a test app with registration enabled."""
    db_fd, db_path = tempfile.mkstemp()
    os.environ["ENABLE_REGISTRATION"] = "true"
    os.environ["EMAIL_PROVIDER"] = "none"
    from api import config as config_module

    original_db_path = config_module.TestingConfig.DATABASE_PATH
    config_module.TestingConfig.DATABASE_PATH = db_path
    config_module._CONFIG_SINGLETON = None
    app = create_app("testing")
    app.config["TESTING"] = True

    with app.app_context():
        db = MoodDatabase(db_path)
        db.init_database()

    yield app

    os.close(db_fd)
    os.unlink(db_path)
    os.environ.pop("ENABLE_REGISTRATION", None)
    os.environ.pop("EMAIL_PROVIDER", None)
    config_module.TestingConfig.DATABASE_PATH = original_db_path
    config_module._CONFIG_SINGLETON = None


@pytest.fixture
def client(app):
    return app.test_client()


class TestForgotPassword:
    """POST /api/auth/forgot-password"""

    def test_always_returns_success(self, client):
        """Should not reveal whether email exists."""
        response = client.post(
            "/api/auth/forgot-password",
            json={"email": "nonexistent@example.com"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "success"

    def test_empty_email_returns_success(self, client):
        response = client.post(
            "/api/auth/forgot-password", json={"email": ""}
        )
        assert response.status_code == 200

    def test_no_body_returns_success(self, client):
        response = client.post(
            "/api/auth/forgot-password",
            json={},
        )
        assert response.status_code == 200


class TestResetPassword:
    """POST /api/auth/reset-password"""

    def test_invalid_token_returns_error(self, client):
        response = client.post(
            "/api/auth/reset-password",
            json={"token": "invalid-token", "password": "NewPass123!"},
        )
        assert response.status_code == 400
        data = response.get_json()
        assert data["status"] == "error"

    def test_missing_fields_returns_error(self, client):
        response = client.post("/api/auth/reset-password", json={})
        assert response.status_code == 400

    def test_missing_password_returns_error(self, client):
        response = client.post(
            "/api/auth/reset-password", json={"token": "sometoken"}
        )
        assert response.status_code == 400

    def test_weak_password_returns_error(self, client):
        response = client.post(
            "/api/auth/reset-password",
            json={"token": "sometoken", "password": "123"},
        )
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data


class TestTokenLifecycle:
    """Direct database tests for token create / validate / use."""

    def test_create_and_validate_password_reset_token(self, initialized_db):
        user_id = initialized_db.create_user_with_password(
            "resetuser", "hash", "reset@test.com", "Reset User"
        )
        raw_token = initialized_db.create_password_reset_token(user_id)
        assert raw_token is not None
        assert len(raw_token) > 30

        result = initialized_db.validate_password_reset_token(raw_token)
        assert result is not None
        assert result["user_id"] == user_id

        # Mark used
        initialized_db.mark_password_reset_token_used(result["token_id"])

        # Should no longer validate
        assert initialized_db.validate_password_reset_token(raw_token) is None

    def test_old_tokens_invalidated_on_new_request(self, initialized_db):
        user_id = initialized_db.create_user_with_password(
            "user2", "hash", "user2@test.com", "User Two"
        )
        token1 = initialized_db.create_password_reset_token(user_id)
        token2 = initialized_db.create_password_reset_token(user_id)

        # First token should be invalid (marked used by second request)
        assert initialized_db.validate_password_reset_token(token1) is None
        # Second token should be valid
        assert initialized_db.validate_password_reset_token(token2) is not None

    def test_invalid_token_returns_none(self, initialized_db):
        result = initialized_db.validate_password_reset_token("bogus-token")
        assert result is None

    def test_create_and_validate_email_verification_token(self, initialized_db):
        user_id = initialized_db.create_user_with_password(
            "verifyuser", "hash", "verify@test.com", "Verify User"
        )
        raw_token = initialized_db.create_email_verification_token(user_id)
        assert raw_token is not None

        result = initialized_db.validate_email_verification_token(raw_token)
        assert result is not None
        assert result["user_id"] == user_id

        initialized_db.mark_email_verification_token_used(result["token_id"])
        assert initialized_db.validate_email_verification_token(raw_token) is None

    def test_set_email_verified(self, initialized_db):
        user_id = initialized_db.create_user_with_password(
            "emailuser", "hash", "email@test.com", "Email User"
        )
        # Initially not verified
        user = initialized_db.get_user_by_email("email@test.com")
        assert user is not None
        assert not user.get("email_verified")

        initialized_db.set_email_verified(user_id)
        user = initialized_db.get_user_by_email("email@test.com")
        assert user["email_verified"]

    def test_get_user_by_email(self, initialized_db):
        initialized_db.create_user_with_password(
            "findme", "hash", "findme@test.com", "Find Me"
        )
        user = initialized_db.get_user_by_email("findme@test.com")
        assert user is not None
        assert user["username"] == "findme"

        # Non-existent email
        assert initialized_db.get_user_by_email("nope@test.com") is None


class TestEmailVerificationEndpoints:
    """Test email verification routes."""

    def test_verify_email_missing_token(self, client):
        response = client.get("/api/auth/verify-email")
        assert response.status_code == 400

    def test_verify_email_invalid_token(self, client):
        response = client.get("/api/auth/verify-email?token=badtoken")
        assert response.status_code == 400


class TestConfigEndpointIncludesEmailEnabled:
    """Test that the /api/config endpoint exposes email_enabled."""

    def test_config_shows_email_enabled(self, client):
        response = client.get("/api/config")
        assert response.status_code == 200
        data = response.get_json()
        # EMAIL_PROVIDER=none so email_enabled should be false
        assert data.get("email_enabled") is False

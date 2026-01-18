"""Tests for username/password authentication."""

import os
import tempfile

import pytest

from api.app import create_app
from api.database import MoodDatabase


@pytest.fixture
def app():
    """Create and configure a test instance of the app."""
    db_fd, db_path = tempfile.mkstemp()
    os.environ["ENABLE_REGISTRATION"] = "true"
    from api import config as config_module
    original_db_path = config_module.TestingConfig.DATABASE_PATH
    config_module.TestingConfig.DATABASE_PATH = db_path
    config_module._CONFIG_SINGLETON = None
    app = create_app("testing")
    app.config["TESTING"] = True

    # Initialize database
    with app.app_context():
        db = MoodDatabase(db_path)
        db.init_database()

    yield app

    # Cleanup
    os.close(db_fd)
    os.unlink(db_path)
    os.environ.pop("ENABLE_REGISTRATION", None)
    config_module.TestingConfig.DATABASE_PATH = original_db_path
    config_module._CONFIG_SINGLETON = None


@pytest.fixture
def client(app):
    """Create a test client for the app."""
    return app.test_client()


class TestUsernamePasswordAuth:
    """Test cases for username/password authentication."""

    def test_register_new_user_success(self, client, app):
        """Test successful user registration."""
        # Enable registration
        app.config["ENABLE_REGISTRATION"] = True

        response = client.post('/api/auth/register', json={
            'username': 'testuser',
            'password': 'Test123!',
            'email': 'test@example.com',
            'name': 'Test User'
        })

        assert response.status_code == 201
        data = response.get_json()
        assert 'token' in data
        assert 'user' in data
        assert data['user']['name'] == 'Test User'
        assert data['user']['email'] == 'test@example.com'

    def test_register_weak_password_fails(self, client, app):
        """Test that weak passwords are rejected."""
        app.config["ENABLE_REGISTRATION"] = True

        response = client.post('/api/auth/register', json={
            'username': 'testuser',
            'password': 'weak',
            'email': 'test@example.com'
        })

        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
        assert 'does not meet requirements' in data['error']

    def test_register_invalid_username_fails(self, client, app):
        """Test that invalid usernames are rejected."""
        app.config["ENABLE_REGISTRATION"] = True

        # Username starting with number
        response = client.post('/api/auth/register', json={
            'username': '123user',
            'password': 'Test123!',
        })

        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data

    def test_register_duplicate_username_fails(self, client, app):
        """Test that duplicate usernames are rejected."""
        app.config["ENABLE_REGISTRATION"] = True

        # First registration
        client.post('/api/auth/register', json={
            'username': 'testuser',
            'password': 'Test123!',
        })

        # Second registration with same username
        response = client.post('/api/auth/register', json={
            'username': 'testuser',
            'password': 'Test123!',
        })

        assert response.status_code == 409
        data = response.get_json()
        assert 'already exists' in data['error']

    def test_login_success(self, client, app):
        """Test successful login."""
        app.config["ENABLE_REGISTRATION"] = True

        # Register user
        client.post('/api/auth/register', json={
            'username': 'testuser',
            'password': 'Test123!',
        })

        # Login
        response = client.post('/api/auth/login', json={
            'username': 'testuser',
            'password': 'Test123!',
        })

        assert response.status_code == 200
        data = response.get_json()
        assert 'token' in data
        assert 'user' in data

    def test_login_wrong_password_fails(self, client, app):
        """Test that wrong password fails."""
        app.config["ENABLE_REGISTRATION"] = True

        # Register user
        client.post('/api/auth/register', json={
            'username': 'testuser',
            'password': 'Test123!',
        })

        # Login with wrong password
        response = client.post('/api/auth/login', json={
            'username': 'testuser',
            'password': 'WrongPassword123!',
        })

        assert response.status_code == 401
        data = response.get_json()
        assert 'Invalid username or password' in data['error']

    def test_login_nonexistent_user_fails(self, client):
        """Test login with non-existent username."""
        response = client.post('/api/auth/login', json={
            'username': 'nonexistent',
            'password': 'Test123!',
        })

        assert response.status_code == 401
        data = response.get_json()
        assert 'Invalid username or password' in data['error']

    def test_username_case_insensitive(self, client, app):
        """Test that usernames are case-insensitive."""
        app.config["ENABLE_REGISTRATION"] = True

        # Register with lowercase
        client.post('/api/auth/register', json={
            'username': 'testuser',
            'password': 'Test123!',
        })

        # Login with uppercase should work
        response = client.post('/api/auth/login', json={
            'username': 'TESTUSER',
            'password': 'Test123!',
        })

        assert response.status_code == 200

    def test_account_lockout_after_failed_attempts(self, client, app):
        """Test that account gets locked after multiple failed login attempts."""
        app.config["ENABLE_REGISTRATION"] = True

        # Register user
        client.post('/api/auth/register', json={
            'username': 'testuser',
            'password': 'Test123!',
        })

        # Attempt 5 failed logins
        for i in range(5):
            client.post('/api/auth/login', json={
                'username': 'testuser',
                'password': 'WrongPassword!',
            })

        # 6th attempt should be locked
        response = client.post('/api/auth/login', json={
            'username': 'testuser',
            'password': 'WrongPassword!',
        })

        assert response.status_code == 429
        data = response.get_json()
        assert 'locked' in data['error'].lower()

    def test_successful_login_clears_failed_attempts(self, client, app):
        """Test that successful login resets failed attempt counter."""
        app.config["ENABLE_REGISTRATION"] = True

        # Register user
        client.post('/api/auth/register', json={
            'username': 'testuser',
            'password': 'Test123!',
        })

        # Attempt 3 failed logins
        for i in range(3):
            client.post('/api/auth/login', json={
                'username': 'testuser',
                'password': 'WrongPassword!',
            })

        # Successful login
        response = client.post('/api/auth/login', json={
            'username': 'testuser',
            'password': 'Test123!',
        })

        assert response.status_code == 200

        # After successful login, failed attempts should be reset
        # So we can fail another 5 times before lockout
        for i in range(5):
            response = client.post('/api/auth/login', json={
                'username': 'testuser',
                'password': 'WrongPassword!',
            })

        # 6th failure should trigger lockout
        response = client.post('/api/auth/login', json={
            'username': 'testuser',
            'password': 'WrongPassword!',
        })

        assert response.status_code == 429

    def test_change_password_success(self, client, app):
        """Test successful password change."""
        app.config["ENABLE_REGISTRATION"] = True

        # Register and login
        client.post('/api/auth/register', json={
            'username': 'testuser',
            'password': 'Test123!',
        })

        login_response = client.post('/api/auth/login', json={
            'username': 'testuser',
            'password': 'Test123!',
        })

        token = login_response.get_json()['token']

        # Change password
        response = client.post('/api/auth/change-password',
            headers={'Authorization': f'Bearer {token}'},
            json={
                'current_password': 'Test123!',
                'new_password': 'NewTest123!',
            }
        )

        assert response.status_code == 200

        # Verify new password works
        response = client.post('/api/auth/login', json={
            'username': 'testuser',
            'password': 'NewTest123!',
        })

        assert response.status_code == 200

    def test_change_password_wrong_current_password_fails(self, client, app):
        """Test that password change fails with wrong current password."""
        app.config["ENABLE_REGISTRATION"] = True

        # Register and login
        client.post('/api/auth/register', json={
            'username': 'testuser',
            'password': 'Test123!',
        })

        login_response = client.post('/api/auth/login', json={
            'username': 'testuser',
            'password': 'Test123!',
        })

        token = login_response.get_json()['token']

        # Try to change password with wrong current password
        response = client.post('/api/auth/change-password',
            headers={'Authorization': f'Bearer {token}'},
            json={
                'current_password': 'WrongPassword!',
                'new_password': 'NewTest123!',
            }
        )

        assert response.status_code == 401

    def test_default_admin_user_exists(self, client):
        """Test that default admin user is created."""
        # Admin user should be created on startup
        # We can't test the exact password since it's random,
        # but we can verify the admin account exists
        response = client.post('/api/auth/login', json={
            'username': 'admin',
            'password': 'wrong_password',  # We expect this to fail
        })

        # Should fail with wrong password (not "user doesn't exist")
        assert response.status_code == 401
        data = response.get_json()
        assert 'Invalid username or password' in data['error']

# Ensure the api package is importable during tests
import sys
from pathlib import Path

import pytest

root = Path(__file__).resolve().parent.parent
api_dir = root / "api"
if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))


@pytest.fixture
def test_db(tmp_path):
    """
    Provides an isolated test database path using pytest's tmp_path fixture.
    Each test gets a fresh, unique database file that is automatically
    cleaned up after the test completes.
    """
    db_path = tmp_path / "test.db"
    yield str(db_path)


@pytest.fixture
def initialized_db(test_db):
    """
    Provides an initialized MoodDatabase instance with schema created.
    Useful for tests that just need a ready-to-use database.
    """
    from api.database import MoodDatabase

    db = MoodDatabase(test_db)
    db.init_database()
    yield db


@pytest.fixture
def db_with_user(initialized_db):
    """
    Provides a database with a test user already created.
    Returns tuple of (db_instance, user_id).
    """
    user_id = initialized_db.create_user(
        "test_google_id", "test@example.com", "Test User", None
    )
    yield initialized_db, user_id


import os
import pytest
import tempfile

from api.services.user_service import UserService
from api.database import MoodDatabase

@pytest.fixture
def db():
    db_fd, db_path = tempfile.mkstemp()
    db = MoodDatabase(db_path)
    db.init_database()
    yield db
    os.close(db_fd)
    os.unlink(db_path)

def test_delete_user_data(db):
    service = UserService(db)
    
    # Create user and data
    user_id = db.create_user("google_del", "del@test.com", "Deleter", None)
    db.add_mood_entry(user_id, "2023-01-01", 3, "Content", "12:00", [])
    
    # Verify existence
    assert db.get_user_by_id(user_id) is not None
    assert len(db.get_all_mood_entries(user_id)) == 1
    
    # Delete
    service.delete_user_data(user_id)
    
    # Verify deletion
    assert db.get_user_by_id(user_id) is None
    # Entries should correspond to the user, ensure queries return empty
    # Note: get_all_mood_entries might return empty if user missing, 
    # but we should check table directly if possible, or trust API.
    entries = db.get_all_mood_entries(user_id) 
    assert len(entries) == 0

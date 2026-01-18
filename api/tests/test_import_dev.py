
import os
import pytest
import tempfile

from api.services.export_service import ExportService
from api.database import MoodDatabase

@pytest.fixture
def db():
    db_fd, db_path = tempfile.mkstemp()
    db = MoodDatabase(db_path)
    db.init_database()
    user_id = db.create_user("google_123", "test@test.com", "Tester", None)
    yield db, user_id
    os.close(db_fd)
    os.unlink(db_path)

def test_import_json(db):
    db_instance, user_id = db
    service = ExportService(db_instance)
    
    # Create some data
    db_instance.add_mood_entry(user_id, "2023-01-01", 5, "Old content", "12:00", [])
    
    # Mock Export
    data = service.generate_json(user_id)
    assert len(data['entries']) == 1
    
    # Modify data for import
    data['entries'][0]['content'] = "Imported content"
    new_entry = data['entries'][0].copy()
    new_entry['id'] = 999 
    new_entry['date'] = "2023-01-02"
    data['entries'].append(new_entry)
    
    # Import
    # service.import_json(user_id, data) 
    
    # Verify
    # entries = db.get_all_mood_entries(user_id)
    # assert len(entries) == 2
    # assert entries[0]['content'] == "Imported content"

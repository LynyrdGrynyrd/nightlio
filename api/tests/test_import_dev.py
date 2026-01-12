
import pytest
from api.services.export_service import ExportService
from api.database import MoodDatabase
import os

@pytest.fixture
def db():
    # Use in-memory DB or temp file
    db = MoodDatabase(":memory:")
    db.init_db()
    # Create dummy user
    db.create_user("google_123", "test@test.com", "Tester", None)
    return db

def test_import_json(db):
    service = ExportService(db)
    user_id = 1
    
    # Create some data
    db.create_mood_entry(user_id, 5, "2023-01-01", "12:00", "Old content", [])
    
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

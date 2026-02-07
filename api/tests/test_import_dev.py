import pytest

from api.services.export_service import ExportService


def test_import_json(db_with_user):
    """Test JSON import functionality - imports add new entries."""
    db_instance, user_id = db_with_user
    service = ExportService(db_instance)

    # Create some data
    db_instance.add_mood_entry(user_id, "2023-01-01", 5, "Old content", "12:00", [])

    # Export data
    data = service.generate_json(user_id)
    assert len(data['entries']) == 1

    # Create import data with 2 entries
    import_data = {
        'entries': [
            {'mood': 4, 'date': '2023-01-02', 'content': 'First imported', 'created_at': '10:00'},
            {'mood': 3, 'date': '2023-01-03', 'content': 'Second imported', 'created_at': '11:00'},
        ]
    }

    # Import
    result = service.import_json(user_id, import_data)
    assert result['entries'] == 2
    assert result['errors'] == 0

    # Verify - original entry + 2 imported = 3 total
    entries = db_instance.get_all_mood_entries(user_id)
    assert len(entries) == 3

    # Check content was imported correctly
    contents = {e['content'] for e in entries}
    assert 'Old content' in contents
    assert 'First imported' in contents
    assert 'Second imported' in contents

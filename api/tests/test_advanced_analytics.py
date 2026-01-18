
import pytest
from datetime import date, timedelta
from api.database import MoodDatabase
from api.database_analytics import AnalyticsMixin


# Create a test class that mixes in AnalyticsMixin
class AnalyticsTestDB(MoodDatabase, AnalyticsMixin):
    pass

@pytest.fixture
def db(tmp_path):
    db_path = tmp_path / "test_twilightio_analytics.db"
    return AnalyticsTestDB(str(db_path), init=True)

def test_get_advanced_correlations_date_filter(db):
    google_id = "123"
    user_data = db.upsert_user_by_google_id(google_id, "test@example.com", "Test User", "")
    user_id = user_data['id']
    
    # Create groups
    with db._connect() as conn:
        cursor = conn.execute("INSERT INTO groups (name) VALUES ('Activities')")
        group_id = cursor.lastrowid
        cursor = conn.execute("INSERT INTO group_options (group_id, name, icon) VALUES (?, 'Coffee', 'coffee')", (group_id,))
        coffee_id = cursor.lastrowid
        cursor = conn.execute("INSERT INTO group_options (group_id, name, icon) VALUES (?, 'Coding', 'code')", (group_id,))
        coding_id = cursor.lastrowid
        conn.commit()
    
    # Add 3 entries RECENTLY (within 180 days)
    today = date.today().isoformat()
    db.add_mood_entry(user_id, today, 5, "Recent", selected_options=[coffee_id, coding_id])
    db.add_mood_entry(user_id, today, 5, "Recent", selected_options=[coffee_id, coding_id])
    db.add_mood_entry(user_id, today, 5, "Recent", selected_options=[coffee_id, coding_id])

    # Verify query finds them
    results = db.get_advanced_correlations(user_id, days=180)
    assert len(results) == 1
    assert results[0]['frequency'] == 3

    # Add 4 entries OLD (older than 180 days)
    old_date = (date.today() - timedelta(days=200)).isoformat()
    db.add_mood_entry(user_id, old_date, 5, "Old", selected_options=[coffee_id, coding_id])
    db.add_mood_entry(user_id, old_date, 5, "Old", selected_options=[coffee_id, coding_id])
    db.add_mood_entry(user_id, old_date, 5, "Old", selected_options=[coffee_id, coding_id])
    db.add_mood_entry(user_id, old_date, 5, "Old", selected_options=[coffee_id, coding_id])

    # Verify query STILL only finds 3 (ignoring the 4 old ones)
    results = db.get_advanced_correlations(user_id, days=180)
    assert len(results) == 1
    assert results[0]['frequency'] == 3

    # Verify expanding window finds all 7
    results_all = db.get_advanced_correlations(user_id, days=365)
    assert len(results_all) == 1
    assert results_all[0]['frequency'] == 7

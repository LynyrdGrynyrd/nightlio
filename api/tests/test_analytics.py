
import pytest
from datetime import date
from api.database import MoodDatabase
from api.services.analytics_service import AnalyticsService

@pytest.fixture
def db(tmp_path):
    db_path = tmp_path / "test_nightlio.db"
    return MoodDatabase(str(db_path), init=True)

@pytest.fixture
def service(db):
    return AnalyticsService(db)

def test_activity_correlations(db, service):
    user_id = 999
    # Create user
    user_data = db.upsert_user_by_google_id(str(user_id), "test@example.com", "Test User", "")
    user_id = user_data["id"]

    # Create dummy activities (options)
    # We need to know their IDs. Let's assume groups are created by default or we need to add them.
    # Actually, MoodDatabase might not have `add_group_option` exposed directly, but GroupsMixin does.
    with db._connect() as conn:
        cursor = conn.execute("INSERT INTO groups (name) VALUES ('Activities')")
        group_id = cursor.lastrowid
        
        cursor = conn.execute("INSERT INTO group_options (group_id, name, icon) VALUES (?, 'Gaming', 'gamepad')", (group_id,))
        gaming_id = cursor.lastrowid
        
        cursor = conn.execute("INSERT INTO group_options (group_id, name, icon) VALUES (?, 'Exercise', 'dumbbell')", (group_id,))
        exercise_id = cursor.lastrowid
        conn.commit()

    # Create entries
    # 3 entries with Gaming: Moods 5, 5, 5 -> Avg 5
    # 3 entries with Exercise: Moods 1, 2, 3 -> Avg 2
    # Overall average: (5+5+5+1+2+3) / 6 = 21/6 = 3.5

    db.add_mood_entry(user_id, "2023-01-01", 5, "Test", selected_options=[gaming_id])
    db.add_mood_entry(user_id, "2023-01-02", 5, "Test", selected_options=[gaming_id])
    db.add_mood_entry(user_id, "2023-01-03", 5, "Test", selected_options=[gaming_id])

    db.add_mood_entry(user_id, "2023-01-04", 1, "Test", selected_options=[exercise_id])
    db.add_mood_entry(user_id, "2023-01-05", 2, "Test", selected_options=[exercise_id])
    db.add_mood_entry(user_id, "2023-01-06", 3, "Test", selected_options=[exercise_id])

    # Test Analytics
    result = service.get_activity_correlations(user_id)
    
    assert result["overall_average"] == 3.5
    activities = result["activities"]
    assert len(activities) == 2

    # Gaming impact: 5 - 3.5 = +1.5
    gaming = next(a for a in activities if a["id"] == gaming_id)
    assert gaming["average_mood"] == 5.0
    assert gaming["impact_score"] == 1.5

    # Exercise impact: 2 - 3.5 = -1.5
    exercise = next(a for a in activities if a["id"] == exercise_id)
    assert exercise["average_mood"] == 2.0
    assert exercise["impact_score"] == -1.5

def test_co_occurrence(db, service):
    user_id = 888
    user_data = db.upsert_user_by_google_id(str(user_id), "co@example.com", "Co User", "")
    user_id = user_data["id"]

    with db._connect() as conn:
        cursor = conn.execute("INSERT INTO groups (name) VALUES ('Activities')")
        group_id = cursor.lastrowid
        
        cursor = conn.execute("INSERT INTO group_options (group_id, name) VALUES (?, 'Pizza')", (group_id,))
        pizza_id = cursor.lastrowid
        
        cursor = conn.execute("INSERT INTO group_options (group_id, name) VALUES (?, 'Beer')", (group_id,))
        beer_id = cursor.lastrowid
        conn.commit()

    # Create 3 entries with Pizza AND Beer
    db.add_mood_entry(user_id, "2023-01-01", 5, "Party", selected_options=[pizza_id, beer_id])
    db.add_mood_entry(user_id, "2023-01-02", 5, "Party", selected_options=[pizza_id, beer_id])
    db.add_mood_entry(user_id, "2023-01-03", 5, "Party", selected_options=[pizza_id, beer_id])
    
    # Create 1 entry with just Pizza
    db.add_mood_entry(user_id, "2023-01-04", 3, "Lunch", selected_options=[pizza_id])

    result = service.get_tag_co_occurrence(user_id)
    assert len(result) == 1
    pair = result[0]
    # Names should be Pizza and Beer (order might vary but logic sorts by ID < ID)
    # 100 < 101 logic -> min_id < max_id
    min_id = min(pizza_id, beer_id)
    max_id = max(pizza_id, beer_id)
    
    assert pair["option1_id"] == min_id
    assert pair["option2_id"] == max_id
    assert pair["frequency"] == 3

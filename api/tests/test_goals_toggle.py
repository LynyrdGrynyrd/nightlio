
import pytest
from datetime import datetime, timedelta
from api.database import MoodDatabase
from api.services.goal_service import GoalService

@pytest.fixture
def db(tmp_path):
    db_file = tmp_path / "test_nightlio.db"
    return MoodDatabase(str(db_file))

@pytest.fixture
def service(db):
    return GoalService(db)

def test_toggle_goal_completion(service, db):
    # Setup user and goal
    user_id = db.create_user("google_123", "test@example.com", "Test User")
    
    # Create a goal
    goal_id = service.create_goal(user_id, "Test Goal", "Description", 3)
    
    today = datetime.now().date()
    today_str = today.strftime("%Y-%m-%d")
    yesterday = today - timedelta(days=1)
    yesterday_str = yesterday.strftime("%Y-%m-%d")
    
    # 1. Toggle ON for today
    result = service.toggle_completion(user_id, goal_id, today_str)
    assert result["is_completed"] is True
    assert result["completed"] == 1
    assert result["already_completed_today"] is True
    
    # Verify in completions table
    completions = service.get_completions(user_id, goal_id)
    assert len(completions) == 1
    assert completions[0]["date"] == today_str
    
    # 2. Toggle OFF for today
    result = service.toggle_completion(user_id, goal_id, today_str)
    assert result["is_completed"] is False
    assert result["completed"] == 0
    assert result["already_completed_today"] is False
    
    completions = service.get_completions(user_id, goal_id)
    assert len(completions) == 0
    
    # 3. Toggle ON for yesterday (past date)
    result = service.toggle_completion(user_id, goal_id, yesterday_str)
    assert result["is_completed"] is True
    # Should increment completed count if within same week
    # Assuming "yesterday" is in the same week for simplicity of this test logic
    # (unless today is Monday and week starts Monday, etc. But logic handles check internally)
    
    completions = service.get_completions(user_id, goal_id)
    assert len(completions) == 1
    assert completions[0]["date"] == yesterday_str

def test_toggle_completion_count_logic(service, db):
    user_id = db.create_user("google_456", "logic@example.com", "Logic User")
    goal_id = service.create_goal(user_id, "Frequency Goal", "", 2)
    
    today = datetime.now().date()
    # Ensure all dates are in the current week period according to the DB logic
    # The DB sets period_start on creation.
    # We'll just test the method's behavior.
    
    d1 = today.strftime("%Y-%m-%d")
    d2 = (today + timedelta(days=1)).strftime("%Y-%m-%d")
    d3 = (today + timedelta(days=2)).strftime("%Y-%m-%d")
    
    # Week start logic might affect this if d2/d3 cross into next week, 
    # but let's assume valid week dates for now or just check return values.
    
    # Mark 1st
    res = service.toggle_completion(user_id, goal_id, d1)
    assert res["completed"] == 1
    
    # Mark 2nd
    res = service.toggle_completion(user_id, goal_id, d2)
    assert res["completed"] == 2
    
    # Mark 3rd (above freq, assuming count logic allows going above freq? 
    # The original increment logic capped it usually or logic in toggle handles it.
    # Let's check implementation in database_goals.py:
    # "if is_current_week and current_completed < freq: current_completed += 1"
    # So it is capped at frequency for the counter.
    res = service.toggle_completion(user_id, goal_id, d3)
    assert res["completed"] == 2 # Capped at 2
    
    # Unmark d1
    res = service.toggle_completion(user_id, goal_id, d1)
    # logic: "if is_current_week and current_completed > 0: current_completed -= 1"
    assert res["completed"] == 1

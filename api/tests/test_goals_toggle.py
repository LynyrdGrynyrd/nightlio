
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
    
    # Get the goal's period_start to ensure we use dates within the same week
    goal = service.get_goal(user_id, goal_id)
    period_start = goal["period_start"]
    week_start = datetime.strptime(period_start, "%Y-%m-%d").date()
    
    # Use dates from the start of the goal's week to avoid week boundary issues
    d1 = week_start.strftime("%Y-%m-%d")
    d2 = (week_start + timedelta(days=1)).strftime("%Y-%m-%d")
    d3 = (week_start + timedelta(days=2)).strftime("%Y-%m-%d")
    
    # Mark 1st
    res = service.toggle_completion(user_id, goal_id, d1)
    assert res["completed"] == 1
    
    # Mark 2nd
    res = service.toggle_completion(user_id, goal_id, d2)
    assert res["completed"] == 2
    
    # Mark 3rd (above freq, count should be capped at frequency for display)
    res = service.toggle_completion(user_id, goal_id, d3)
    assert res["completed"] == 2  # Capped at frequency of 2
    
    # Unmark d1
    res = service.toggle_completion(user_id, goal_id, d1)
    # After removing d1, there are 2 completions (d2, d3) in the week, capped at 2
    assert res["completed"] == 2


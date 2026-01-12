import pytest
from api.database import MoodDatabase

@pytest.fixture
def db(tmp_path):
    db_file = tmp_path / "test_nightlio.db"
    return MoodDatabase(str(db_file))

def test_create_group_option_with_icon(db: MoodDatabase):
    """Test creating a group option with an icon."""
    # Create a group
    group_id = db.create_group("Hobbies")
    
    # Create an option with an icon
    option_id = db.create_group_option(group_id, "Gaming", icon="Gamepad2")
    assert option_id > 0
    
    # Verify the option was created with the icon
    groups = db.get_all_groups()
    target_group = next(g for g in groups if g["id"] == group_id)
    target_option = next(o for o in target_group["options"] if o["id"] == option_id)
    
    assert target_option["name"] == "Gaming"
    assert target_option["icon"] == "Gamepad2"

def test_create_group_option_without_icon(db: MoodDatabase):
    """Test creating a group option without an icon (backward compatibility)."""
    # Create a group
    group_id = db.create_group("Work")
    
    # Create an option without an icon
    option_id = db.create_group_option(group_id, "Coding")
    assert option_id > 0
    
    # Verify the option was created with None icon
    groups = db.get_all_groups()
    target_group = next(g for g in groups if g["id"] == group_id)
    target_option = next(o for o in target_group["options"] if o["id"] == option_id)
    
    assert target_option["name"] == "Coding"
    assert target_option["icon"] is None

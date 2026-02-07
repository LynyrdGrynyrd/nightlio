from typing import List, Dict, Optional
from api.database import MoodDatabase


class GroupService:
    def __init__(self, db: MoodDatabase):
        self._db = db

    def get_all_groups(self) -> List[Dict]:
        """Get all groups with their options (legacy, for backward compatibility)"""
        return self._db.get_all_groups()

    def get_groups_for_user(self, user_id: int) -> List[Dict]:
        """Get all groups for a specific user, or global groups if not user-specific"""
        if hasattr(self._db, 'get_groups_for_user'):
            return self._db.get_groups_for_user(user_id)
        # Fallback to global groups for backward compatibility
        return self._db.get_all_groups()

    def create_group(self, user_id: int, name: str) -> int:
        """Create a new group for a user"""
        if not name.strip():
            raise ValueError("Group name cannot be empty")

        if hasattr(self._db, 'create_group_for_user'):
            return self._db.create_group_for_user(user_id, name.strip())
        # Fallback to global group creation
        return self._db.create_group(name.strip())

    def create_group_option(self, group_id: int, name: str, icon: Optional[str] = None) -> int:
        """Create a new option for a group"""
        if not name.strip():
            raise ValueError("Option name cannot be empty")

        return self._db.create_group_option(group_id, name.strip(), icon)

    def delete_group(self, group_id: int) -> bool:
        """Delete a group and all its options"""
        return self._db.delete_group(group_id)

    def delete_group_option(self, option_id: int) -> bool:
        """Delete a group option"""
        return self._db.delete_group_option(option_id)

    def move_group_option(self, option_id: int, new_group_id: int) -> bool:
        """Move an option to a different group"""
        return self._db.update_option_group(option_id, new_group_id)

    def verify_group_ownership(self, group_id: int, user_id: int) -> bool:
        """Verify that a group belongs to a user"""
        if hasattr(self._db, 'verify_group_ownership'):
            return self._db.verify_group_ownership(group_id, user_id)
        # For global groups (no user_id), always return True if group exists
        return self._db.group_exists(group_id) if hasattr(self._db, 'group_exists') else True

    def verify_option_ownership(self, option_id: int, user_id: int) -> bool:
        """Verify that an option belongs to a user's group"""
        if hasattr(self._db, 'verify_option_ownership'):
            return self._db.verify_option_ownership(option_id, user_id)
        # For global groups (no user_id), always return True if option exists
        return self._db.option_exists(option_id) if hasattr(self._db, 'option_exists') else True

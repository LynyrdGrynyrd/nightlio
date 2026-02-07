"""Service layer for important days / countdowns."""

from typing import Dict, List, Optional
from api.database import MoodDatabase


class ImportantDaysService:
    """Business logic for important days and countdowns."""

    def __init__(self, db: MoodDatabase):
        self._db = db

    def get_important_days(self, user_id: int) -> List[Dict]:
        """Get all important days for a user with calculated countdowns."""
        return self._db.get_important_days(user_id)

    def get_important_day_by_id(self, user_id: int, day_id: int) -> Optional[Dict]:
        """Get a specific important day by ID."""
        return self._db.get_important_day_by_id(user_id, day_id)

    def create_important_day(
        self,
        user_id: int,
        title: str,
        target_date: str,
        category: str = "Custom",
        icon: str = "calendar",
        recurring_type: str = "once",
        remind_days_before: int = 1,
        notes: Optional[str] = None,
    ) -> int:
        """Create a new important day."""
        if not title or not title.strip():
            raise ValueError("Title is required")
        if not target_date:
            raise ValueError("Target date is required")

        return self._db.create_important_day(
            user_id=user_id,
            title=title.strip(),
            target_date=target_date,
            category=category,
            icon=icon,
            recurring_type=recurring_type,
            remind_days_before=remind_days_before,
            notes=notes,
        )

    def update_important_day(
        self,
        user_id: int,
        day_id: int,
        title: Optional[str] = None,
        target_date: Optional[str] = None,
        category: Optional[str] = None,
        icon: Optional[str] = None,
        recurring_type: Optional[str] = None,
        remind_days_before: Optional[int] = None,
        notes: Optional[str] = None,
    ) -> bool:
        """Update an important day."""
        return self._db.update_important_day(
            user_id=user_id,
            day_id=day_id,
            title=title,
            target_date=target_date,
            category=category,
            icon=icon,
            recurring_type=recurring_type,
            remind_days_before=remind_days_before,
            notes=notes,
        )

    def delete_important_day(self, user_id: int, day_id: int) -> bool:
        """Delete an important day."""
        return self._db.delete_important_day(user_id, day_id)

    def get_upcoming_important_days(
        self, user_id: int, days_ahead: int = 30
    ) -> List[Dict]:
        """Get important days occurring within the next N days."""
        return self._db.get_upcoming_important_days(user_id, days_ahead)

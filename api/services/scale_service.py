"""Service layer for scale definitions and entries."""

from typing import Dict, List, Optional
from api.database import MoodDatabase


class ScaleService:
    """Business logic for custom scales (Sleep, Energy, Stress, etc.)."""

    def __init__(self, db: MoodDatabase):
        self._db = db

    def get_user_scales(self, user_id: int) -> List[Dict]:
        """Get all scale definitions for a user."""
        return self._db.get_user_scales(user_id)

    def create_scale(
        self,
        user_id: int,
        name: str,
        min_label: Optional[str] = None,
        max_label: Optional[str] = None,
        color_hex: Optional[str] = None,
    ) -> int:
        """Create a new scale definition for a user."""
        if not name or not name.strip():
            raise ValueError("Scale name is required")
        return self._db.create_scale(
            user_id,
            name.strip(),
            min_label=min_label,
            max_label=max_label,
            color_hex=color_hex,
        )

    def update_scale(
        self,
        user_id: int,
        scale_id: int,
        name: Optional[str] = None,
        min_label: Optional[str] = None,
        max_label: Optional[str] = None,
        color_hex: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> Optional[Dict]:
        """Update a scale definition."""
        return self._db.update_scale(
            user_id,
            scale_id,
            name=name,
            min_label=min_label,
            max_label=max_label,
            color_hex=color_hex,
            is_active=is_active,
        )

    def delete_scale(self, user_id: int, scale_id: int) -> bool:
        """Soft delete a scale (deactivate)."""
        return self._db.delete_scale(user_id, scale_id)

    def save_scale_entries(self, entry_id: int, scale_values: Dict[int, int]) -> None:
        """Save scale values for a mood entry."""
        self._db.save_scale_entries(entry_id, scale_values)

    def get_scale_entries_for_mood(self, entry_id: int) -> List[Dict]:
        """Get scale entries for a specific mood entry."""
        return self._db.get_scale_entries_for_mood(entry_id)

    def get_scale_entries_for_entries(self, entry_ids: List[int]) -> Dict[int, List[Dict]]:
        """Get scale entries for multiple mood entries (batch query)."""
        return self._db.get_scale_entries_for_entries(entry_ids)

    def get_scale_averages(self, user_id: int, days: int = 30) -> List[Dict]:
        """Get average scale values over a time period."""
        return self._db.get_scale_averages(user_id, days)

    def get_user_scale_entries(
        self,
        user_id: int,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict]:
        """Get all scale entries for a user within a date range."""
        return self._db.get_user_scale_entries(user_id, start_date, end_date)

    def verify_entry_ownership(self, entry_id: int, user_id: int) -> bool:
        """Verify that a mood entry belongs to a user."""
        return self._db.verify_entry_ownership(entry_id, user_id)

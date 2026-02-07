from typing import List, Optional, Dict
from api.database import MoodDatabase
from api.models.mood_entry import MoodEntry


class MoodService:
    def __init__(self, db: MoodDatabase):
        self.db = db

    def create_mood_entry(
        self,
        user_id: int,
        date: str,
        mood: int,
        content: str,
        time: Optional[str] = None,
        selected_options: Optional[List[int]] = None,
    ) -> Dict:
        """Create a new mood entry and check for achievements"""
        if not (1 <= mood <= 5):
            raise ValueError("Mood must be between 1 and 5")

        if not content.strip():
            raise ValueError("Content cannot be empty")

        entry_id = self.db.add_mood_entry(
            user_id, date, mood, content, time, selected_options
        )

        # Check for new achievements
        new_achievements = self.db.check_achievements(user_id)

        return {"entry_id": entry_id, "new_achievements": new_achievements}

    def get_all_entries(self, user_id: int) -> List[Dict]:
        """Get all mood entries for a user"""
        return self.db.get_all_mood_entries(user_id)

    def get_all_entries_hydrated(
        self,
        user_id: int,
        include_selections: bool = False,
        include_media: bool = False,
        include_scales: bool = False
    ) -> List[Dict]:
        """Get all mood entries with optional inline selections, media, and scales."""
        entries = self.db.get_all_mood_entries(user_id)

        if not entries:
            return entries

        entry_ids = [e['id'] for e in entries]

        selections_map: Dict[int, List[Dict]] = {}
        if include_selections:
            selections_map = self.db.get_selections_for_entries(entry_ids)

        media_map: Dict[int, List[Dict]] = {}
        if include_media:
            media_map = self.db.get_media_for_entries(entry_ids)

        scales_map: Dict[int, List[Dict]] = {}
        if include_scales:
            scales_map = self.db.get_scale_entries_for_entries(entry_ids)

        for entry in entries:
            eid = entry['id']
            if include_selections:
                entry['selections'] = selections_map.get(eid, [])
            if include_media:
                entry['media'] = media_map.get(eid, [])
            if include_scales:
                entry['scale_entries'] = scales_map.get(eid, [])

        return entries

    def get_entries_by_date_range(
        self, user_id: int, start_date: str, end_date: str
    ) -> List[Dict]:
        """Get mood entries within a date range for a user"""
        return self.db.get_mood_entries_by_date_range(user_id, start_date, end_date)

    def get_entry_by_id(self, user_id: int, entry_id: int) -> Optional[Dict]:
        """Get a specific mood entry by ID for a user"""
        return self.db.get_mood_entry_by_id(user_id, entry_id)

    def update_entry(
        self,
        user_id: int,
        entry_id: int,
        mood: Optional[int] = None,
        content: Optional[str] = None,
        date: Optional[str] = None,
        time: Optional[str] = None,
        selected_options: Optional[List[int]] = None,
    ) -> Optional[Dict]:
        """Update an existing mood entry for a user and return the updated record"""
        if mood is not None and not (1 <= mood <= 5):
            raise ValueError("Mood must be between 1 and 5")

        if content is not None and not content.strip():
            raise ValueError("Content cannot be empty")

        updated = self.db.update_mood_entry(
            user_id,
            entry_id,
            mood=mood,
            content=content,
            date=date,
            time=time,
            selected_options=selected_options,
        )

        if not updated:
            return None

        entry = self.db.get_mood_entry_by_id(user_id, entry_id)
        if not entry:
            return None

        selections = self.db.get_entry_selections(entry_id)
        entry["selections"] = selections
        return entry

    def delete_entry(self, user_id: int, entry_id: int) -> bool:
        """Delete a mood entry for a user"""
        return self.db.delete_mood_entry(user_id, entry_id)

    def get_statistics(self, user_id: int) -> Dict:
        """Get mood statistics for a user"""
        # Track statistics view for achievements (Data Lover)
        try:
            self.db.increment_stats_view(user_id)
        except Exception:
            # Metrics should not break stats
            pass
        stats = self.db.get_mood_statistics(user_id)
        mood_counts = self.db.get_mood_counts(user_id)
        current_streak = self.db.get_current_streak(user_id)

        return {
            "statistics": stats,
            "mood_distribution": mood_counts,
            "current_streak": current_streak,
        }

    def get_current_streak(self, user_id: int) -> int:
        """Get current consecutive days streak for a user"""
        return self.db.get_current_streak(user_id)

    def get_entry_selections(self, user_id: int, entry_id: int) -> List[Dict]:
        """Get selected options for an entry (with user verification)"""
        # First verify the entry belongs to the user
        entry = self.db.get_mood_entry_by_id(user_id, entry_id)
        if not entry:
            return []
        return self.db.get_entry_selections(entry_id)

    def search_entries(
        self,
        user_id: int,
        query: str,
        moods: Optional[List[int]] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> Dict:
        """Search entries for a user with pagination.

        Returns:
            Dict with 'entries' list and 'total' count
        """
        return self.db.search_mood_entries(
            user_id, query, moods, start_date, end_date, page, per_page
        )

    def get_streak_details(self, user_id: int) -> Dict:
        """Get detailed streak information for a user"""
        return self.db.get_streak_details(user_id)


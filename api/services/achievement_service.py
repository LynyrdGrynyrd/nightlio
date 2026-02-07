from __future__ import annotations

from typing import Dict, List

from api.database import MoodDatabase


class AchievementService:
    def __init__(self, db: MoodDatabase):
        self.db = db

        # Backend source of truth for achievement definitions.
        # Frontend should consume this contract directly.
        self.achievements: Dict[str, Dict] = {
            "first_entry": {
                "achievement_type": "first_entry",
                "name": "First Entry",
                "description": "Log your first mood entry",
                "icon": "Zap",
                "rarity": "common",
                "category": "milestones",
                "secret": False,
                "target": 1,
            },
            "week_warrior": {
                "achievement_type": "week_warrior",
                "name": "Week Warrior",
                "description": "Maintain a 7-day streak",
                "icon": "Flame",
                "rarity": "uncommon",
                "category": "streak",
                "secret": False,
                "target": 7,
            },
            "consistency_king": {
                "achievement_type": "consistency_king",
                "name": "Consistency King",
                "description": "Maintain a 30-day streak",
                "icon": "Crown",
                "rarity": "rare",
                "category": "streak",
                "secret": False,
                "target": 30,
            },
            "data_lover": {
                "achievement_type": "data_lover",
                "name": "Data Lover",
                "description": "View statistics 10 times",
                "icon": "BarChart3",
                "rarity": "uncommon",
                "category": "analytics",
                "secret": False,
                "target": 10,
            },
            "mood_master": {
                "achievement_type": "mood_master",
                "name": "Mood Master",
                "description": "Log 100 total entries",
                "icon": "Target",
                "rarity": "legendary",
                "category": "milestones",
                "secret": False,
                "target": 100,
            },
            "complex_person": {
                "achievement_type": "complex_person",
                "name": "Complex Person",
                "description": "Experience all 5 mood levels",
                "icon": "Sparkles",
                "rarity": "uncommon",
                "category": "moods",
                "secret": False,
                "target": 5,
            },
            "half_year": {
                "achievement_type": "half_year",
                "name": "Half Year Hero",
                "description": "Maintain a 180-day streak",
                "icon": "Medal",
                "rarity": "legendary",
                "category": "streak",
                "secret": False,
                "target": 180,
            },
            "devoted": {
                "achievement_type": "devoted",
                "name": "Devoted",
                "description": "Maintain a 365-day streak",
                "icon": "Trophy",
                "rarity": "legendary",
                "category": "streak",
                "secret": True,
                "target": 365,
            },
            "photographer": {
                "achievement_type": "photographer",
                "name": "Photographer",
                "description": "Attach 50 photos to entries",
                "icon": "Camera",
                "rarity": "rare",
                "category": "media",
                "secret": False,
                "target": 50,
            },
            "goal_crusher": {
                "achievement_type": "goal_crusher",
                "name": "Goal Crusher",
                "description": "Complete 10 goals",
                "icon": "CheckCircle2",
                "rarity": "rare",
                "category": "goals",
                "secret": False,
                "target": 10,
            },
            "comeback_king": {
                "achievement_type": "comeback_king",
                "name": "Comeback King",
                "description": "Return to a 7-day streak after losing a longer one",
                "icon": "RefreshCw",
                "rarity": "rare",
                "category": "streak",
                "secret": True,
                "target": 7,
            },
            "milestone_50": {
                "achievement_type": "milestone_50",
                "name": "Getting Started",
                "description": "Log 50 entries",
                "icon": "Award",
                "rarity": "uncommon",
                "category": "milestones",
                "secret": False,
                "target": 50,
            },
            "milestone_250": {
                "achievement_type": "milestone_250",
                "name": "Journaling Journey",
                "description": "Log 250 entries",
                "icon": "Star",
                "rarity": "rare",
                "category": "milestones",
                "secret": False,
                "target": 250,
            },
            "milestone_500": {
                "achievement_type": "milestone_500",
                "name": "Prolific Writer",
                "description": "Log 500 entries",
                "icon": "Gem",
                "rarity": "legendary",
                "category": "milestones",
                "secret": False,
                "target": 500,
            },
        }

    def get_achievement_info(self, achievement_type: str) -> Dict:
        """Get achievement metadata."""
        return self.achievements.get(achievement_type, {})

    def get_achievement_definitions(self) -> List[Dict]:
        """Return all achievement definitions for frontend rendering."""
        return list(self.achievements.values())

    def get_user_achievements(self, user_id: int) -> List[Dict]:
        """Get user achievements with metadata."""
        achievements = self.db.get_user_achievements(user_id)

        for achievement in achievements:
            achievement_info = self.get_achievement_info(achievement["achievement_type"])
            achievement.update(achievement_info)

        return achievements

    def check_and_award_achievements(self, user_id: int) -> List[Dict]:
        """Check for new achievements and return them with metadata."""
        new_achievement_types = self.db.check_achievements(user_id)

        new_achievements = []
        for achievement_type in new_achievement_types:
            achievement_info = dict(self.get_achievement_info(achievement_type))
            achievement_info["achievement_type"] = achievement_type
            new_achievements.append(achievement_info)

        return new_achievements

    def get_achievement_progress_dto(self, user_id: int) -> List[Dict]:
        """Return standardized progress DTO array for all achievement definitions."""
        progress_map = self.db.get_achievements_progress(user_id)
        unlocked = {
            item["achievement_type"] for item in self.db.get_user_achievements(user_id)
        }

        dto: List[Dict] = []
        for achievement_type, definition in self.achievements.items():
            progress = progress_map.get(achievement_type, {})
            current = int(progress.get("current", 0))
            maximum = int(progress.get("max", definition.get("target", 1) or 1))
            maximum = max(maximum, 1)
            percent = min(100, max(0, int(round((current / maximum) * 100))))
            is_unlocked = achievement_type in unlocked

            dto.append(
                {
                    **definition,
                    "achievement_type": achievement_type,
                    "current": min(current, maximum),
                    "max": maximum,
                    "percent": percent,
                    "is_unlocked": is_unlocked,
                }
            )

        return dto


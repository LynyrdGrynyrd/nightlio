"""Twilightio database facade built from modular mixins."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from api.database_achievements import AchievementsMixin
from api.database_analytics import AnalyticsMixin
from api.database_common import (
    DatabaseConnectionMixin,
    DatabaseError,
    SQLQueries,
    logger,
)
from api.database_goals import GoalsMixin
from api.database_groups import GroupsMixin
from api.database_important_days import ImportantDaysMixin
from api.database_media import MediaMixin
from api.database_moods import MoodEntriesMixin, MoodDefinitionMixin
from api.database_scales import ScalesMixin
from api.database_schema import DatabaseSchemaMixin
from api.database_users import UsersMixin
from api.database_settings import SettingsMixin


class MoodDatabase(
    DatabaseSchemaMixin,
    UsersMixin,
    GoalsMixin,
    MoodEntriesMixin,
    MoodDefinitionMixin,
    ScalesMixin,
    GroupsMixin,
    AchievementsMixin,
    MediaMixin,
    AnalyticsMixin,
    ImportantDaysMixin,
    SettingsMixin,
):
    """High-level facade composing all database-related mixins."""

    db_path: str

    def __init__(self, db_path: Optional[str] = None, *, init: bool = True) -> None:
        data_dir = Path(__file__).resolve().parent.parent / "data"
        data_dir.mkdir(parents=True, exist_ok=True)

        resolved_path = (
            Path(db_path) if db_path is not None else data_dir / "twilightio.db"
        )
        self.db_path = str(resolved_path)

        logger.debug("MoodDatabase configured with db_path=%s", self.db_path)

        if init:
            self.init_database()

    def __repr__(self) -> str:  # pragma: no cover - convenience helper
        return f"MoodDatabase(db_path={self.db_path!r})"


__all__ = [
    "MoodDatabase",
    "DatabaseConnectionMixin",
    "DatabaseError",
    "SQLQueries",
    "logger",
]

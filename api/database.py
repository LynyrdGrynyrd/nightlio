"""Nightlio database facade built from modular mixins."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

try:  # pragma: no cover - fallback for script execution
    from .database_achievements import AchievementsMixin
    from .database_analytics import AnalyticsMixin
    from .database_common import (
        DatabaseConnectionMixin,
        DatabaseError,
        SQLQueries,
        logger,
    )
    from .database_goals import GoalsMixin
    from .database_groups import GroupsMixin
    from .database_important_days import ImportantDaysMixin
    from .database_media import MediaMixin
    from .database_moods import MoodEntriesMixin, MoodDefinitionMixin
    from .database_scales import ScalesMixin
    from .database_schema import DatabaseSchemaMixin
    from .database_schema import DatabaseSchemaMixin
    from .database_users import UsersMixin
    from .database_settings import SettingsMixin
except ImportError:  # pragma: no cover - executed when run as a script module
    from database_achievements import AchievementsMixin  # type: ignore
    from database_analytics import AnalyticsMixin  # type: ignore
    from database_common import (  # type: ignore
        DatabaseConnectionMixin,
        DatabaseError,
        SQLQueries,
        logger,
    )
    from database_goals import GoalsMixin  # type: ignore
    from database_groups import GroupsMixin  # type: ignore
    from database_important_days import ImportantDaysMixin  # type: ignore
    from database_media import MediaMixin  # type: ignore
    from database_moods import MoodEntriesMixin, MoodDefinitionMixin  # type: ignore
    from database_scales import ScalesMixin  # type: ignore
    from database_schema import DatabaseSchemaMixin  # type: ignore
    from database_users import UsersMixin  # type: ignore
    from database_settings import SettingsMixin  # type: ignore


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
            Path(db_path) if db_path is not None else data_dir / "nightlio.db"
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

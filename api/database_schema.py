"""Database schema helpers for Twilightio."""

from __future__ import annotations

import sqlite3
from typing import Iterable

try:  # pragma: no cover - allow module to run outside package context
    from .database_common import DatabaseConnectionMixin, logger
except ImportError:  # pragma: no cover - fallback for scripts
    from database_common import DatabaseConnectionMixin, logger  # type: ignore


class DatabaseSchemaMixin(DatabaseConnectionMixin):
    """Provides table creation and bootstrap helpers."""

    def init_database(self) -> None:
        """Initialize the database with required tables and seed data."""
        try:
            logger.info("Initializing database at: %s", self.db_path)
            with sqlite3.connect(self.db_path) as conn:
                logger.info("Database connection successful. Creating tables...")

                # Core tables
                self._create_users_table(conn)
                self._create_mood_entries_table(conn)
                self._create_groups_table(conn)
                self._create_group_options_table(conn)
                self._create_entry_selections_table(conn)
                self._create_achievements_table(conn)

                # Goals and metrics
                self._create_goals_table(conn)
                self._create_goal_completions_table(conn)
                self._create_user_metrics_table(conn)

                # Push Notifications
                self._create_reminders_table(conn)
                self._create_reminders_table(conn)
                self._create_push_subscriptions_table(conn)
                self._create_media_table(conn)
                self._create_fts_tables(conn)

                # Custom moods and scales
                self._create_mood_definitions_table(conn)
                self._create_scale_tables(conn)

                # Important days / countdowns
                self._create_important_days_table(conn)

                # App Lock / Settings
                if hasattr(self, "_create_settings_table"):
                    self._create_settings_table(conn)

                # Shared indexes
                self._create_database_indexes(conn)

                conn.commit()
                logger.info("Database initialization complete")

            self._insert_default_groups()
        except Exception as exc:  # pragma: no cover - initialization rarely fails
            logger.error("Database initialization failed: %s", exc)
            raise

    # --- Table creation helpers -------------------------------------------------
    def _create_users_table(self, conn: sqlite3.Connection) -> None:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                google_id TEXT UNIQUE NOT NULL,
                email TEXT NOT NULL,
                name TEXT NOT NULL,
                avatar_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        logger.info("Users table ready")

    def _create_mood_entries_table(self, conn: sqlite3.Connection) -> None:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS mood_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
            """
        )
        logger.info("Mood entries table ready")

    def _create_groups_table(self, conn: sqlite3.Connection) -> None:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        logger.info("Groups table ready")

    def _create_group_options_table(self, conn: sqlite3.Connection) -> None:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS group_options (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                icon TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE
            )
            """
        )
        self._migrate_group_options_schema(conn)
        logger.info("Group options table ready")

    def _migrate_group_options_schema(self, conn: sqlite3.Connection) -> None:
        try:
            cur = conn.execute("PRAGMA table_info(group_options)")
            cols: Iterable[str] = {row[1] for row in cur.fetchall()}
            if "icon" not in cols:
                conn.execute("ALTER TABLE group_options ADD COLUMN icon TEXT")
                logger.info("Group options table migrated to include icon")
        except sqlite3.Error as exc:
            logger.warning("Group options table migration failed (non-critical): %s", exc)

    def _create_entry_selections_table(self, conn: sqlite3.Connection) -> None:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS entry_selections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entry_id INTEGER NOT NULL,
                option_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (entry_id) REFERENCES mood_entries (id) ON DELETE CASCADE,
                FOREIGN KEY (option_id) REFERENCES group_options (id) ON DELETE CASCADE
            )
            """
        )
        logger.info("Entry selections table ready")

    def _create_achievements_table(self, conn: sqlite3.Connection) -> None:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS achievements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                achievement_type TEXT NOT NULL,
                earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                nft_minted BOOLEAN DEFAULT FALSE,
                nft_token_id INTEGER,
                nft_tx_hash TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                UNIQUE(user_id, achievement_type)
            )
            """
        )
        logger.info("Achievements table ready")

    def _create_goals_table(self, conn: sqlite3.Connection) -> None:
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS goals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT,
                    frequency_per_week INTEGER NOT NULL CHECK (frequency_per_week >= 1 AND frequency_per_week <= 7),
                    completed INTEGER NOT NULL DEFAULT 0,
                    streak INTEGER NOT NULL DEFAULT 0,
                    period_start TEXT,
                    last_completed_date TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
                """
            )
            self._migrate_goals_table_schema(conn)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id)")
            logger.info("Goals table ready")
        except sqlite3.Error as exc:
            logger.warning("Goals table creation failed (non-critical): %s", exc)

    def _migrate_goals_table_schema(self, conn: sqlite3.Connection) -> None:
        try:
            cur = conn.execute("PRAGMA table_info(goals)")
            cols: Iterable[str] = {row[1] for row in cur.fetchall()}
            
            if "last_completed_date" not in cols:
                conn.execute("ALTER TABLE goals ADD COLUMN last_completed_date TEXT")
                logger.info("Goals table migrated to include last_completed_date")
            
            # Flexible recurrence columns
            if "frequency_type" not in cols:
                conn.execute("ALTER TABLE goals ADD COLUMN frequency_type TEXT DEFAULT 'weekly'")
                logger.info("Goals table migrated to include frequency_type")
            
            if "target_count" not in cols:
                conn.execute("ALTER TABLE goals ADD COLUMN target_count INTEGER DEFAULT 1")
                logger.info("Goals table migrated to include target_count")
            
            if "custom_days" not in cols:
                conn.execute("ALTER TABLE goals ADD COLUMN custom_days TEXT")
                logger.info("Goals table migrated to include custom_days")
                
        except sqlite3.Error as exc:
            logger.warning("Goals table migration failed (non-critical): %s", exc)

    def _create_goal_completions_table(self, conn: sqlite3.Connection) -> None:
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS goal_completions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    goal_id INTEGER NOT NULL,
                    date TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY (goal_id) REFERENCES goals (id) ON DELETE CASCADE,
                    UNIQUE(user_id, goal_id, date)
                )
                """
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_goal_completions_user_goal ON goal_completions(user_id, goal_id)"
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_goal_completions_date ON goal_completions(date)"
            )
            logger.info("Goal completions table ready")
        except sqlite3.Error as exc:
            logger.warning(
                "Goal completions table creation failed (non-critical): %s", exc
            )

    def _create_user_metrics_table(self, conn: sqlite3.Connection) -> None:
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS user_metrics (
                    user_id INTEGER PRIMARY KEY,
                    stats_views INTEGER NOT NULL DEFAULT 0,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
                """
            )
            logger.info("User metrics table ready")
        except sqlite3.Error as exc:
            logger.warning("User metrics table creation failed (non-critical): %s", exc)

    def _create_database_indexes(self, conn: sqlite3.Connection) -> None:
        try:
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_mood_entries_date ON mood_entries(date)"
            )
            logger.info("Mood entries index ready")
        except sqlite3.Error as exc:
            logger.warning("Index creation failed (non-critical): %s", exc)

    def _create_reminders_table(self, conn: sqlite3.Connection) -> None:
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS reminders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    time TEXT NOT NULL,           -- "09:00" format
                    days_of_week TEXT NOT NULL,   -- JSON array: [0,1,2,3,4,5,6] (Mon-Sun)
                    message TEXT DEFAULT 'Time to log your mood!',
                    is_active BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
                """
            )
            logger.info("Reminders table ready")
        except sqlite3.Error as exc:
            logger.warning("Reminders table creation failed: %s", exc)

    def _create_push_subscriptions_table(self, conn: sqlite3.Connection) -> None:
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS push_subscriptions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    endpoint TEXT NOT NULL,
                    p256dh_key TEXT NOT NULL,
                    auth_key TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                    UNIQUE(user_id, endpoint)
                )
                """
            )
            logger.info("Push subscriptions table ready")
        except sqlite3.Error as exc:
            logger.warning("Push subscriptions table creation failed: %s", exc)

    def _create_media_table(self, conn: sqlite3.Connection) -> None:
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS media_attachments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    entry_id INTEGER NOT NULL,
                    file_path TEXT NOT NULL,
                    file_type TEXT NOT NULL,
                    thumbnail_path TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (entry_id) REFERENCES mood_entries (id) ON DELETE CASCADE
                )
                """
            )
            # Migration: add thumbnail_path if missing
            try:
                conn.execute("ALTER TABLE media_attachments ADD COLUMN thumbnail_path TEXT")
            except sqlite3.OperationalError:
                pass  # Column already exists
            logger.info("Media attachments table ready")
        except sqlite3.Error as exc:
            logger.warning("Media table creation failed: %s", exc)

    def _create_fts_tables(self, conn: sqlite3.Connection) -> None:
        """Create Full-Text Search virtual tables and triggers."""
        try:
            # Check for FTS5 support
            conn.execute("CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(content, content='mood_entries', content_rowid='id')")
            
            # Triggers to keep FTS index in sync with mood_entries
            
            # INSERT trigger
            conn.execute("""
                CREATE TRIGGER IF NOT EXISTS entries_ai AFTER INSERT ON mood_entries BEGIN
                  INSERT INTO entries_fts(rowid, content) VALUES (new.id, new.content);
                END;
            """)
            
            # DELETE trigger
            conn.execute("""
                CREATE TRIGGER IF NOT EXISTS entries_ad AFTER DELETE ON mood_entries BEGIN
                  INSERT INTO entries_fts(entries_fts, rowid, content) VALUES('delete', old.id, old.content);
                END;
            """)
            
            # UPDATE trigger
            conn.execute("""
                CREATE TRIGGER IF NOT EXISTS entries_au AFTER UPDATE ON mood_entries BEGIN
                  INSERT INTO entries_fts(entries_fts, rowid, content) VALUES('delete', old.id, old.content);
                  INSERT INTO entries_fts(rowid, content) VALUES (new.id, new.content);
                END;
            """)
            
            # Populate if empty (initial migration)
            # This is a bit expensive on every startup if we check counts, but safe.
            # Better check strategy: if fts is empty but entries has rows.
            cur = conn.execute("SELECT count(*) FROM entries_fts")
            if cur.fetchone()[0] == 0:
                 conn.execute("INSERT INTO entries_fts(rowid, content) SELECT id, content FROM mood_entries")

            logger.info("FTS tables and triggers ready")
        except sqlite3.Error as exc:
            logger.warning("FTS table creation failed. FTS5 might not be supported: %s", exc)

    # --- Seed helpers -----------------------------------------------------------
    def _insert_default_groups(self) -> None:
        default_groups = {
            "Emotions": [
                "happy",
                "excited",
                "grateful",
                "relaxed",
                "content",
                "tired",
                "unsure",
                "bored",
                "anxious",
                "angry",
                "stressed",
                "sad",
                "desperate",
            ],
            "Sleep": [
                "well-rested",
                "refreshed",
                "tired",
                "exhausted",
                "restless",
                "insomniac",
            ],
            "Productivity": [
                "focused",
                "motivated",
                "accomplished",
                "busy",
                "distracted",
                "procrastinating",
                "overwhelmed",
                "lazy",
            ],
        }

        with self._connect() as conn:
            for group_name, options in default_groups.items():
                cursor = conn.execute(
                    "SELECT id FROM groups WHERE name = ?",
                    (group_name,),
                )
                group_row = cursor.fetchone()

                if not group_row:
                    cursor = conn.execute(
                        "INSERT INTO groups (name) VALUES (?)",
                        (group_name,),
                    )
                    group_id = cursor.lastrowid
                    for option in options:
                        conn.execute(
                            "INSERT INTO group_options (group_id, name) VALUES (?, ?)",
                            (group_id, option),
                        )

            conn.commit()
            logger.info("Default groups ensured")

    def _create_mood_definitions_table(self, conn: sqlite3.Connection) -> None:
        """Create table for custom mood definitions."""
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS mood_definitions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
                    label TEXT NOT NULL,
                    icon TEXT NOT NULL,
                    color_hex TEXT NOT NULL,
                    is_active BOOLEAN DEFAULT 1,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    UNIQUE(user_id, score)
                )
                """
            )
            logger.info("Mood definitions table ready")
        except sqlite3.Error as exc:
            logger.warning("Mood definitions table creation failed: %s", exc)

    def _create_scale_tables(self, conn: sqlite3.Connection) -> None:
        """Create tables for custom scale tracking (Sleep, Energy, Stress, etc.)."""
        try:
            # Scale definitions (user-created scales)
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS scale_definitions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    min_value INTEGER DEFAULT 1,
                    max_value INTEGER DEFAULT 10,
                    min_label TEXT,
                    max_label TEXT,
                    color_hex TEXT,
                    is_active BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
                """
            )
            
            # Scale entries (values recorded with mood entries)
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS scale_entries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    entry_id INTEGER NOT NULL,
                    scale_id INTEGER NOT NULL,
                    value INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (entry_id) REFERENCES mood_entries(id) ON DELETE CASCADE,
                    FOREIGN KEY (scale_id) REFERENCES scale_definitions(id) ON DELETE CASCADE
                )
                """
            )
            logger.info("Scale tables ready")
        except sqlite3.Error as exc:
            logger.warning("Scale tables creation failed: %s", exc)

    def _create_important_days_table(self, conn: sqlite3.Connection) -> None:
        """Create table for important days / countdowns."""
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS important_days (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    date TEXT NOT NULL,
                    icon TEXT DEFAULT 'calendar',
                    category TEXT DEFAULT 'Custom',
                    recurring_type TEXT DEFAULT 'once',
                    remind_days_before INTEGER DEFAULT 1,
                    notes TEXT,
                    is_active BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
                """
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_important_days_user ON important_days(user_id)"
            )
            logger.info("Important days table ready")
        except sqlite3.Error as exc:
            logger.warning("Important days table creation failed: %s", exc)


__all__ = ["DatabaseSchemaMixin"]
